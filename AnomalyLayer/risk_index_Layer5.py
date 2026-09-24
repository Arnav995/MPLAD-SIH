"""
MPLADS-Sentinel — Layer 5: Composite Risk Index & Two-Tier Promotion

Ties Layers 1 (statutory rules), 2 (cost anomaly), and 3 (duplicate/overlap
candidates) into ONE continuous 0-100 risk score per project, with a full
explainability trail and a defensible Tier 1 / Tier 2 gate.

THREE PROBLEMS THIS LAYER SPECIFICALLY SOLVES (from what we found in testing):

1. THE SCORE-CEILING PROBLEM: Layer 1's rule_score caps at 40, so a ₹1 Crore
   e-Library at 10x category median and a routine ₹25L Kalamna tranche could
   both hit the same capped score and appear equally severe. This layer
   blends in Layer 2's *continuous* cost_anomaly_score specifically so
   severity actually differentiates instead of clipping.

2. THE MISSING-LAYER PROBLEM: the original spec weighted 4 components
   (rules/cost/graph/nlp) at 0.35/0.30/0.20/0.15, but the vendor-graph layer
   (Layer 4) isn't built yet. Rather than silently treating a missing
   component as "0 risk" (which would deflate everyone's score) or leaving
   stale weights that don't sum to 1, this layer RENORMALIZES weights across
   whichever components actually have a value for a given row. A project
   with no duplicate-candidate match isn't penalized OR inflated because of
   a layer that doesn't exist yet.

3. THE ALERT-FATIGUE PROBLEM: a continuous score alone doesn't fix alert
   fatigue by itself — you still need a gate. This layer implements the
   two-tier logic explicitly and configurably: Tier 2 requires BOTH (a) at
   least `min_signal_types` independent layers contributing non-zero signal,
   AND (b) at least one "primary risk anchor" — a signal serious enough on
   its own to justify human attention, not just administrative noise like
   an unsanctioned-backlog rule alone.
"""

from __future__ import annotations
import pandas as pd
import numpy as np


# ---- configuration (kept here, in one place, as plain data — not scattered magic numbers) ----

DEFAULT_WEIGHTS = {
    "rules": 0.35,
    "cost": 0.30,
    "duplicate": 0.15,   # this is the "nlp" term from the original 4-component spec
    "graph": 0.20,        # Layer 4 (vendor network) — not built yet; excluded + renormalized until it exists
}

MAX_RULE_SCORE = 40  # must match rule_engine.py's cap

# Which Layer 1 rule IDs are serious enough, alone, to count as a "primary risk anchor".
# Configurable and separate from the rule catalog itself — a rule can exist for
# Tier-1 administrative tracking without being anchor-worthy for Tier 2.
ANCHOR_RULE_IDS = {"R3", "R9", "R10", "D3"}
# R3 = completion overrun (COMPLETION_BREACH), R9/R10 = prohibited category /
# restricted access (STATUTORY_PROHIBITION), D3 = letter-bundle fragmentation
# (LETTER_BUNDLE_FRAGMENTATION). Deliberately NOT including R1/R2/R6/R7/D1/D2 —
# those are administrative-backlog or portfolio-level signals, not anchor-worthy alone.

DUPLICATE_ANCHOR_THRESHOLD = 0.92  # duplicate_suspicion_score at/above this counts as an anchor (0.92 filters out administrative boilerplate like bus stops and GP benches)

# Categories with standardized, small-unit rate cards or bulk beneficiary distribution
# where high NLP similarity across panchayats/beneficiaries is expected administrative behavior.
BULK_DISTRIBUTION_CATEGORIES = {
    "ARTIFICIAL LIMBS / AIDS",
    "ASSISTIVE DEVICES",
    "PANCHAYAT BENCHES",
    "GRAM PANCHAYAT ASSETS",
    "BOREWELL INSTALLATION",
}
BULK_UNIT_COST_CEILING = 100_000  # < Rs 1 Lakh per unit indicates routine rate-card / bulk grant

FAST_TRACK_ABS_CAP_DAYS = 10  # never call something "fast-tracked" if it's merely faster than 10 days


# ---- Fast-track signal (district-relative, computed here since it's a cross-layer signal) ----

def compute_fast_track_signal(
    df: pd.DataFrame,
    district_col: str = "IDA_NAME",
    days_col: str = "days_to_sanction",
    sanction_date_col: str = "SANCTION_DATE",
) -> pd.DataFrame:
    """
    Flags a sanction as suspiciously fast RELATIVE TO ITS OWN DISTRICT'S baseline —
    never an absolute cutoff, since baseline processing speed varies hugely by
    district (a 10-day sanction is unremarkable somewhere and remarkable elsewhere).
    Threshold = min(district's 25th percentile of days_to_sanction, 10 days).
    """
    df = df.copy()
    df["fast_track_flag"] = False
    eligible = df[sanction_date_col].notna() & df[days_col].notna()

    for district, group in df[eligible].groupby(district_col):
        if len(group) < 10:
            continue  # not enough data in this district to establish a reliable baseline
        q25 = group[days_col].quantile(0.25)
        threshold = min(q25, FAST_TRACK_ABS_CAP_DAYS)
        flagged_idx = group.index[group[days_col] <= threshold]
        df.loc[flagged_idx, "fast_track_flag"] = True

    return df


# ---- Duplicate pair aggregation: Layer 3 outputs PAIRS, this layer needs PER-PROJECT ----

def aggregate_duplicate_pairs_to_projects(
    duplicate_pairs_df: pd.DataFrame,
    id_col_a: str = "WORK_RECOMMENDATION_DTL_ID_A",
    id_col_b: str = "WORK_RECOMMENDATION_DTL_ID_B",
    score_col: str = "duplicate_suspicion_score",
    reason_col: str = "reason",
    typology_col: str = "match_typology",
) -> dict:
    """
    A project can appear in multiple candidate pairs. This takes the MAX
    suspicion score across all pairs involving a given project, tracks the
    most severe match_typology, and keeps a reference to paired project(s)
    for the explainability trail. Returns {WORK_RECOMMENDATION_DTL_ID: {...}}.
    """
    if duplicate_pairs_df is None or duplicate_pairs_df.empty:
        return {}

    typology_priority = {
        "TRUE_DUPLICATE": 5,
        "CONTRACT_TRANCHE_SPLIT": 4,
        "UNRESOLVED_SIMILAR_WORK": 3,
        "ADJACENT_SEGMENT_UNCORROBORATED": 2,
        "INDEPENDENT_PARALLEL_WORKS": 1,
    }

    per_project = {}
    for _, row in duplicate_pairs_df.iterrows():
        typology = row.get(typology_col) if typology_col in row else None
        for this_id, other_id in [(row[id_col_a], row[id_col_b]), (row[id_col_b], row[id_col_a])]:
            entry = per_project.setdefault(
                this_id,
                {"score": 0.0, "typology": typology or "UNRESOLVED_SIMILAR_WORK", "paired_with": [], "reason": None}
            )
            curr_prio = typology_priority.get(entry.get("typology"), 0)
            new_prio = typology_priority.get(typology, 0)
            if new_prio > curr_prio or row[score_col] > entry["score"]:
                if typology:
                    entry["typology"] = typology
            if row[score_col] > entry["score"]:
                entry["score"] = row[score_col]
                entry["reason"] = row[reason_col]
            entry["paired_with"].append(other_id)

    return per_project


# ---- core: weighted blend with per-row dynamic renormalization ----

def _none_if_nan(x):
    """pandas silently turns None into NaN in a numeric column — normalize back
    so downstream 'is not None' checks behave correctly instead of leaking NaN
    into arithmetic (NaN propagates through any sum/product silently)."""
    if x is None:
        return None
    try:
        if pd.isna(x):
            return None
    except (TypeError, ValueError):
        pass
    return x


def _weighted_blend(components: dict, weights: dict) -> float:
    """
    components: {name: value_or_None}. Only components with a non-None value
    contribute, and their weights are renormalized to sum to 1 for THIS ROW —
    this is what prevents a not-yet-evaluated or not-yet-built layer from
    silently dragging every score down or requiring a full weight redesign
    every time a new layer ships.
    """
    active = {k: _none_if_nan(v) for k, v in components.items()}
    active = {k: v for k, v in active.items() if v is not None}
    if not active:
        return 0.0
    total_weight = sum(weights[k] for k in active)
    if total_weight == 0:
        return 0.0
    return sum(active[k] * (weights[k] / total_weight) for k in active)


def compute_risk_index(
    df: pd.DataFrame,
    duplicate_pairs_df: pd.DataFrame = None,
    weights: dict = None,
    id_col: str = "WORK_RECOMMENDATION_DTL_ID",
    min_signal_types_for_tier2: int = 2,
    require_anchor_for_tier2: bool = True,
) -> pd.DataFrame:
    """
    Expects df to already have run through Layer 1's RuleEngine.evaluate()
    (rule_violations, rule_score columns present) and Layer 2's
    detect_cost_anomalies() (cost_anomaly_score, cost_anomaly_flag,
    cost_anomaly_method columns present).

    Returns df with these new columns:
      risk_index          : 0-100 composite score
      primary_anchors      : list of anchor tags present (e.g. ["COST_OUTLIER", "LETTER_BUNDLE_FRAGMENTATION"])
      signal_type_count    : how many independent layers contributed non-zero signal
      tier                 : "tier_2" | "tier_1" | "clean"
      reasons              : full list of human-readable explanation strings
    """
    weights = weights or DEFAULT_WEIGHTS
    df = df.copy()

    df = compute_fast_track_signal(df)

    dup_agg = aggregate_duplicate_pairs_to_projects(duplicate_pairs_df) if duplicate_pairs_df is not None else {}
    df["duplicate_score"] = df[id_col].map(lambda i: dup_agg.get(i, {}).get("score"))
    df["duplicate_typology"] = df[id_col].map(lambda i: dup_agg.get(i, {}).get("typology"))
    df["duplicate_paired_with"] = df[id_col].map(lambda i: dup_agg.get(i, {}).get("paired_with"))
    df["duplicate_reason_raw"] = df[id_col].map(lambda i: dup_agg.get(i, {}).get("reason"))

    risk_indices = []
    anchor_lists = []
    signal_counts = []
    tiers = []
    reasons_lists = []

    for _, row in df.iterrows():
        # --- normalize each component to 0-1, or None if not evaluated for this row ---
        rules_component = (row.get("rule_score", 0) or 0) / MAX_RULE_SCORE

        cost_method = row.get("cost_anomaly_method")
        cost_component = _none_if_nan(row.get("cost_anomaly_score")) if cost_method not in (None, "not_evaluated") else None

        dup_component = _none_if_nan(row.get("duplicate_score"))  # already 0-1, or None if never in a candidate pair

        graph_component = None  # Layer 4 not built — always excluded + renormalized for now

        components = {"rules": rules_component, "cost": cost_component,
                      "duplicate": dup_component, "graph": graph_component}
        risk_index = round(_weighted_blend(components, weights) * 100, 1)

        # --- anchors ---
        anchors = set()
        rule_ids_hit = {v["rule_id"] for v in (row.get("rule_violations") or [])}
        if rule_ids_hit & ANCHOR_RULE_IDS:
            for rid in (rule_ids_hit & ANCHOR_RULE_IDS):
                anchors.add({"R3": "COMPLETION_BREACH", "R9": "STATUTORY_PROHIBITION",
                             "R10": "STATUTORY_PROHIBITION", "D3": "LETTER_BUNDLE_FRAGMENTATION"}[rid])
        if row.get("cost_anomaly_flag"):
            anchors.add("COST_OUTLIER")
        if row.get("fast_track_flag"):
            anchors.add("FAST_TRACK_SANCTION")

        # Duplicate anchor: gated on forensic match_typology
        # Only promoted if TRUE_DUPLICATE or CONTRACT_TRANCHE_SPLIT (score >= 0.90),
        # or UNRESOLVED_SIMILAR_WORK meeting the high threshold (>= 0.92).
        # Crucially: INDEPENDENT_PARALLEL_WORKS and ADJACENT_SEGMENT_UNCORROBORATED are EXCLUDED from anchors.
        dup_typology = row.get("duplicate_typology")
        is_bulk_item = (
            (row.get("SANCTION_AMOUNT") is not None and pd.notna(row.get("SANCTION_AMOUNT")) and row.get("SANCTION_AMOUNT") < BULK_UNIT_COST_CEILING)
            or str(row.get("WORK_CATEGORY", "")).upper() in BULK_DISTRIBUTION_CATEGORIES
        )
        if dup_typology in ("TRUE_DUPLICATE", "CONTRACT_TRANCHE_SPLIT") and dup_component is not None and dup_component >= 0.90:
            if not is_bulk_item:
                anchors.add("DUPLICATE_WORK_OVERLAP")
        elif dup_typology in ("UNRESOLVED_SIMILAR_WORK", None) and dup_component is not None and dup_component >= DUPLICATE_ANCHOR_THRESHOLD:
            if not is_bulk_item:
                anchors.add("DUPLICATE_WORK_OVERLAP")

        # --- independent signal-type count (for the >=2 corroboration gate) ---
        signal_types_present = 0
        if rules_component > 0:
            signal_types_present += 1
        if cost_component is not None and row.get("cost_anomaly_flag"):
            signal_types_present += 1
        # Capped / filtered: INDEPENDENT_PARALLEL_WORKS never counts toward the corroboration gate
        if dup_component is not None and dup_component >= 0.50 and dup_typology != "INDEPENDENT_PARALLEL_WORKS":
            signal_types_present += 1
        if row.get("fast_track_flag"):
            signal_types_present += 1

        # --- tier gate ---
        if signal_types_present >= min_signal_types_for_tier2 and (not require_anchor_for_tier2 or anchors):
            tier = "tier_2"
        elif signal_types_present >= 1:
            tier = "tier_1"
        else:
            tier = "clean"

        # --- reason assembly ---
        reasons = [v["description"] for v in (row.get("rule_violations") or [])]
        if row.get("cost_anomaly_flag"):
            cost_r = row.get("cost_anomaly_reason")
            if cost_r:
                reasons.append(cost_r)
            else:
                median = row.get("category_median")
                amt = row.get("SANCTION_AMOUNT")
                if pd.notna(median) and median:
                    ratio = amt / median
                    reasons.append(f"Sanction amount is {ratio:.1f}x the category median "
                                    f"({row.get('cost_anomaly_method')}, n={row.get('category_sample_size')})")
        if row.get("fast_track_flag"):
            reasons.append(f"Sanctioned in {row.get('days_to_sanction')} days — unusually fast "
                            f"relative to this district's own typical timeline")
        dup_reason = _none_if_nan(row.get("duplicate_reason_raw"))
        if dup_reason:
            reasons.append(dup_reason)

        risk_indices.append(risk_index)
        anchor_lists.append(sorted(anchors))
        signal_counts.append(signal_types_present)
        tiers.append(tier)
        reasons_lists.append(reasons)

    df["risk_index"] = risk_indices
    df["primary_anchors"] = anchor_lists
    df["signal_type_count"] = signal_counts
    df["tier"] = tiers
    df["is_tier2"] = [t == "tier_2" for t in tiers]
    df["tier_level"] = [{"tier_2": "Tier 2 (Actionable Red Flag)", "tier_1": "Tier 1 (Operational Watchlist)", "clean": "Clean"}.get(t, t) for t in tiers]
    df["reasons"] = reasons_lists
    df["tier_promotion_reason"] = ["; ".join(r) if r else "No anomalies detected" for r in reasons_lists]

    return df

