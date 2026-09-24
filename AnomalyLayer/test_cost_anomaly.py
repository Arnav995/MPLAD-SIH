import os
import pandas as pd
import numpy as np
from cost_anomaly import (
    detect_cost_anomalies,
    classify_functional_activity,
    extract_physical_scale,
    load_cost_normalization_config,
)
from rule_engine import RuleEngine

print("=" * 100)
print("LAYER 2.0 UNIT TEST SUITE: COST ANOMALY & PARITY ENGINE")
print("=" * 100)

# ----------------------------------------------------------------------
# Test 1: Functional Activity Classification
# ----------------------------------------------------------------------
print("\n[Test 1] Functional Activity Classification...")
sample_rows = [
    {"WORK_CATEGORY": "Normal/Others", "ACTIVITY_NAME": "Construction of roads, link roads, pathways", "WORK_DESCRIPTION": "CC road from A to B"},
    {"WORK_CATEGORY": "Normal/Others", "ACTIVITY_NAME": "Construction of community centers and halls", "WORK_DESCRIPTION": "Samaj Bhavan construction"},
    {"WORK_CATEGORY": "Normal/Others", "ACTIVITY_NAME": "Construction of public libraries and reading rooms", "WORK_DESCRIPTION": "Construction of Library at Mouza Indora"},
    {"WORK_CATEGORY": "Normal/Others", "ACTIVITY_NAME": "Fitting of Sitting RCC Benches in Public Places", "WORK_DESCRIPTION": "100 benches in GP"},
    {"WORK_CATEGORY": "Normal/Others", "ACTIVITY_NAME": "wells and borewells", "WORK_DESCRIPTION": "Installation of a borewell"},
    {"WORK_CATEGORY": "Normal/Others", "ACTIVITY_NAME": "Purchase of IT systems", "WORK_DESCRIPTION": "Providing 30 Computer Sets"},
    {"WORK_CATEGORY": "Normal/Others", "ACTIVITY_NAME": "Purchase of prosthetics", "WORK_DESCRIPTION": "Providing artificial limbs"},
]

expected_activities = [
    "ROADS_AND_DRAINAGE",
    "COMMUNITY_HALLS_AND_STRUCTURES",
    "COMMUNITY_HALLS_AND_STRUCTURES",
    "PUBLIC_BENCHES",
    "WATER_AND_BOREWELLS",
    "EDUCATION_AND_IT",
    "HEALTH_AND_ASSISTIVE_DEVICES",
]

actual_activities = [classify_functional_activity(r) for r in sample_rows]
t1_passed = actual_activities == expected_activities
print(f"  [{'PASS' if t1_passed else 'FAIL'}] Activity classification matches expected clusters:")
for exp, act in zip(expected_activities, actual_activities):
    print(f"      Expected: {exp:<32} | Actual: {act}")

# ----------------------------------------------------------------------
# Test 2: Physical Scale Extraction
# ----------------------------------------------------------------------
print("\n[Test 2] Physical Scale & Unit Extraction...")
t2_cases = [
    ("Installation of cement concrete benches total 100 benches", {"item": "benches", "quantity": 100, "unit_name": "bench"}),
    ("Providing 30 Computer Sets to Mahila Mahavidyalaya", {"item": "computers", "quantity": 30, "unit_name": "computer"}),
    ("Purchase of 6 Computers along with 3 Printers", {"item": "computers", "quantity": 6, "unit_name": "computer"}),
    ("Installation of 2 borewells near temple", {"item": "borewells", "quantity": 2, "unit_name": "borewell"}),
    ("General road construction work without unit count", None),
]

t2_passed = True
for desc, exp in t2_cases:
    res = extract_physical_scale({"WORK_DESCRIPTION": desc})
    if res != exp:
        t2_passed = False
    print(f"  [{'PASS' if res == exp else 'FAIL'}] '{desc[:45]}...' -> {res}")

# ----------------------------------------------------------------------
# Test 3: Scale Normalization Prevents False Positives on Bulk Benches
# ----------------------------------------------------------------------
print("\n[Test 3] Scale Normalization (Bulk Deployment vs Unit Pricing)...")
bench_rows = [
    # 5 single-village bench sets (3 to 5 benches, Rs 30k to 50k -> Rs 10k/bench)
    {"WORK_RECOMMENDATION_DTL_ID": 7001, "WORK_CATEGORY": "Normal/Others", "SANCTION_AMOUNT": 34000, "SANCTION_DATE": "2024-06-01", "WORK_DESCRIPTION": "Installation of 3 cement concrete benches in GP A"},
    {"WORK_RECOMMENDATION_DTL_ID": 7002, "WORK_CATEGORY": "Normal/Others", "SANCTION_AMOUNT": 40000, "SANCTION_DATE": "2024-06-01", "WORK_DESCRIPTION": "Installation of 4 cement concrete benches in GP B"},
    {"WORK_RECOMMENDATION_DTL_ID": 7003, "WORK_CATEGORY": "Normal/Others", "SANCTION_AMOUNT": 50000, "SANCTION_DATE": "2024-06-01", "WORK_DESCRIPTION": "Installation of 5 cement concrete benches in GP C"},
    {"WORK_RECOMMENDATION_DTL_ID": 7004, "WORK_CATEGORY": "Normal/Others", "SANCTION_AMOUNT": 35000, "SANCTION_DATE": "2024-06-01", "WORK_DESCRIPTION": "Installation of 3 cement concrete benches in GP D"},
    {"WORK_RECOMMENDATION_DTL_ID": 7005, "WORK_CATEGORY": "Normal/Others", "SANCTION_AMOUNT": 45000, "SANCTION_DATE": "2024-06-01", "WORK_DESCRIPTION": "Installation of 4 cement concrete benches in GP E"},
    # 1 bulk umbrella allocation: 100 benches for Rs 7.00 Lakh (Rs 7,000/bench -> actually cheaper than retail unit rate!)
    {"WORK_RECOMMENDATION_DTL_ID": 7006, "WORK_CATEGORY": "Normal/Others", "SANCTION_AMOUNT": 700000, "SANCTION_DATE": "2024-06-01", "WORK_DESCRIPTION": "Installation of cement concrete benches total 100 benches across taluka"},
]

df_benches = pd.DataFrame(bench_rows)
out_benches = detect_cost_anomalies(df_benches, min_samples_for_fallback=3, min_samples_for_model=10)

bulk_row = out_benches[out_benches["WORK_RECOMMENDATION_DTL_ID"] == 7006].iloc[0]
t3_passed = not bool(bulk_row["cost_anomaly_flag"])
print(f"  [{'PASS' if t3_passed else 'FAIL'}] Bulk 100-bench work (Rs 7 Lakh, Rs 7,000/unit) NOT flagged as cost anomaly:")
print(f"      Evaluated Unit Amount: Rs {bulk_row['evaluated_cost_amount']:,.0f}/unit | Category Median: Rs {bulk_row['category_median']:,.0f}/unit | Flag: {bulk_row['cost_anomaly_flag']}")

# ----------------------------------------------------------------------
# Test 4: Primary Positive Control (True Anomaly Detection Remains Decisive)
# ----------------------------------------------------------------------
print("\n[Test 4] Positive Control: Genuinely Inflated Project & Unscaled Token Work Flagged...")
road_rows = [
    {"WORK_RECOMMENDATION_DTL_ID": 8001 + i, "WORK_CATEGORY": "Normal/Others", "SANCTION_AMOUNT": amt, "SANCTION_DATE": "2024-06-01", "WORK_DESCRIPTION": "Construction of CC road and drain"}
    for i, amt in enumerate([1000000, 1100000, 1200000, 950000, 1050000, 1150000, 1250000, 980000, 1020000, 1100000])
]
# Add 1 grossly inflated road: Rs 60 Lakh (5x typical)
road_rows.append({"WORK_RECOMMENDATION_DTL_ID": 8999, "WORK_CATEGORY": "Normal/Others", "SANCTION_AMOUNT": 6000000, "SANCTION_DATE": "2024-06-01", "WORK_DESCRIPTION": "Construction of CC road and drain"})
# Add 1 suspiciously under-budget road: Rs 40,000 (0.04x typical token / under-scoped work)
road_rows.append({"WORK_RECOMMENDATION_DTL_ID": 8000, "WORK_CATEGORY": "Normal/Others", "SANCTION_AMOUNT": 40000, "SANCTION_DATE": "2024-06-01", "WORK_DESCRIPTION": "Construction of CC road and drain"})

df_roads = pd.DataFrame(road_rows)
out_roads = detect_cost_anomalies(df_roads, min_samples_for_fallback=3, min_samples_for_model=8, contamination=0.15)

inflated_row = out_roads[out_roads["WORK_RECOMMENDATION_DTL_ID"] == 8999].iloc[0]
low_row = out_roads[out_roads["WORK_RECOMMENDATION_DTL_ID"] == 8000].iloc[0]

t4_hi_passed = bool(inflated_row["cost_anomaly_flag"]) and inflated_row["cost_anomaly_score"] >= 0.80
t4_lo_passed = bool(low_row["cost_anomaly_flag"]) and "below typical" in str(low_row["cost_anomaly_reason"])
t4_passed = t4_hi_passed and t4_lo_passed

print(f"  [{'PASS' if t4_hi_passed else 'FAIL'}] Grossly inflated road (Rs 60 Lakh vs Rs 10.5L median) decisively flagged:")
print(f"      Score: {inflated_row['cost_anomaly_score']:.3f} | Flag: {inflated_row['cost_anomaly_flag']} | Reason: {inflated_row['cost_anomaly_reason']}")
print(f"  [{'PASS' if t4_lo_passed else 'FAIL'}] Suspiciously cheap unscaled road (Rs 40,000 vs Rs 10.5L median) flagged as two-sided outlier:")
print(f"      Score: {low_row['cost_anomaly_score']:.3f} | Flag: {low_row['cost_anomaly_flag']} | Reason: {low_row['cost_anomaly_reason']}")

# ----------------------------------------------------------------------
# Test 5: Strict Statutory Isolation Guarantee (Layer 1 Nominal Untouched)
# ----------------------------------------------------------------------
print("\n[Test 5] Statutory Isolation Guarantee (Layer 1 RuleEngine Evaluates Nominal Amounts)...")
df_master = pd.read_csv("projects_master.csv")
for col in ["IS_SC_AREA", "IS_ST_AREA", "IS_TRIBAL_TRUST", "is_completed_flag"]:
    if col in df_master.columns:
        df_master[col] = df_master[col].astype(str).str.lower().map({"true": True, "false": False}).fillna(False)

engine = RuleEngine("rules_config.yaml")

# Run Layer 1 on raw data
df_l1_before = engine.evaluate(df_master.copy())

# Run Layer 2 on data
df_l2 = detect_cost_anomalies(df_master.copy())

# Run Layer 1 on Layer 2 output
df_l1_after = engine.evaluate(df_l2.copy())

scores_identical = (df_l1_before["rule_score"] == df_l1_after["rule_score"]).all()
amounts_identical = (df_master["SANCTION_AMOUNT"] == df_l2["SANCTION_AMOUNT"]).all()
t5_passed = scores_identical and amounts_identical
print(f"  [{'PASS' if t5_passed else 'FAIL'}] SANCTION_AMOUNT untouched across all {len(df_master)} rows: {amounts_identical}")
print(f"  [{'PASS' if t5_passed else 'FAIL'}] Layer 1 rule_scores 100% identical before and after Layer 2: {scores_identical}")

# ----------------------------------------------------------------------
# Test 6: Dormant Workstream 2 Verification
# ----------------------------------------------------------------------
print("\n[Test 6] Workstream 2 Neutral Defaults & Safety Bounds Verification...")
cfg = load_cost_normalization_config("rules_config.yaml")
geo_indices = cfg.get("geographic_cost_indices", {})
scale_ceilings = cfg.get("scale_quantity_ceilings", {})

t6_dormant = (cfg.get("enabled") is False and "ASSUMED" in cfg.get("status", ""))
t6_bounds = (cfg.get("min_deflator_multiplier") == 0.70 and cfg.get("max_deflator_multiplier") == 1.50)
t6_ceilings = (scale_ceilings.get("benches") == 500 and scale_ceilings.get("computers") == 100 and scale_ceilings.get("borewells") == 10)
t6_geo_clean = ("RAMTEK_CONSTITUENCY" not in geo_indices and "NAGPUR(DISTRICT COLLECTOR NAGPUR_IDA)" in geo_indices)

t6_passed = t6_dormant and t6_bounds and t6_ceilings and t6_geo_clean

print(f"  [{'PASS' if t6_dormant else 'FAIL'}] Workstream 2 dormant: enabled={cfg.get('enabled')}, status='{cfg.get('status')}'")
print(f"  [{'PASS' if t6_bounds else 'FAIL'}] Safety bounds present: min={cfg.get('min_deflator_multiplier')}, max={cfg.get('max_deflator_multiplier')}")
print(f"  [{'PASS' if t6_ceilings else 'FAIL'}] Physical scale ceilings configured: {scale_ceilings}")
print(f"  [{'PASS' if t6_geo_clean else 'FAIL'}] Geographic keying clean: Ramtek correctly unified under NAGPUR_IDA (no dangling RAMTEK_CONSTITUENCY key)")

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
print("\n" + "=" * 100)
print("TEST SUITE SUMMARY")
print("=" * 100)
all_checks = {
    "1. Functional Activity Classification": t1_passed,
    "2. Physical Scale Extraction": t2_passed,
    "3. Scale Normalization (Anti-False-Positive on Benches)": t3_passed,
    "4. Positive Control (True Anomaly Detection)": t4_passed,
    "5. Statutory Isolation Guarantee (Layer 1 Untouched)": t5_passed,
    "6. Workstream 2 Neutral Dormancy & Safety Bounds": t6_passed,
}

all_ok = True
for name, passed in all_checks.items():
    if not passed:
        all_ok = False
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}")

assert all_ok, "One or more Layer 2.0 unit tests failed!"
print("\nAll Layer 2.0 unit tests passed successfully!")
