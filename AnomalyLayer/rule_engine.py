"""
MPLADS-Sentinel — Layer 1: Rule-Based Anomaly Detection Engine

Loads rules from rules_config.yaml and evaluates every rule against the
projects_master dataframe produced by Layer 0. Nothing here is hardcoded —
updating a rule threshold means editing the YAML, not this file.

Output contract (per project / WORK_RECOMMENDATION_DTL_ID):
    {
        "WORK_RECOMMENDATION_DTL_ID": ...,
        "rule_violations": [ {"rule_id": "R1", "description": "...", "weight": 15}, ... ],
        "rule_score": <sum of weights, capped>,
    }
This feeds directly into Layer 5's composite Risk Index.
"""

from __future__ import annotations
import yaml
import pandas as pd
import numpy as np
from collections import defaultdict
from dataclasses import dataclass, field


MAX_RULE_SCORE = 40  # cap, matching the composite Risk Index design in the ML build plan


@dataclass
class RuleResult:
    rule_id: str
    description: str
    weight: int
    row_indices: list = field(default_factory=list)  # index positions of df rows that violated this rule


class RuleEngine:
    def __init__(self, config_path: str):
        with open(config_path, "r") as f:
            cfg = yaml.safe_load(f)
        self.rules = cfg["rules"]

    # ---- dispatch ----------------------------------------------------

    def evaluate(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Returns a copy of df with two new columns:
          - rule_violations: list of dicts (rule_id, description, weight) per row
          - rule_score: capped sum of weights per row
        """
        df = df.copy()
        df["rule_violations"] = [[] for _ in range(len(df))]

        for rule in self.rules:
            check_type = rule["check_type"]
            handler = getattr(self, f"_check_{check_type}", None)
            if handler is None:
                print(f"[warn] no handler for check_type '{check_type}' (rule {rule['id']}) — skipping")
                continue
            try:
                violated_idx = handler(df, rule)
            except Exception as e:
                print(f"[warn] rule {rule['id']} failed to evaluate: {e}")
                continue

            for idx in violated_idx:
                df.at[idx, "rule_violations"].append({
                    "rule_id": rule["id"],
                    "description": rule["description"],
                    "weight": rule["weight"],
                })

        df["rule_score"] = df["rule_violations"].apply(
            lambda viols: min(sum(v["weight"] for v in viols), MAX_RULE_SCORE)
        )
        return df

    # ---- helpers -------------------------------------------------------

    @staticmethod
    def _passes_only_if(df: pd.DataFrame, rule: dict) -> pd.Series:
        """Returns a boolean mask of rows eligible for this rule (True = eligible)."""
        cond = rule.get("only_if")
        if cond is None:
            return pd.Series(True, index=df.index)

        field_name = cond["field"]
        if field_name not in df.columns:
            return pd.Series(True, index=df.index)  # can't filter, don't block the rule

        if "not_null" in cond:
            mask = df[field_name].notna() if cond["not_null"] else df[field_name].isna()
        elif "is_null" in cond:
            mask = df[field_name].isna() if cond["is_null"] else df[field_name].notna()
        elif "equals" in cond:
            mask = df[field_name] == cond["equals"]
        else:
            mask = pd.Series(True, index=df.index)
        return mask

    # ---- check_type handlers -------------------------------------------

    def _check_row_threshold(self, df: pd.DataFrame, rule: dict) -> list:
        field_name = rule["field"]
        if field_name not in df.columns:
            return []
        eligible = self._passes_only_if(df, rule)
        op = rule["operator"]
        val = rule["value"]
        series = df[field_name]

        if op == ">":
            mask = series > val
        elif op == "<":
            mask = series < val
        elif op == ">=":
            mask = series >= val
        elif op == "<=":
            mask = series <= val
        else:
            raise ValueError(f"Unsupported operator '{op}'")

        return df.index[mask & eligible & series.notna()].tolist()

    def _check_aggregate_ceiling(self, df: pd.DataFrame, rule: dict) -> list:
        group_by = rule["group_by"]
        group_by = [g for g in group_by if g in df.columns]
        if not group_by:
            return []
        eligible = self._passes_only_if(df, rule)
        field_name = rule["field"]
        if field_name not in df.columns:
            return []
        agg = rule.get("aggregate", "sum")

        eligible_df = df[eligible]
        if eligible_df.empty:
            return []
        grouped_sums = eligible_df.groupby(group_by)[field_name].agg(agg)
        exceeded_groups = grouped_sums[grouped_sums > rule["value"]].index
        if exceeded_groups.empty:
            return []

        if len(group_by) == 1:
            mask = df[group_by[0]].isin(exceeded_groups) & eligible
        else:
            mask = df.set_index(group_by).index.isin(exceeded_groups) & eligible.values
        return df.index[mask].tolist()

    def _check_aggregate_cumulative_ceiling(self, df: pd.DataFrame, rule: dict) -> list:
        group_by = [g for g in rule["group_by"] if g in df.columns]
        if not group_by:
            return []
        eligible = self._passes_only_if(df, rule)
        field_name = rule["field"]

        # allow a higher ceiling for a specific override flag (e.g. tribal welfare trusts)
        override_field = rule.get("value_override_field")
        base_ceiling = rule["value"]
        if override_field and override_field in df.columns:
            ceiling_series = np.where(df[override_field].fillna(False), rule.get("value_override", base_ceiling), base_ceiling)
            ceiling = pd.Series(ceiling_series, index=df.index)
        else:
            ceiling = pd.Series(base_ceiling, index=df.index)

        cumsum = df.groupby(group_by)[field_name].transform("sum")
        mask = (cumsum > ceiling) & eligible
        return df.index[mask].tolist()

    def _check_aggregate_share_floor(self, df: pd.DataFrame, rule: dict) -> list:
        """
        Flags every row in a group where the group's share of spend going to a
        flagged sub-population (e.g. SC/ST areas) is below the mandated minimum.
        This is a compliance flag on the MP/FY aggregate, surfaced on every
        project row in that group so it's visible wherever that MP's projects appear.
        """
        group_by = [g for g in rule["group_by"] if g in df.columns]
        share_field = rule["share_field"]
        denom_field = rule["denominator_field"]
        if not group_by or share_field not in df.columns or denom_field not in df.columns:
            return []

        # If the share_field is entirely unpopulated (e.g. IS_SC_AREA/IS_ST_AREA are not
        # available from the real eSAKSHI API until enriched from an external source),
        # skip this rule outright rather than silently computing a false 0% share.
        if df[share_field].isna().all():
            return []

        min_group_size = rule.get("min_group_size", 15)  # guard against small-sample noise

        def group_share(g):
            if len(g) < min_group_size:
                return np.nan  # not enough data in this MP/FY group to judge allocation share fairly
            if g[share_field].isna().all():
                return np.nan  # this specific group has no data for the field either
            denom = g[denom_field].sum()
            if denom == 0:
                return np.nan
            numer = g.loc[g[share_field] == True, denom_field].sum()
            return numer / denom

        shares = df.groupby(group_by).apply(group_share, include_groups=False).dropna()
        below_min = shares[shares < rule["min_share"]]
        if below_min.empty:
            return []
        mask = df.set_index(group_by).index.isin(below_min.index)
        return df.index[mask].tolist()

    def _check_keyword_prohibition(self, df: pd.DataFrame, rule: dict) -> list:
        field_name = rule["field"]
        if field_name not in df.columns:
            return []
        eligible = self._passes_only_if(df, rule)
        keywords = [k.lower() for k in rule["keywords"]]
        text = df[field_name].fillna("").str.lower()
        mask = text.apply(lambda t: any(kw in t for kw in keywords))
        return df.index[mask & eligible].tolist()

    def _check_iqr_outlier(self, df: pd.DataFrame, rule: dict) -> list:
        group_by = [g for g in rule["group_by"] if g in df.columns]
        field_name = rule["field"]
        mult = rule.get("iqr_multiplier", 1.5)
        if not group_by or field_name not in df.columns:
            return []
        flagged = []
        for _, group in df.groupby(group_by):
            if len(group) < 10:
                continue  # not enough data in this category for a meaningful IQR
            q1, q3 = group[field_name].quantile([0.25, 0.75])
            iqr = q3 - q1
            upper = q3 + mult * iqr
            flagged.extend(group.index[group[field_name] > upper].tolist())
        return flagged

    def _check_group_median_deviation(self, df: pd.DataFrame, rule: dict) -> list:
        group_by = [g for g in rule["group_by"] if g in df.columns]
        field_name = rule["field"]
        if not group_by or field_name not in df.columns:
            return []
        national_median = df[field_name].median()
        threshold = rule["deviation_below_national_median_days"]
        flagged = []
        for _, group in df.groupby(group_by):
            if len(group) < 10:
                continue
            group_median = group[field_name].median()
            if national_median - group_median > threshold:
                flagged.extend(group.index.tolist())
        return flagged

    def _check_shared_letter_bundle(self, df: pd.DataFrame, rule: dict) -> list:
        """
        Flags projects where an MP submits multiple works under the exact same recommendation letter
        with amounts clustering within a tight tolerance band (e.g. within 15% of median)
        totaling >= ₹50 Lakhs. This isolates engineered tranche fragmentation (splitting a large
        package into multiple sub-threshold pieces, e.g. 3x ₹25L, or ₹24L+₹25L+₹26L) from routine
        batch recommendation lists of diverse works.
        """
        letter_col = rule.get("letter_field", "LETTER_NO")
        amount_col = rule.get("amount_field", "SANCTION_AMOUNT")
        if letter_col not in df.columns or amount_col not in df.columns:
            return []

        eligible = self._passes_only_if(df, rule)
        valid_mask = eligible & df[letter_col].notna() & (df[letter_col].astype(str).str.strip() != "")
        valid_df = df[valid_mask]
        if valid_df.empty:
            return []

        min_works = rule.get("min_works", rule.get("min_identical_works", 3))
        min_total = rule.get("min_total_amount", 5000000)
        rel_tolerance = rule.get("rel_tolerance", 0.15)
        group_by = [g for g in rule.get("group_by", ["CONSTITUENCY", letter_col]) if g in df.columns]

        flagged_indices = set()
        for _, grp in valid_df.groupby(group_by):
            amounts = grp[amount_col].values
            indices = grp.index.values
            if len(amounts) < min_works or np.sum(amounts) < min_total:
                continue

            sorted_pairs = sorted(zip(amounts, indices), key=lambda x: x[0])
            s_amts = [p[0] for p in sorted_pairs]
            s_idxs = [p[1] for p in sorted_pairs]

            n = len(s_amts)
            for i in range(n - min_works + 1):
                for j in range(i + min_works, n + 1):
                    sub_amts = s_amts[i:j]
                    sub_idxs = s_idxs[i:j]
                    med = np.median(sub_amts)
                    if med <= 0:
                        continue
                    spread = (sub_amts[-1] - sub_amts[0]) / med
                    sub_total = np.sum(sub_amts)
                    if spread <= rel_tolerance and sub_total >= min_total:
                        flagged_indices.update(sub_idxs)

        return list(flagged_indices)

    def _check_just_below_threshold(self, df: pd.DataFrame, rule: dict) -> list:
        """
        Flags projects whose budget lands suspiciously close below key administrative/procurement
        threshold slabs (e.g. within 1% or within ₹2,000 below slabs like ₹1L, ₹10L, ₹25L, ₹50L, ₹1Cr).
        Catches deliberate threshold engineering such as ₹9,99,999 or ₹9,99,985 (₹10L ceiling)
        and ₹99,98,850 (₹1Cr ceiling).
        """
        field_name = rule.get("field", "SANCTION_AMOUNT")
        if field_name not in df.columns:
            return []
        eligible = self._passes_only_if(df, rule)
        thresholds = rule.get("thresholds", [100000, 1000000, 2500000, 5000000, 10000000])
        max_delta_pct = rule.get("max_delta_pct", 0.01)
        max_delta_abs = rule.get("max_delta_abs", 2000)

        amounts = df[field_name]
        flagged = []
        for idx in df.index[eligible & amounts.notna()]:
            amt = amounts.loc[idx]
            for t in thresholds:
                diff = t - amt
                if 0 < diff <= max(t * max_delta_pct, max_delta_abs) and (diff <= 50000):
                    flagged.append(idx)
                    break
        return flagged


def coerce_booleans(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in ["IS_TRIBAL_TRUST", "is_completed_flag"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.lower().map({"true": True, "false": False, "1": True, "0": False}).fillna(False)
    for col in ["IS_SC_AREA", "IS_ST_AREA"]:
        if col in df.columns:
            df[col] = df[col].map(lambda x: True if str(x).lower() in ("true", "1") else (False if str(x).lower() in ("false", "0") else pd.NA))
    return df


if __name__ == "__main__":
    import argparse
    import os

    parser = argparse.ArgumentParser(description="MPLADS-Sentinel Rule Engine")
    parser.add_argument("--data", default="projects_master.csv", help="Path to projects master CSV")
    parser.add_argument("--config", default="rules_config.yaml", help="Path to rules YAML config")
    parser.add_argument("--out", default="flagged_projects.csv", help="Output path for scored projects")
    args = parser.parse_args()

    if not os.path.exists(args.data):
        print(f"[error] Data file '{args.data}' not found.")
        exit(1)

    print(f"Loading data from {args.data}...")
    df = pd.read_csv(args.data, parse_dates=["RECOMMENDATION_DATE", "SANCTION_DATE", "ACTUAL_END_DATE"])
    df = coerce_booleans(df)

    engine = RuleEngine(args.config)
    scored = engine.evaluate(df)

    # Summary of triggered rules
    rule_counts = {}
    for viols in scored["rule_violations"]:
        for v in viols:
            rule_counts[v["rule_id"]] = rule_counts.get(v["rule_id"], 0) + 1

    print("\n" + "=" * 80)
    print("RULE ENGINE EVALUATION SUMMARY")
    print("=" * 80)
    print(f"Total projects evaluated: {len(scored)}")
    flagged_count = (scored["rule_score"] > 0).sum()
    print(f"Projects with at least one violation: {flagged_count} ({flagged_count / max(len(scored), 1) * 100:.1f}%)")

    print("\nBreakdown by Rule:")
    for rule_id, count in sorted(rule_counts.items()):
        print(f"  {rule_id}: {count} projects flagged")

    scored.to_csv(args.out, index=False)
    print(f"\nSaved scored dataset to {args.out}")

    top_flagged = scored[scored["rule_score"] > 0].sort_values("rule_score", ascending=False).head(5)
    if not top_flagged.empty:
        print("\nTop Flagged Projects:")
        for _, row in top_flagged.iterrows():
            print(f"\n  Project ID: {row['WORK_RECOMMENDATION_DTL_ID']} | Score: {row['rule_score']} | Category: {row['WORK_CATEGORY']}")
            for v in row["rule_violations"]:
                print(f"    - [{v['rule_id']}] {v['description']} (Weight: {v['weight']})")

