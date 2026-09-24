"""
MPLADS-Sentinel — Layer 2: Cost Anomaly Detection (Layer 2.0)

Catches abnormal costs that written guidelines don't explicitly define a fixed
threshold for (unlike Layer 1's statutory rules, which are literal nominal legal
floors and ceilings). This layer answers: "is this cost unusual relative to its peers".

KEY ENHANCEMENTS IN LAYER 2.0 (Forensic Multi-Factor Cost Parity Engine):
1. Functional Activity Disaggregation:
   In real eSAKSHI data, 94.7% of projects are lumped under "Normal/Others".
   This layer parses ACTIVITY_NAME and WORK_DESCRIPTION into 10 homogeneous
   functional activity peer groups (e.g. ROADS_AND_DRAINAGE, COMMUNITY_HALLS,
   PUBLIC_BENCHES, WATER_AND_BOREWELLS, EDUCATION_AND_IT).
2. Physical Scale & Unit Rate Normalization:
   Parses verified physical quantities (e.g., "100 benches", "30 computer sets",
   "2 borewells") to evaluate unit rates rather than gross totals, preventing
   multi-village bulk rate-card deployments from triggering false-positive cost alarms.
3. Strict Statutory Isolation:
   Layer 1 rules (R4, R5, R8, D3, D4) evaluate literal nominal SANCTION_AMOUNT.
   This layer NEVER modifies or substitutes SANCTION_AMOUNT.
4. Parameterized Deflator Architecture (Workstream 2 Hook):
   Includes mathematical and configuration schema for inflation and geographic
   DSR normalization, held at neutral 1.000 defaults until official gazettes are cited.
"""

from __future__ import annotations
import os
import re
import yaml
import numpy as np
import pandas as pd
from pyod.models.iforest import IForest


DEFAULT_MIN_SAMPLES_FOR_MODEL = 10     # below this, IQR fallback is used instead of Isolation Forest
DEFAULT_MIN_SAMPLES_FOR_FALLBACK = 5    # below 5 peers cannot establish a meaningful norm (suppressed)
DEFAULT_CONTAMINATION = 0.05           # assumed anomaly rate for Isolation Forest's contamination param


def load_cost_normalization_config(config_path: str = "rules_config.yaml") -> dict:
    """Loads configuration for Layer 2 cost normalization if present."""
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                cfg = yaml.safe_load(f)
                if cfg and "layer2_cost_normalization" in cfg:
                    return cfg["layer2_cost_normalization"]
        except Exception:
            pass
    return {
        "enabled": False,
        "status": "ASSUMED — UNVERIFIED, needs sourcing",
        "base_fy": "2024-25",
        "min_deflator_multiplier": 0.70,
        "max_deflator_multiplier": 1.50,
        "inflation_indices": {},
        "geographic_cost_indices": {},
    }


def classify_functional_activity(row: pd.Series | dict) -> str:
    """
    Disaggregates coarse categories (like 'Normal/Others') into homogeneous
    statutory public works functional activity clusters.
    If the row already has a specific category (e.g. from synthetic benchmark data),
    it maps cleanly to maintain backward compatibility.
    """
    cat = str(row.get("WORK_CATEGORY", "")).strip()
    # Backward compatibility with synthetic fixtures (e.g. sample_projects_master.csv)
    legacy_map = {
        "Road Construction": "ROADS_AND_DRAINAGE",
        "Drinking Water": "WATER_AND_BOREWELLS",
        "Community Hall": "COMMUNITY_HALLS_AND_STRUCTURES",
        "Street Lighting": "LIGHTING_AND_ELECTRICAL",
        "School Infrastructure": "EDUCATION_AND_IT",
    }
    if cat in legacy_map:
        return legacy_map[cat]

    act = str(row.get("ACTIVITY_NAME", "")).lower()
    desc = str(row.get("WORK_DESCRIPTION", "")).lower()
    text = f"{act} {desc}"

    if any(k in text for k in [
        "road", "pathway", "cc road", "asphalting", "paver block", "i-block", "i block",
        "drain", "drainage", "gutter", "culvert", "puliya", "footpath", "cement road", "link road"
    ]):
        return "ROADS_AND_DRAINAGE"
    elif any(k in text for k in [
        "community hall", "samaj bhavan", "community center", "auditorium", "shed", "pavilion", "covered sitting",
        "library", "e-library", "reading room", "study center"
    ]):
        return "COMMUNITY_HALLS_AND_STRUCTURES"
    elif any(k in text for k in ["bench", "benches", "sitting rcc benches"]):
        return "PUBLIC_BENCHES"
    elif any(k in text for k in [
        "borewell", "bore well", "tube well", "hand pump", "drinking water", "water supply", "wells and borewells"
    ]):
        return "WATER_AND_BOREWELLS"
    elif any(k in text for k in ["bus stop", "passenger shed", "stops"]):
        return "BUS_STOPS"
    elif any(k in text for k in [
        "computer", "smart class", "smart board", "printer", "it system", "modular science",
        "science laboratory", "laboratory"
    ]):
        return "EDUCATION_AND_IT"
    elif any(k in text for k in [
        "prosthetic", "artificial limb", "wheel chair", "tricycle", "hearing aid", "disabled person", "assistive"
    ]):
        return "HEALTH_AND_ASSISTIVE_DEVICES"
    elif any(k in text for k in [
        "highmast", "street light", "electric pole", "solar light", "lighting of public spaces", "overhead electrical"
    ]):
        return "LIGHTING_AND_ELECTRICAL"
    elif any(k in text for k in ["repair and renovation", "repair", "renovation"]) or cat == "Repair and Renovation":
        return "REPAIR_AND_RENOVATION"
    else:
        return "OTHER_PUBLIC_FACILITIES"


def extract_physical_scale(row: pd.Series | dict, ceilings: dict | None = None) -> dict | None:
    """
    Extracts verified physical unit quantities from free-text descriptions:
      - Benches: e.g. "total 100 benches", "10 benches" (cap default 500)
      - Computers: e.g. "30 Computer Sets", "6 Computers" (cap default 100)
      - Borewells: e.g. "2 borewells", "borewell" (cap default 10)
    Returns {'item': str, 'quantity': int, 'unit_name': str} or None.
    """
    desc = str(row.get("WORK_DESCRIPTION", ""))
    if not desc:
        return None

    c_map = ceilings or {}
    bench_cap = c_map.get("benches", 500)
    comp_cap = c_map.get("computers", 100)
    bore_cap = c_map.get("borewells", 10)

    # 1. Benches
    b_match = re.search(r'(\d+)\s*(?:cement concrete benches|benches|rcc benches)', desc, re.IGNORECASE)
    if b_match:
        qty = int(b_match.group(1))
        if 1 <= qty <= bench_cap:
            return {"item": "benches", "quantity": qty, "unit_name": "bench"}

    # 2. Computers / IT
    c_match = re.search(r'(\d+)\s*(?:computer sets|computers|computer systems)', desc, re.IGNORECASE)
    if c_match:
        qty = int(c_match.group(1))
        if 1 <= qty <= comp_cap:
            return {"item": "computers", "quantity": qty, "unit_name": "computer"}

    # 3. Borewells
    if "borewell" in desc.lower():
        bw_match = re.search(r'(\d+)\s*borewell', desc, re.IGNORECASE)
        qty = int(bw_match.group(1)) if bw_match else 1
        if 1 <= qty <= bore_cap:
            return {"item": "borewells", "quantity": qty, "unit_name": "borewell"}

    return None


def _iqr_pseudo_score(values: pd.Series) -> pd.Series:
    """
    Model-free anomaly score for peer groups with sample size between min_fallback and min_model.
    Evaluates relative deviation from median normalized by IQR.
    """
    q1, q3 = values.quantile([0.25, 0.75])
    iqr = q3 - q1
    if iqr == 0:
        return pd.Series(0.0, index=values.index)
    median = values.median()
    raw = (values - median).abs() / iqr
    return (raw / (raw.max() if raw.max() > 0 else 1)).clip(0, 1)


def detect_cost_anomalies(
    df: pd.DataFrame,
    category_col: str = "WORK_CATEGORY",
    amount_col: str = "SANCTION_AMOUNT",
    sanction_date_col: str = "SANCTION_DATE",
    min_samples_for_model: int = DEFAULT_MIN_SAMPLES_FOR_MODEL,
    min_samples_for_fallback: int = DEFAULT_MIN_SAMPLES_FOR_FALLBACK,
    contamination: float = DEFAULT_CONTAMINATION,
    only_sanctioned: bool = True,
    use_functional_activity: bool = True,
    config_path: str = "rules_config.yaml",
) -> pd.DataFrame:
    """
    Evaluates peer-cost anomalies within homogeneous functional activity clusters,
    accounting for physical scale (unit rates) when explicit quantities exist.

    Columns added:
      - classified_activity    : string functional activity cluster
      - evaluated_cost_amount  : amount evaluated (unit rate for scaled works, nominal amount otherwise)
      - physical_scale_units   : integer quantity if extracted, else None
      - physical_scale_item    : string item type if extracted, else None
      - cost_anomaly_score     : 0-1 normalized anomaly score
      - cost_anomaly_flag      : boolean flag
      - cost_anomaly_method    : 'isolation_forest' | 'iqr_fallback' | 'not_evaluated'
      - category_median        : benchmark median of peer group
      - category_sample_size   : number of peers in comparison
      - cost_anomaly_reason    : human-readable explainable reason string

    STATUTORY ISOLATION GUARANTEE:
    df[amount_col] (SANCTION_AMOUNT) is never modified, preserving nominal thresholds for Layer 1.
    """
    df = df.copy()
    norm_cfg = load_cost_normalization_config(config_path)

    # 1. Classify functional activity
    if use_functional_activity:
        df["classified_activity"] = df.apply(classify_functional_activity, axis=1)
        group_field = "classified_activity"
    else:
        df["classified_activity"] = df[category_col].astype(str)
        group_field = category_col

    # 2. Extract physical scale and determine evaluation amount
    scale_caps = norm_cfg.get("scale_quantity_ceilings", {})
    scales = df.apply(lambda r: extract_physical_scale(r, ceilings=scale_caps), axis=1)
    df["physical_scale_item"] = [s["item"] if s else None for s in scales]
    df["physical_scale_units"] = [s["quantity"] if s else None for s in scales]

    # Evaluate on unit rate if scale is extracted, otherwise nominal amount
    eval_amounts = []
    for idx, row in df.iterrows():
        amt = row.get(amount_col)
        qty = row.get("physical_scale_units")
        if pd.notna(qty) and qty and qty > 1 and pd.notna(amt):
            eval_amounts.append(amt / qty)
        else:
            eval_amounts.append(amt)

    # Workstream 2 Hook (dormant when enabled: false)
    if norm_cfg.get("enabled", False):
        min_mult = norm_cfg.get("min_deflator_multiplier", 0.70)
        max_mult = norm_cfg.get("max_deflator_multiplier", 1.50)
        infl_map = norm_cfg.get("inflation_indices", {})
        geo_map = norm_cfg.get("geographic_cost_indices", {})

        adjusted = []
        for i, row in df.iterrows():
            base_amt = eval_amounts[i]
            if pd.notna(base_amt):
                fy = str(row.get("FY", row.get("SANCTION_FY", "")))
                ida = str(row.get("IDA_NAME", ""))
                infl = float(infl_map.get(fy, 1.0))
                geo = float(geo_map.get(ida, geo_map.get("DEFAULT", 1.0)))
                total_mult = np.clip(infl * geo, min_mult, max_mult)
                adjusted.append(base_amt / total_mult)
            else:
                adjusted.append(np.nan)
        df["evaluated_cost_amount"] = adjusted
    else:
        df["evaluated_cost_amount"] = eval_amounts

    df["cost_anomaly_score"] = np.nan
    df["cost_anomaly_flag"] = False
    df["cost_anomaly_method"] = "not_evaluated"
    df["category_median"] = np.nan
    df["category_sample_size"] = 0

    # 3. Filter eligible (sanctioned) rows for benchmarking
    if only_sanctioned and sanction_date_col in df.columns:
        s_col = df[sanction_date_col]
        if pd.api.types.is_string_dtype(s_col) or pd.api.types.is_object_dtype(s_col):
            eligible_mask = s_col.notna() & (~s_col.astype(str).str.strip().str.upper().isin(["NA", "N/A", "NONE", "NULL", "NAN", "NAT", ""]))
        else:
            eligible_mask = s_col.notna()
    else:
        eligible_mask = pd.Series(True, index=df.index)

    eligible_df = df[eligible_mask]

    # 4. Fit peer benchmark per functional activity cluster
    for act_name, group in eligible_df.groupby(group_field):
        idx = group.index
        values = group["evaluated_cost_amount"].dropna()
        if len(values) < min_samples_for_fallback:
            continue

        median_val = values.median()
        df.loc[idx, "category_median"] = median_val
        df.loc[idx, "category_sample_size"] = len(values)

        is_above = values > median_val
        is_scaled = df.loc[values.index, "physical_scale_units"].notna() & (df.loc[values.index, "physical_scale_units"] > 1)

        if len(values) >= min_samples_for_model:
            X = values.values.reshape(-1, 1)
            clf = IForest(contamination=contamination, random_state=42, n_estimators=100)
            clf.fit(X)
            raw_scores = clf.decision_scores_
            lo, hi = raw_scores.min(), raw_scores.max()
            norm_scores = (raw_scores - lo) / (hi - lo) if hi > lo else np.zeros_like(raw_scores)
            norm_series = pd.Series(norm_scores, index=values.index)

            # For scaled rows (unit rates): only upper tail counts as anomaly (lower is bulk efficiency)
            # For unscaled rows: two-sided outlier detection is preserved (catching token / under-budget works)
            norm_series[is_scaled & (~is_above)] = 0.0

            flag_series = clf.labels_.astype(bool)
            flag_series = flag_series & (is_above | (~is_scaled))

            df.loc[values.index, "cost_anomaly_score"] = norm_series
            df.loc[values.index, "cost_anomaly_flag"] = flag_series
            df.loc[values.index, "cost_anomaly_method"] = "isolation_forest"
        else:
            scores = _iqr_pseudo_score(values)
            threshold = scores.quantile(1 - contamination) if len(scores) > 1 else 1.0
            scores[is_scaled & (~is_above)] = 0.0
            flag_series = (scores >= threshold) & (scores > 0.0) & (is_above | (~is_scaled))
            df.loc[values.index, "cost_anomaly_score"] = scores
            df.loc[values.index, "cost_anomaly_flag"] = flag_series
            df.loc[values.index, "cost_anomaly_method"] = "iqr_fallback"

    # 5. Assemble explainable reason strings
    reasons = [build_cost_reason_string(row, amount_col=amount_col) for _, row in df.iterrows()]
    df["cost_anomaly_reason"] = reasons

    return df


def build_cost_reason_string(row: pd.Series | dict, amount_col: str = "SANCTION_AMOUNT") -> str | None:
    """Human-readable explainability trail for cost anomalies."""
    if not row.get("cost_anomaly_flag"):
        return None
    eval_amt = row.get("evaluated_cost_amount")
    median = row.get("category_median")
    n = row.get("category_sample_size")
    activity = row.get("classified_activity", row.get("WORK_CATEGORY", "peers"))
    qty = row.get("physical_scale_units")
    item = row.get("physical_scale_item")

    if pd.isna(median) or median == 0:
        return f"Cost anomaly flagged (insufficient {activity} benchmark data, n={n})"

    ratio = eval_amt / median if pd.notna(eval_amt) else 1.0
    direction = "above" if ratio >= 1 else "below"

    if pd.notna(qty) and qty and qty > 1 and item:
        return (
            f"Unit rate is Rs. {eval_amt:,.0f}/{item[:-1]} ({ratio:.1f}x the {activity} median "
            f"of Rs. {median:,.0f}/unit, based on {n} comparable sanctioned works)"
        )
    else:
        if ratio < 0.5:
            qualifier = "below typical — potential under-scoping or token work"
        elif ratio > 2.0:
            qualifier = "above typical"
        else:
            qualifier = f"{direction} typical"
        return (
            f"Sanction amount is {ratio:.1f}x the {activity} median "
            f"({qualifier}, based on {n} comparable sanctioned works in this activity)"
        )


if __name__ == "__main__":
    target = "projects_master.csv" if os.path.exists("projects_master.csv") else "sample_projects_master.csv"
    if not os.path.exists(target):
        print(f"Dataset {target} not found. Exiting.")
        exit(1)

    print(f"Running Layer 2.0 Cost Anomaly Detection on {target}...")
    df_in = pd.read_csv(target)
    df_out = detect_cost_anomalies(df_in)

    flagged = df_out[df_out["cost_anomaly_flag"]]
    eval_n = (df_out["cost_anomaly_method"] != "not_evaluated").sum()
    print(f"\nEvaluated Projects: {eval_n} of {len(df_out)}")
    print(f"Flagged Cost Anomalies: {len(flagged)} ({len(flagged)/max(eval_n, 1)*100:.1f}%)")
    print(f"\nActivity Breakdown:\n{df_out['classified_activity'].value_counts()}")

    if not flagged.empty:
        print("\nTop Flagged Cost Anomalies:")
        for _, r in flagged.sort_values("cost_anomaly_score", ascending=False).head(8).iterrows():
            print(f"  * ID {r['WORK_RECOMMENDATION_DTL_ID']} ({r.get('CONSTITUENCY')}) | Rs {r['SANCTION_AMOUNT']:,.0f} | [{r['classified_activity']}]")
            print(f"      -> {r['cost_anomaly_reason']}")
