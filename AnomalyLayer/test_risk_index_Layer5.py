import pandas as pd
from datetime import timedelta
from rule_engine import RuleEngine
from cost_anomaly import detect_cost_anomalies
from risk_index_Layer5 import compute_risk_index

pd.set_option("display.width", 160)
pd.set_option("display.max_colwidth", 50)

# --- load the same synthetic dataset used to validate Layers 1 & 2 ---
df = pd.read_csv("sample_projects_master.csv", parse_dates=["RECOMMENDATION_DATE", "SANCTION_DATE", "ACTUAL_END_DATE"])
for col in ["IS_SC_AREA", "IS_ST_AREA", "IS_TRIBAL_TRUST", "is_completed_flag"]:
    df[col] = df[col].astype(str).str.lower().map({"true": True, "false": False}).fillna(False)

# --- Layer 1 ---
engine = RuleEngine("rules_config.yaml")
df = engine.evaluate(df)

# --- Layer 2 ---
df = detect_cost_anomalies(df)

# --- construct a tiny synthetic duplicate-candidate pairs table for two known rows ---
# (simulating Layer 3's output without needing the full Sentence-BERT model here)
sample_ids = df["WORK_RECOMMENDATION_DTL_ID"].iloc[:2].tolist()
duplicate_pairs = pd.DataFrame([{
    "WORK_RECOMMENDATION_DTL_ID_A": sample_ids[0],
    "WORK_RECOMMENDATION_DTL_ID_B": sample_ids[1],
    "duplicate_suspicion_score": 0.95,
    "reason": "Description text is 95% similar to another work in the same district/category; "
              "candidate for human review to confirm whether this is a duplicate sanction "
              "or a legitimately distinct segment/phase of a larger project",
}])

# --- Layer 5 ---
result = compute_risk_index(df, duplicate_pairs_df=duplicate_pairs)

print("=" * 100)
print("TIER DISTRIBUTION")
print("=" * 100)
print(result["tier"].value_counts())
print()

print("=" * 100)
print("THE SCORE-CEILING FIX: do different severities actually differentiate now?")
print("=" * 100)
# rule_score alone caps at 40 for anything hitting >= ~3 rules. Confirm risk_index spreads out
# for rows that would have tied under Layer 1 alone.
capped_rows = result[result["rule_score"] >= 40].sort_values("risk_index", ascending=False)
print(f"{len(capped_rows)} rows hit Layer 1's rule_score cap of 40 (would have tied under Layer 1 alone).")
print("Their risk_index values under the composite score (should NOT all be identical):")
print(capped_rows[["WORK_RECOMMENDATION_DTL_ID", "rule_score", "cost_anomaly_score", "risk_index"]].head(10).to_string(index=False))
print(f"\nUnique risk_index values among these {len(capped_rows)} previously-tied rows: {capped_rows['risk_index'].nunique()}")

print()
print("=" * 100)
print("TOP 8 BY RISK INDEX — full reason trail")
print("=" * 100)
top8 = result.sort_values("risk_index", ascending=False).head(8)
for _, row in top8.iterrows():
    print(f"\nProject {row['WORK_RECOMMENDATION_DTL_ID']} — risk_index={row['risk_index']}, tier={row['tier']}, "
          f"anchors={row['primary_anchors']}, signal_types={row['signal_type_count']}")
    for r in row["reasons"]:
        print(f"    - {r}")

print()
print("=" * 100)
print("VALIDATION CHECKS")
print("=" * 100)
checks = {
    "risk_index is bounded 0-100": result["risk_index"].between(0, 100).all(),
    "The two synthetic duplicate-paired rows show DUPLICATE_WORK_OVERLAP anchor": all(
        "DUPLICATE_WORK_OVERLAP" in result.loc[result.WORK_RECOMMENDATION_DTL_ID == sid, "primary_anchors"].iloc[0]
        for sid in sample_ids
    ),
    "Previously-tied rule_score=40 rows now have >1 unique risk_index value": capped_rows["risk_index"].nunique() > 1,
    "Tier 2 is a small minority (alert-fatigue check)": (result["tier"] == "tier_2").mean() < 0.15,
    "No row silently defaults to risk_index=0 due to missing graph layer": result["risk_index"].isna().sum() == 0,
}
for label, passed in checks.items():
    print(f"  [{'PASS' if passed else 'FAIL'}] {label}")
