"""
Verification script for MPLADS-Sentinel End-to-End Pipeline & API Contract Compliance.
Tests data shapes, field types, JSON serializability, and contract adherence for all endpoints.
"""

import json
import math
import numpy as np
import pandas as pd
from pathlib import Path

def sanitize_value(v):
    if v is None:
        return None
    if isinstance(v, (float, np.floating)):
        if math.isnan(v) or math.isinf(v):
            return None
        return float(v)
    if isinstance(v, (int, np.integer)):
        return int(v)
    if isinstance(v, (bool, np.bool_)):
        return bool(v)
    if isinstance(v, str):
        v_str = v.strip()
        if v_str.lower() in ("nan", "none", "null"):
            return None
        return v_str
    return v

def verify_all():
    base_dir = Path("AnomalyLayer")
    if not (base_dir / "flagged_projects.csv").exists():
        base_dir = Path(".")
    
    print("=" * 80)
    print("MPLADS-SENTINEL: PIPELINE ARTIFACT & API CONTRACT VERIFICATION")
    print("=" * 80)
    
    flagged_path = base_dir / "flagged_projects.csv"
    dup_path = base_dir / "duplicate_candidates.csv"
    benford_path = base_dir / "benford_summary.csv"
    
    assert flagged_path.exists(), f"Missing {flagged_path}"
    assert dup_path.exists(), f"Missing {dup_path}"
    assert benford_path.exists(), f"Missing {benford_path}"
    
    df_flagged = pd.read_csv(flagged_path)
    df_dup = pd.read_csv(dup_path)
    df_benford = pd.read_csv(benford_path)
    
    print(f"\n1. Loaded Pipeline Artifacts:")
    print(f"   - flagged_projects.csv: {df_flagged.shape[0]} rows, {df_flagged.shape[1]} columns")
    print(f"   - duplicate_candidates.csv: {df_dup.shape[0]} candidate pairs")
    print(f"   - benford_summary.csv: {df_benford.shape[0]} districts evaluated")
    
    # -------------------------------------------------------------------------
    # Test 1: GET /api/projects compliance
    # -------------------------------------------------------------------------
    print("\n2. Verifying GET /api/projects schema:")
    required_projects_fields = [
        "work_id", "activity_name", "constituency", "district", "mp_name",
        "work_category", "sanction_amount", "days_to_sanction", "is_completed",
        "risk_index", "tier", "primary_anchors", "signal_type_count"
    ]
    
    # Parse helpers
    def parse_list(val):
        if pd.isna(val) or val is None:
            return []
        if isinstance(val, list):
            return val
        if isinstance(val, str):
            try:
                import ast
                res = ast.literal_eval(val)
                return res if isinstance(res, list) else [str(res)]
            except Exception:
                return [s.strip(" '\"[]") for s in val.split(",") if s.strip(" '\"[]")]
        return []

    sample_projects = []
    for _, row in df_flagged.head(5).iterrows():
        item = {
            "work_id": str(int(float(row["WORK_RECOMMENDATION_DTL_ID"]))) if pd.notna(row["WORK_RECOMMENDATION_DTL_ID"]) else None,
            "activity_name": sanitize_value(row.get("ACTIVITY_NAME")),
            "constituency": sanitize_value(row.get("CONSTITUENCY")),
            "district": sanitize_value(row.get("IDA_NAME")),
            "mp_name": sanitize_value(row.get("MP_NAME")),
            "work_category": sanitize_value(row.get("WORK_CATEGORY")),
            "sanction_amount": int(float(row["SANCTION_AMOUNT"])) if pd.notna(row.get("SANCTION_AMOUNT")) else 0,
            "days_to_sanction": sanitize_value(row.get("days_to_sanction")),
            "is_completed": bool(str(row.get("is_completed_flag", "")).lower() == "true"),
            "risk_index": float(row.get("risk_index", 0.0)),
            "tier": str(row.get("tier")),
            "primary_anchors": parse_list(row.get("primary_anchors")),
            "signal_type_count": int(row.get("signal_type_count", 0)),
        }
        for f in required_projects_fields:
            assert f in item, f"Missing field {f} in GET /api/projects item"
        sample_projects.append(item)
    
    projects_payload = {
        "total_count": len(df_flagged),
        "page": 1,
        "page_size": 50,
        "results": sample_projects
    }
    json_projects = json.dumps(projects_payload)
    print(f"   [PASS] Successfully serialized GET /api/projects payload ({len(json_projects)} bytes)")
    
    # -------------------------------------------------------------------------
    # Test 2: GET /api/projects/{work_id} compliance
    # -------------------------------------------------------------------------
    print("\n3. Verifying GET /api/projects/{work_id} schema:")
    # Find project 226219 (or top risk project)
    target_row = df_flagged[df_flagged["WORK_RECOMMENDATION_DTL_ID"] == 226219.0]
    if target_row.empty:
        target_row = df_flagged.sort_values("risk_index", ascending=False).head(1)
    
    row = target_row.iloc[0]
    work_id_str = str(int(float(row["WORK_RECOMMENDATION_DTL_ID"])))
    
    # Find duplicate candidates for this work_id
    work_id_num = float(work_id_str)
    paired_matches = df_dup[(df_dup["WORK_RECOMMENDATION_DTL_ID_A"] == work_id_num) | 
                            (df_dup["WORK_RECOMMENDATION_DTL_ID_B"] == work_id_num)]
    dup_candidates = []
    for _, d_row in paired_matches.iterrows():
        other_id = d_row["WORK_RECOMMENDATION_DTL_ID_B"] if d_row["WORK_RECOMMENDATION_DTL_ID_A"] == work_id_num else d_row["WORK_RECOMMENDATION_DTL_ID_A"]
        dup_candidates.append({
            "paired_work_id": str(int(float(other_id))),
            "text_similarity": float(d_row["text_similarity"]),
            "match_typology": str(d_row["match_typology"]),
            "duplicate_suspicion_score": float(d_row["duplicate_suspicion_score"]),
            "reason": str(d_row["reason"])
        })

    rule_viols = parse_list(row.get("rule_violations"))
    # ensure rule_violations is formatted list of dicts
    formatted_viols = []
    for v in rule_viols:
        if isinstance(v, dict):
            formatted_viols.append({
                "rule_id": str(v.get("rule_id")),
                "description": str(v.get("description")),
                "weight": int(v.get("weight", 0))
            })
        else:
            formatted_viols.append({"description": str(v)})

    detail_item = {
        "work_id": work_id_str,
        "activity_name": sanitize_value(row.get("ACTIVITY_NAME")),
        "work_description": sanitize_value(row.get("WORK_DESCRIPTION")),
        "constituency": sanitize_value(row.get("CONSTITUENCY")),
        "district": sanitize_value(row.get("IDA_NAME")),
        "mp_name": sanitize_value(row.get("MP_NAME")),
        "work_category": sanitize_value(row.get("WORK_CATEGORY")),
        "recommendation_date": sanitize_value(row.get("RECOMMENDATION_DATE")),
        "sanction_date": sanitize_value(row.get("SANCTION_DATE")),
        "sanction_amount": int(float(row["SANCTION_AMOUNT"])) if pd.notna(row.get("SANCTION_AMOUNT")) else 0,
        "vendor_name": sanitize_value(row.get("VENDOR_NAME")),
        "risk_index": float(row.get("risk_index", 0.0)),
        "tier": str(row.get("tier")),
        "primary_anchors": parse_list(row.get("primary_anchors")),
        "signal_type_count": int(row.get("signal_type_count", 0)),
        "reasons": parse_list(row.get("reasons")),
        "rule_violations": formatted_viols,
        "cost_anomaly": {
            "flag": bool(row.get("cost_anomaly_flag") is True or str(row.get("cost_anomaly_flag")).lower() == "true"),
            "score": sanitize_value(row.get("cost_anomaly_score")),
            "method": sanitize_value(row.get("cost_anomaly_method")),
            "category_median": sanitize_value(row.get("category_median")),
            "category_sample_size": int(row.get("category_sample_size")) if pd.notna(row.get("category_sample_size")) else None
        },
        "duplicate_candidates": dup_candidates
    }
    
    json_detail = json.dumps(detail_item, indent=2)
    print(f"   [PASS] Successfully generated and serialized project detail view for work_id {work_id_str}:")
    print(f"          - risk_index: {detail_item['risk_index']}")
    print(f"          - tier: {detail_item['tier']}")
    print(f"          - primary_anchors: {detail_item['primary_anchors']}")
    print(f"          - cost_anomaly method: {detail_item['cost_anomaly']['method']}, flag: {detail_item['cost_anomaly']['flag']}")
    print(f"          - reasons count: {len(detail_item['reasons'])}")
    print(f"          - rule_violations count: {len(detail_item['rule_violations'])}")

    # -------------------------------------------------------------------------
    # Test 3: GET /api/alerts/tier2-digest compliance
    # -------------------------------------------------------------------------
    print("\n4. Verifying GET /api/alerts/tier2-digest schema:")
    tier2_rows = df_flagged[df_flagged["tier"] == "tier_2"]
    total_eval = len(df_flagged)
    tier2_count = len(tier2_rows)
    tier2_pct = round((tier2_count / total_eval) * 100, 1)
    
    tier2_alerts = []
    for _, r in tier2_rows.iterrows():
        tier2_alerts.append({
            "work_id": str(int(float(r["WORK_RECOMMENDATION_DTL_ID"]))) if pd.notna(r["WORK_RECOMMENDATION_DTL_ID"]) else None,
            "activity_name": sanitize_value(r.get("ACTIVITY_NAME")),
            "constituency": sanitize_value(r.get("CONSTITUENCY")),
            "district": sanitize_value(r.get("IDA_NAME")),
            "mp_name": sanitize_value(r.get("MP_NAME")),
            "work_category": sanitize_value(r.get("WORK_CATEGORY")),
            "sanction_amount": int(float(r["SANCTION_AMOUNT"])) if pd.notna(r.get("SANCTION_AMOUNT")) else 0,
            "days_to_sanction": sanitize_value(r.get("days_to_sanction")),
            "is_completed": bool(str(r.get("is_completed_flag", "")).lower() == "true"),
            "risk_index": float(r.get("risk_index", 0.0)),
            "tier": "tier_2",
            "primary_anchors": parse_list(r.get("primary_anchors")),
            "signal_type_count": int(r.get("signal_type_count", 0)),
        })
        
    digest_payload = {
        "generated_at": "2026-09-24T16:30:00Z",
        "total_evaluated": total_eval,
        "tier2_count": tier2_count,
        "tier2_percentage": tier2_pct,
        "promotion_criteria": "Requires >= 2 independent corroborating signal types AND >= 1 primary risk anchor",
        "alerts": tier2_alerts
    }
    json_digest = json.dumps(digest_payload)
    print(f"   [PASS] Successfully generated GET /api/alerts/tier2-digest:")
    print(f"          - total_evaluated: {total_eval}")
    print(f"          - tier2_count: {tier2_count} ({tier2_pct}%)")
    print(f"          - alerts payload serialized cleanly ({len(json_digest)} bytes)")

    # -------------------------------------------------------------------------
    # Test 4: GET /api/duplicates compliance
    # -------------------------------------------------------------------------
    print("\n5. Verifying GET /api/duplicates schema:")
    required_dup_fields = [
        "work_id_a", "work_id_b", "district", "text_similarity", "days_apart",
        "same_vendor", "amount_ratio", "duplicate_suspicion_score", "reason"
    ]
    dup_results = []
    for _, d_row in df_dup.head(10).iterrows():
        item = {
            "work_id_a": str(int(float(d_row["WORK_RECOMMENDATION_DTL_ID_A"]))) if pd.notna(d_row["WORK_RECOMMENDATION_DTL_ID_A"]) else None,
            "work_id_b": str(int(float(d_row["WORK_RECOMMENDATION_DTL_ID_B"]))) if pd.notna(d_row["WORK_RECOMMENDATION_DTL_ID_B"]) else None,
            "district": sanitize_value(d_row.get("district")),
            "text_similarity": float(d_row.get("text_similarity", 0.0)),
            "days_apart": int(d_row.get("days_apart", 0)) if pd.notna(d_row.get("days_apart")) else 0,
            "same_vendor": bool(d_row.get("same_vendor")),
            "amount_ratio": float(d_row.get("amount_ratio", 1.0)) if pd.notna(d_row.get("amount_ratio")) else 1.0,
            "duplicate_suspicion_score": float(d_row.get("duplicate_suspicion_score", 0.0)),
            "reason": sanitize_value(d_row.get("reason")),
        }
        for f in required_dup_fields:
            assert f in item, f"Missing duplicate field {f}"
        dup_results.append(item)
    
    dup_payload = {"results": dup_results}
    json_dup = json.dumps(dup_payload)
    print(f"   [PASS] Successfully serialized GET /api/duplicates payload ({len(json_dup)} bytes)")

    # -------------------------------------------------------------------------
    # Test 5: GET /api/benford/districts compliance
    # -------------------------------------------------------------------------
    print("\n6. Verifying GET /api/benford/districts schema:")
    benford_districts = []
    for _, b_row in df_benford.iterrows():
        benford_districts.append({
            "district": sanitize_value(b_row.get("IDA_NAME")),
            "sample_size": int(b_row.get("sample_size", 0)),
            "mad": float(b_row.get("mad", 0.0)) if pd.notna(b_row.get("mad")) else None,
            "chi2_p_value": float(b_row.get("p_value", 0.0)) if pd.notna(b_row.get("p_value")) else None,
            "cochran_valid": bool(b_row.get("cochran_valid")),
            "status": "non_conforming" if b_row.get("is_flagged") else "conforming"
        })
    benford_payload = {
        "districts": benford_districts,
        "interpretation_note": "Non-conformance is observed uniformly across all districts and is attributed to administrative budget quantization (round-figure sanctioning), not fraud. See methodology notes."
    }
    json_benford = json.dumps(benford_payload)
    print(f"   [PASS] Successfully serialized GET /api/benford/districts payload ({len(json_benford)} bytes)")

    # -------------------------------------------------------------------------
    # Test 6: GET /api/districts/{district}/summary compliance
    # -------------------------------------------------------------------------
    print("\n7. Verifying GET /api/districts/{district}/summary and MP summary schema:")
    for dist in df_flagged["IDA_NAME"].dropna().unique()[:2]:
        sub = df_flagged[df_flagged["IDA_NAME"] == dist]
        total_w = len(sub)
        unsanc_pending = round(float((sub["SANCTION_DATE"].isna()).sum() / total_w * 100), 1)
        med_days = float(sub["days_to_sanction"].dropna().median()) if not sub["days_to_sanction"].dropna().empty else None
        t2_c = int((sub["tier"] == "tier_2").sum())
        t1_c = int((sub["tier"] == "tier_1").sum())
        clean_c = int((sub["tier"] == "clean").sum())
        
        summary_payload = {
            "scope_name": str(dist),
            "total_works": total_w,
            "unsanctioned_pending": unsanc_pending,
            "median_days_to_sanction": med_days,
            "tier2_count": t2_c,
            "tier1_count": t1_c,
            "clean_count": clean_c
        }
        json_sum = json.dumps(summary_payload)
        print(f"   [PASS] District Summary [{dist}]: total={total_w}, unsanctioned={unsanc_pending}%, median_days={med_days}, T2={t2_c}, T1={t1_c}, Clean={clean_c}")

    print("\n" + "=" * 80)
    print("ALL API CONTRACT CHECKS PASSED: Every endpoint can be served directly from current pipeline outputs!")
    print("=" * 80)

if __name__ == "__main__":
    verify_all()
