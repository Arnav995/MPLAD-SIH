"""
MPLADS-Sentinel — Layer 2: Cost Anomaly Detection

Catches abnormal costs that the written guidelines don't explicitly define
a threshold for (unlike Layer 1's R5 floor / R8 ceiling, which ARE explicit
numbers from the guidelines). This layer answers: "is this cost weird
relative to its peers", not "does this violate a written rule".

Per-category modelling, not one global model — a ₹40 lakh community hall
and a ₹40 lakh road are differently unusual, so peer comparison has to be
within-category. Uses Isolation Forest (PyOD) where there's enough data per
category, and falls back to an IQR-based pseudo-score where there isn't —
never force a model onto a sample too small for it to mean anything.

CRITICAL DATA-QUALITY GUARD (learned from the Layer 1 live-data debugging):
eSAKSHI populates SANCTION_AMOUNT with the *proposed/recommended* amount for
works still pending sanction. If those get mixed into the cost-benchmark
population, category medians get pulled toward inflated proposal figures,
not actual sanctioned costs. This layer filters to SANCTION_DATE-populated
(i.e. actually sanctioned) rows by default, exactly like the R4 fix.
"""

from __future__ import annotations
import numpy as np
import pandas as pd
from pyod.models.iforest import IForest


DEFAULT_MIN_SAMPLES_FOR_MODEL = 10     # below this, IQR fallback is used instead of Isolation Forest
DEFAULT_MIN_SAMPLES_FOR_FALLBACK = 5    # below 5 peers cannot establish a meaningful norm (suppressed)
DEFAULT_CONTAMINATION = 0.05           # assumed anomaly rate for Isolation Forest's contamination param


def _iqr_pseudo_score(values: pd.Series) -> pd.Series:
    """
    A model-free anomaly score for categories too small to fit Isolation
    Forest on meaningfully. Scaled to roughly the same 0-1ish range as the
    normalized Isolation Forest scores below, so Layer 5 can weight either
    source without special-casing which one produced a given row's score.
    """
    q1, q3 = values.quantile([0.25, 0.75])
    iqr = q3 - q1
    if iqr == 0:
        return pd.Series(0.0, index=values.index)
    median = values.median()
    # distance from median in IQR units, clipped and rescaled to ~0-1
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
) -> pd.DataFrame:
    """
    Returns a copy of df with these new columns added:
      - cost_anomaly_score   : 0-1 normalized, higher = more anomalous
      - cost_anomaly_flag    : bool, top `contamination` fraction per category
      - cost_anomaly_method  : "isolation_forest" | "iqr_fallback" | "not_evaluated"
      - category_median      : for building the human-readable reason string later
      - category_sample_size : how many peers this comparison was based on (explainability)

    Rows excluded by the sanctioned-only filter get cost_anomaly_method =
    "not_evaluated" and a null score — they are NOT silently scored as clean;
    they're explicitly marked as out of scope for this check.
    """
    df = df.copy()
    df["cost_anomaly_score"] = np.nan
    df["cost_anomaly_flag"] = False
    df["cost_anomaly_method"] = "not_evaluated"
    df["category_median"] = np.nan
    df["category_sample_size"] = 0

    if only_sanctioned and sanction_date_col in df.columns:
        s_col = df[sanction_date_col]
        if pd.api.types.is_string_dtype(s_col) or pd.api.types.is_object_dtype(s_col):
            eligible_mask = s_col.notna() & (~s_col.astype(str).str.strip().str.upper().isin(["NA", "N/A", "NONE", "NULL", "NAN", "NAT", ""]))
        else:
            eligible_mask = s_col.notna()
    else:
        eligible_mask = pd.Series(True, index=df.index)

    eligible_df = df[eligible_mask]

    for category, group in eligible_df.groupby(category_col):
        idx = group.index
        values = group[amount_col].dropna()
        if len(values) < min_samples_for_fallback:
            continue  # below 5 peers cannot establish a meaningful norm (suppressed to avoid small-sample noise)

        df.loc[idx, "category_median"] = values.median()
        df.loc[idx, "category_sample_size"] = len(values)

        if len(values) >= min_samples_for_model:
            X = values.values.reshape(-1, 1)
            clf = IForest(contamination=contamination, random_state=42, n_estimators=100)
            clf.fit(X)
            raw_scores = clf.decision_scores_
            # normalize to 0-1 within this category so scores are comparable across categories
            lo, hi = raw_scores.min(), raw_scores.max()
            norm_scores = (raw_scores - lo) / (hi - lo) if hi > lo else np.zeros_like(raw_scores)
            df.loc[values.index, "cost_anomaly_score"] = norm_scores
            df.loc[values.index, "cost_anomaly_flag"] = clf.labels_.astype(bool)
            df.loc[values.index, "cost_anomaly_method"] = "isolation_forest"
        else:
            scores = _iqr_pseudo_score(values)
            # for the fallback, flag the same top-contamination fraction so behavior is consistent
            threshold = scores.quantile(1 - contamination) if len(scores) > 1 else 1.0
            df.loc[values.index, "cost_anomaly_score"] = scores
            df.loc[values.index, "cost_anomaly_flag"] = scores >= threshold
            df.loc[values.index, "cost_anomaly_method"] = "iqr_fallback"

    return df


def build_cost_reason_string(row: pd.Series, amount_col: str = "SANCTION_AMOUNT") -> str | None:
    """Human-readable explanation for Layer 5 to include in a project's reason list."""
    if not row.get("cost_anomaly_flag"):
        return None
    amount = row.get(amount_col)
    median = row.get("category_median")
    n = row.get("category_sample_size")
    if pd.isna(median) or median == 0:
        return f"Cost anomaly flagged (insufficient category benchmark data, n={n})"
    ratio = amount / median
    direction = "above" if ratio >= 1 else "below"
    return (f"Sanction amount is {ratio:.1f}x the category median "
            f"({direction} typical, based on {n} comparable sanctioned works in this category)")


if __name__ == "__main__":
    import os
    import sys
    target = "projects_master.csv" if os.path.exists("projects_master.csv") else "sample_projects_master.csv"
    if not os.path.exists(target):
        print(f"Neither projects_master.csv nor sample_projects_master.csv found. Exiting.")
        sys.exit(1)

    print(f"Loading {target} for Layer 2 Cost Anomaly Detection...")
    df_in = pd.read_csv(target)
    df_out = detect_cost_anomalies(df_in)

    flagged = df_out[df_out["cost_anomaly_flag"]]
    eval_n = (df_out["cost_anomaly_method"] != "not_evaluated").sum()
    print(f"Evaluated {eval_n}/{len(df_out)} sanctioned projects.")
    print(f"Flagged {len(flagged)} cost anomalies ({len(flagged)/max(eval_n, 1)*100:.1f}% of evaluated).")
    print(f"Method distribution:\n{df_out['cost_anomaly_method'].value_counts().to_string()}\n")

    print("Top Cost Anomalies:")
    for _, r in flagged.sort_values("cost_anomaly_score", ascending=False).head(5).iterrows():
        reason = build_cost_reason_string(r)
        print(f"  * ID {r.get('WORK_RECOMMENDATION_DTL_ID')} ({r.get('WORK_CATEGORY')}) - Rs {r.get('SANCTION_AMOUNT', 0):,.0f} [{r.get('cost_anomaly_method')}]")
        print(f"    -> {reason}")
