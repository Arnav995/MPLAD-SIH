"""
MPLADS-Sentinel — parse raw_pulls/*.json into projects_master.csv

Joins on WORK_RECOMMENDATION_DTL_ID across the three pulled datasets and
derives the fields Layer 1's rule engine expects (days_to_sanction, FY, etc.)

Known real-data gap (flagged honestly, not silently filled):
IS_SC_AREA / IS_ST_AREA are NOT present anywhere in the documented eSAKSHI
API responses. Rules R6/R7 (SC/ST allocation floor) cannot be evaluated from
this data alone — they'd need enrichment from an external source (e.g. LGD /
census SC-ST population data joined on CONSTITUENCY_ID or IDA_NAME), which is
a roadmap item, not something this pipeline fabricates or guesses at.
"""

import json
import pandas as pd
from pathlib import Path
from datetime import datetime


def _parse_date(date_str):
    if pd.isna(date_str) or not isinstance(date_str, str):
        return pd.NaT
    cleaned = date_str.strip()
    if not cleaned or cleaned.upper() in ("NA", "N/A", "NONE", "NULL", "0", ""):
        return pd.NaT
    for fmt in ("%d-%b-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    try:
        return pd.to_datetime(cleaned)
    except Exception:
        return pd.NaT


def _financial_year(date) -> str:
    if pd.isna(date):
        return None
    if date.month >= 4:
        return f"{date.year}-{str(date.year + 1)[-2:]}"
    return f"{date.year - 1}-{str(date.year)[-2:]}"


def build_projects_master(raw_dir: str = "./raw_pulls", as_of: datetime = None) -> pd.DataFrame:
    raw_dir = Path(raw_dir)
    as_of = as_of or datetime.now()

    with open(raw_dir / "works_recommended.json") as f:
        recommended = pd.DataFrame(json.load(f))
    with open(raw_dir / "works_completed.json") as f:
        completed = pd.DataFrame(json.load(f))
    with open(raw_dir / "expenditure_on_completed_and_on-going_works_as_on_date.json") as f:
        expenditure = pd.DataFrame(json.load(f))

    if recommended.empty:
        print("[warn] no 'Works Recommended' records found — nothing to build")
        return pd.DataFrame()

    df = recommended.copy()
    # Strip summary/totals rows (e.g. {'Total_Amt': ...}) that lack a project ID
    if "WORK_RECOMMENDATION_DTL_ID" in df.columns:
        df = df[df["WORK_RECOMMENDATION_DTL_ID"].notna()].copy()

    df["RECOMMENDATION_DATE"] = df["RECOMMENDATION_DATE"].apply(_parse_date)
    df["SANCTION_DATE"] = df["SANCTION_DATE"].apply(_parse_date)

    # --- merge completion data ---
    if not completed.empty:
        completed = completed.copy()
        if "WORK_RECOMMENDATION_DTL_ID" in completed.columns:
            completed = completed[completed["WORK_RECOMMENDATION_DTL_ID"].notna()].copy()
        completed["ACTUAL_END_DATE"] = completed["ACTUAL_END_DATE"].apply(_parse_date)
        completed_slim = completed[["WORK_RECOMMENDATION_DTL_ID", "WORK_ID", "ACTUAL_AMOUNT",
                                     "ACTUAL_END_DATE", "AVERAGE_RATING"]]
        df = df.merge(completed_slim, on="WORK_RECOMMENDATION_DTL_ID", how="left")
    else:
        df["ACTUAL_END_DATE"] = pd.NaT
        df["AVERAGE_RATING"] = None

    # --- merge vendor/payment data ---
    if not expenditure.empty:
        expenditure = expenditure.copy()
        if "WORK_RECOMMENDATION_DTL_ID" in expenditure.columns:
            expenditure = expenditure[expenditure["WORK_RECOMMENDATION_DTL_ID"].notna()].copy()
        expenditure_slim = expenditure[["WORK_RECOMMENDATION_DTL_ID", "VENDOR_NAME", "VENDOR_ID",
                                         "IA_NAME", "FUND_DISBURSED_AMT", "WORK_STATUS"]]
        # a work can have multiple disbursements — aggregate to one row per work
        agg = expenditure_slim.groupby("WORK_RECOMMENDATION_DTL_ID").agg({
            "VENDOR_NAME": "first",
            "VENDOR_ID": "first",
            "IA_NAME": "first",
            "FUND_DISBURSED_AMT": "sum",
            "WORK_STATUS": "last",
        }).reset_index()
        df = df.merge(agg, on="WORK_RECOMMENDATION_DTL_ID", how="left")
    else:
        df["VENDOR_NAME"] = None
        df["VENDOR_ID"] = None
        df["FUND_DISBURSED_AMT"] = 0

    # --- derived fields Layer 1 expects ---
    df["days_to_sanction"] = (df["SANCTION_DATE"] - df["RECOMMENDATION_DATE"]).dt.days
    df["days_since_recommendation"] = (as_of - df["RECOMMENDATION_DATE"]).dt.days
    df["days_to_complete"] = (df["ACTUAL_END_DATE"] - df["SANCTION_DATE"]).dt.days
    df["is_completed_flag"] = df["ACTUAL_END_DATE"].notna()
    df["SANCTION_FY"] = df["SANCTION_DATE"].apply(_financial_year)
    df["RECOMMENDATION_FY"] = df["RECOMMENDATION_DATE"].apply(_financial_year)
    # FY defaults to Sanction FY for sanctioned works; falls back to Recommendation FY
    df["FY"] = df["SANCTION_FY"].fillna(df["RECOMMENDATION_FY"])
    df["RECIPIENT_TYPE"] = "Government Agency"  # default; refine once real IA_NAME/vendor patterns are known
    df["IS_TRIBAL_TRUST"] = False

    # --- honest gap: not fabricated, explicitly null with a one-time warning ---
    df["IS_SC_AREA"] = pd.NA
    df["IS_ST_AREA"] = pd.NA

    return df


if __name__ == "__main__":
    result = build_projects_master()
    if not result.empty:
        result.to_csv("projects_master.csv", index=False)
        print(f"Built projects_master.csv with {len(result)} rows")
        print("\n[NOTE] IS_SC_AREA / IS_ST_AREA are null — not available from the eSAKSHI API. "
              "Rules R6/R7 will not fire until this is enriched from an external source (see docstring).")
        print(result[["WORK_RECOMMENDATION_DTL_ID", "WORK_CATEGORY", "SANCTION_AMOUNT",
                       "days_to_sanction", "VENDOR_NAME", "is_completed_flag"]].head())
