from __future__ import annotations

import contextlib
import io
import json
import sys
from datetime import datetime

import numpy as np
import pandas as pd

from rule_engine import RuleEngine, coerce_booleans
from cost_anomaly import detect_cost_anomalies
from duplicate_detection import find_duplicate_candidates
from risk_index_Layer5 import compute_risk_index


def parse_date(value):
    if value is None or value == "":
        return pd.NaT

    parsed = pd.to_datetime(
        value,
        errors="coerce",
        utc=True,
    )

    if pd.isna(parsed):
        return pd.NaT

    return parsed.tz_localize(None)


def financial_year(value):
    if pd.isna(value):
        return None

    if value.month >= 4:
        return f"{value.year}-{str(value.year + 1)[-2:]}"

    return f"{value.year - 1}-{str(value.year)[-2:]}"


def clean_number(value):
    if value is None:
        return None

    try:
        number = float(value)

        if not np.isfinite(number):
            return None

        return number
    except Exception:
        return None


def clean_json_value(value):
    if value is None:
        return None

    if isinstance(value, (np.integer,)):
        return int(value)

    if isinstance(value, (np.floating,)):
        if not np.isfinite(value):
            return None

        return float(value)

    if isinstance(value, pd.Timestamp):
        return value.isoformat()

    if isinstance(value, float) and not np.isfinite(value):
        return None

    if isinstance(value, dict):
        return {
            str(key): clean_json_value(val)
            for key, val in value.items()
        }

    if isinstance(value, (list, tuple)):
        return [
            clean_json_value(item)
            for item in value
        ]

    return value


def prepare_dataframe(records):
    df = pd.DataFrame(records)

    if df.empty:
        return df

    date_columns = [
        "RECOMMENDATION_DATE",
        "SANCTION_DATE",
        "ACTUAL_END_DATE",
    ]

    for column in date_columns:
        if column not in df.columns:
            df[column] = pd.NaT
        else:
            df[column] = df[column].apply(parse_date)

    amount_columns = [
        "SANCTION_AMOUNT",
        "RECOMMENDED_AMOUNT",
        "ACTUAL_AMOUNT",
        "FUND_DISBURSED_AMT",
    ]

    for column in amount_columns:
        if column not in df.columns:
            df[column] = np.nan
        else:
            df[column] = pd.to_numeric(
                df[column],
                errors="coerce",
            )

    defaults = {
        "WORK_CATEGORY": "Unknown",
        "WORK_DESCRIPTION": "",
        "ACTIVITY_NAME": "",
        "IDA_NAME": "",
        "MP_NAME": "",
        "CONSTITUENCY": "",
        "LETTER_NO": "",
        "VENDOR_NAME": None,
        "RECIPIENT_TYPE": "Government Agency",
        "IS_TRIBAL_TRUST": False,
    }

    for column, default in defaults.items():
        if column not in df.columns:
            df[column] = default

    # All parsed dates are timezone-naive.
    now = pd.Timestamp(datetime.now())

    df["days_to_sanction"] = (
        df["SANCTION_DATE"]
        - df["RECOMMENDATION_DATE"]
    ).dt.days

    df["days_since_recommendation"] = (
        now
        - df["RECOMMENDATION_DATE"]
    ).dt.days

    df["days_to_complete"] = (
        df["ACTUAL_END_DATE"]
        - df["SANCTION_DATE"]
    ).dt.days

    df["is_completed_flag"] = (
        df["ACTUAL_END_DATE"].notna()
    )

    df["SANCTION_FY"] = (
        df["SANCTION_DATE"]
        .apply(financial_year)
    )

    df["RECOMMENDATION_FY"] = (
        df["RECOMMENDATION_DATE"]
        .apply(financial_year)
    )

    df["FY"] = (
        df["SANCTION_FY"]
        .fillna(df["RECOMMENDATION_FY"])
    )

    # eSAKSHI does not currently provide these fields.
    # Keep them unevaluable instead of fabricating values.
    if "IS_SC_AREA" not in df.columns:
        df["IS_SC_AREA"] = pd.NA

    if "IS_ST_AREA" not in df.columns:
        df["IS_ST_AREA"] = pd.NA

    return df


def serialize_duplicate_pairs(df):
    if df is None or df.empty:
        return []

    output = []

    for _, row in df.iterrows():
        output.append({
            "work_id_a": str(
                row.get("WORK_RECOMMENDATION_DTL_ID_A")
            ),
            "work_id_b": str(
                row.get("WORK_RECOMMENDATION_DTL_ID_B")
            ),
            "district": clean_json_value(
                row.get("district")
            ),
            "category": clean_json_value(
                row.get("category")
            ),
            "text_similarity": clean_number(
                row.get("text_similarity")
            ),
            "days_apart": clean_number(
                row.get("days_apart")
            ),
            "amount_ratio": clean_number(
                row.get("amount_ratio")
            ),
            "same_vendor": bool(
                row.get("same_vendor", False)
            ),
            "duplicate_suspicion_score": clean_number(
                row.get("duplicate_suspicion_score")
            ),
            "reason": clean_json_value(
                row.get("reason")
            ),
        })

    return output


def serialize_projects(df):
    output = []

    for _, row in df.iterrows():
        rule_violations = row.get(
            "rule_violations",
            [],
        )

        if not isinstance(rule_violations, list):
            rule_violations = []

        primary_anchors = row.get(
            "primary_anchors",
            [],
        )

        if not isinstance(primary_anchors, list):
            primary_anchors = []

        reasons = row.get(
            "reasons",
            [],
        )

        if not isinstance(reasons, list):
            reasons = []

        duplicate_paired_with = row.get(
            "duplicate_paired_with",
        )

        if not isinstance(duplicate_paired_with, list):
            duplicate_paired_with = []

        tier = row.get("tier", "clean")

        if pd.isna(tier):
            tier = "clean"

        output.append({
            "work_id": str(
                row.get("WORK_RECOMMENDATION_DTL_ID")
            ),
            "risk_index": clean_number(
                row.get("risk_index")
            ),
            "tier": str(tier),
            "primary_anchors": clean_json_value(
                primary_anchors
            ),
            "signal_type_count": int(
                row.get("signal_type_count", 0)
            ),
            "reasons": clean_json_value(
                reasons
            ),
            "tier_promotion_reason": clean_json_value(
                row.get("tier_promotion_reason")
            ),
            "rule_score": clean_number(
                row.get("rule_score")
            ),
            "rule_violations": clean_json_value(
                rule_violations
            ),
            "cost_anomaly_score": clean_number(
                row.get("cost_anomaly_score")
            ),
            "cost_anomaly_flag": bool(
                row.get("cost_anomaly_flag", False)
            ),
            "cost_anomaly_method": clean_json_value(
                row.get("cost_anomaly_method")
            ),
            "category_median": clean_number(
                row.get("category_median")
            ),
            "category_sample_size": clean_number(
                row.get("category_sample_size")
            ),
            "duplicate_score": clean_number(
                row.get("duplicate_score")
            ),
            "duplicate_paired_with": clean_json_value(
                duplicate_paired_with
            ),
            "duplicate_reason": clean_json_value(
                row.get("duplicate_reason_raw")
            ),
            "fast_track_flag": bool(
                row.get("fast_track_flag", False)
            ),
        })

    return output


def run_pipeline(records):
    df = prepare_dataframe(records)

    if df.empty:
        return {
            "projects": [],
            "duplicate_candidates": [],
            "summary": {
                "projects": 0,
                "tier_2": 0,
                "tier_1": 0,
                "clean": 0,
            },
        }

    rule_engine = RuleEngine(
        "rules_config.yaml"
    )

    df = coerce_booleans(df)

    df = rule_engine.evaluate(df)

    df = detect_cost_anomalies(
        df,
        only_sanctioned=True,
    )

    duplicate_pairs = find_duplicate_candidates(
        df,
        district_col="IDA_NAME",
        desc_col="WORK_DESCRIPTION",
        date_col="RECOMMENDATION_DATE",
        category_col="WORK_CATEGORY",
        amount_col="SANCTION_AMOUNT",
        vendor_col="VENDOR_NAME",
        id_col="WORK_RECOMMENDATION_DTL_ID",
    )

    df = compute_risk_index(
        df,
        duplicate_pairs_df=duplicate_pairs,
        id_col="WORK_RECOMMENDATION_DTL_ID",
        min_signal_types_for_tier2=2,
        require_anchor_for_tier2=True,
    )

    tiers = df["tier"].value_counts().to_dict()

    return {
        "projects": serialize_projects(df),
        "duplicate_candidates": serialize_duplicate_pairs(
            duplicate_pairs
        ),
        "summary": {
            "projects": len(df),
            "tier_2": int(
                tiers.get("tier_2", 0)
            ),
            "tier_1": int(
                tiers.get("tier_1", 0)
            ),
            "clean": int(
                tiers.get("clean", 0)
            ),
        },
    }


def main():
    raw = sys.stdin.read()

    if not raw.strip():
        raise ValueError(
            "No JSON input received on stdin."
        )

    records = json.loads(raw)

    if not isinstance(records, list):
        raise ValueError(
            "Expected a JSON array of project records."
        )

    # The ML libraries can print warnings/logs to stdout.
    # Capture them so stdout remains valid JSON for Node.
    captured_output = io.StringIO()

    with contextlib.redirect_stdout(captured_output):
        result = run_pipeline(records)

    print(
        json.dumps(
            result,
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            json.dumps({
                "error": str(error)
            }),
            file=sys.stderr,
        )
        sys.exit(1)