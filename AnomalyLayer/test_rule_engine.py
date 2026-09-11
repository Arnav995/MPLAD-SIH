import pandas as pd
from rule_engine import RuleEngine
from benford_check import run_benford_by_group

pd.set_option("display.width", 140)
pd.set_option("display.max_colwidth", 60)

df = pd.read_csv("sample_projects_master.csv", parse_dates=["RECOMMENDATION_DATE", "SANCTION_DATE", "ACTUAL_END_DATE"])

# booleans got read back as strings from CSV — coerce them
for col in ["IS_SC_AREA", "IS_ST_AREA", "IS_TRIBAL_TRUST", "is_completed_flag"]:
    df[col] = df[col].astype(str).str.lower().map({"true": True, "false": False}).fillna(False)

engine = RuleEngine("rules_config.yaml")
result = engine.evaluate(df)

print("=" * 90)
print("SUMMARY: rule trigger counts across the dataset")
print("=" * 90)
rule_counts = {}
for viols in result["rule_violations"]:
    for v in viols:
        rule_counts[v["rule_id"]] = rule_counts.get(v["rule_id"], 0) + 1
for rule_id, count in sorted(rule_counts.items()):
    print(f"  {rule_id}: {count} projects flagged")

print()
print("=" * 90)
print("VALIDATION: does each seeded violation type actually get caught?")
print("=" * 90)
expected_min = {
    "R1": 6,   # seeded 8, some baseline noise could push some over 75 too
    "R3": 4,   # seeded 6
    "R4": 1,   # aggregate — should flag MP_1's whole cluster
    "R5": 4,   # seeded 5
    "R8": 3,   # seeded 4
    "R9": 3,   # seeded 3
    "D1": 3,   # seeded 5, IQR-based so some tolerance
}
for rule_id, min_expected in expected_min.items():
    actual = rule_counts.get(rule_id, 0)
    status = "PASS" if actual >= min_expected else "FAIL"
    print(f"  [{status}] {rule_id}: expected >= {min_expected}, got {actual}")

print()
print("=" * 90)
print("SAMPLE: top 5 highest rule_score projects, with their reasons")
print("=" * 90)
top5 = result.sort_values("rule_score", ascending=False).head(5)
for _, row in top5.iterrows():
    print(f"\nProject {row['WORK_RECOMMENDATION_DTL_ID']} ({row['WORK_CATEGORY']}, {row['IDA_NAME']}) — rule_score={row['rule_score']}")
    for v in row["rule_violations"]:
        print(f"    - [{v['rule_id']}] {v['description']}")

print()
print("=" * 90)
print("BENFORD'S LAW CHECK: by District (IDA_NAME)")
print("=" * 90)
benford_results = run_benford_by_group(df, amount_field="SANCTION_AMOUNT", group_field="IDA_NAME")
print(benford_results.to_string(index=False))
print("\n(District_5 was seeded with suspiciously repetitive/round amounts — expect it flagged or near-flagged)")
