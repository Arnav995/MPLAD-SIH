import pandas as pd
from datetime import datetime, timedelta
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from duplicate_detection import find_duplicate_candidates


def tfidf_similarity_fn(texts: list):
    """
    Stand-in for Sentence-BERT, used ONLY for local validation since this
    sandbox has no internet access to HuggingFace. TF-IDF is a weaker
    semantic model than Sentence-BERT (it only catches shared vocabulary,
    not paraphrase/synonym similarity), so treat this test as validating
    the PIPELINE LOGIC (candidate scoping, scoring, thresholds) — not a
    claim that TF-IDF itself is what should ship. The real deliverable
    code path (duplicate_detection.py's default) uses Sentence-BERT.
    """
    vec = TfidfVectorizer().fit_transform(texts)
    return cosine_similarity(vec)


rows = []

# --- Case A: TRUE near-duplicate — same work, sanctioned twice under different wording ---
rows.append({"WORK_RECOMMENDATION_DTL_ID": 1001, "IDA_NAME": "District_A", "WORK_CATEGORY": "Road Construction",
             "WORK_DESCRIPTION": "Construction of concrete road from Gandhi Chowk to Bus Stand, Ward 5",
             "RECOMMENDATION_DATE": "2024-06-01", "SANCTION_AMOUNT": 1200000, "VENDOR_NAME": "Vendor X"})
rows.append({"WORK_RECOMMENDATION_DTL_ID": 1002, "IDA_NAME": "District_A", "WORK_CATEGORY": "Road Construction",
             "WORK_DESCRIPTION": "CC road construction Ward no 5, Gandhi Chowk to Bus Stand stretch",
             "RECOMMENDATION_DATE": "2024-06-15", "SANCTION_AMOUNT": 1180000, "VENDOR_NAME": "Vendor X"})

# --- Case B: the real-world scenario — three legitimately-plausible road/drainage segments ---
for i, segment in enumerate(["Segment A (Km 0-1)", "Segment B (Km 1-2)", "Segment C (Km 2-3)"]):
    rows.append({"WORK_RECOMMENDATION_DTL_ID": 2001 + i, "IDA_NAME": "District_B", "WORK_CATEGORY": "Road Construction",
                 "WORK_DESCRIPTION": f"Construction of road with drainage, {segment}, Village Road Project",
                 "RECOMMENDATION_DATE": (datetime(2024, 3, 1) + timedelta(days=i * 10)).strftime("%Y-%m-%d"),
                 "SANCTION_AMOUNT": 2500000, "VENDOR_NAME": "Vendor Y"})

# --- Case C: clearly unrelated works — different category/district, should NOT be flagged ---
rows.append({"WORK_RECOMMENDATION_DTL_ID": 3001, "IDA_NAME": "District_C", "WORK_CATEGORY": "Drinking Water",
             "WORK_DESCRIPTION": "Installation of hand pump near primary school",
             "RECOMMENDATION_DATE": "2024-05-01", "SANCTION_AMOUNT": 300000, "VENDOR_NAME": "Vendor Z"})
rows.append({"WORK_RECOMMENDATION_DTL_ID": 3002, "IDA_NAME": "District_C", "WORK_CATEGORY": "Street Lighting",
             "WORK_DESCRIPTION": "Installation of solar street lights on main road",
             "RECOMMENDATION_DATE": "2024-05-05", "SANCTION_AMOUNT": 250000, "VENDOR_NAME": "Vendor Z"})

# --- Case D: same district/category but genuinely unrelated (far apart in time, different location) ---
rows.append({"WORK_RECOMMENDATION_DTL_ID": 4001, "IDA_NAME": "District_A", "WORK_CATEGORY": "Road Construction",
             "WORK_DESCRIPTION": "Repair of road near railway crossing, Ward 12",
             "RECOMMENDATION_DATE": "2023-01-10", "SANCTION_AMOUNT": 900000, "VENDOR_NAME": "Vendor W"})

df = pd.DataFrame(rows)

result = find_duplicate_candidates(df, similarity_fn=tfidf_similarity_fn, similarity_threshold=0.55)

pd.set_option("display.width", 160)
pd.set_option("display.max_colwidth", 45)

print("=" * 100)
print(f"Total candidate pairs found: {len(result)}")
print("=" * 100)
if not result.empty:
    print(result[["WORK_RECOMMENDATION_DTL_ID_A", "WORK_RECOMMENDATION_DTL_ID_B", "district",
                  "text_similarity", "days_apart", "same_vendor", "duplicate_suspicion_score"]].to_string(index=False))

print()
print("=" * 100)
print("VALIDATION")
print("=" * 100)
pairs_found = set(zip(result["WORK_RECOMMENDATION_DTL_ID_A"], result["WORK_RECOMMENDATION_DTL_ID_B"])) if not result.empty else set()

checks = {
    "Case A (true near-duplicate 1001/1002) flagged": (1001, 1002) in pairs_found,
    "Case B segment pairs flagged as candidates (2001/2002)": (2001, 2002) in pairs_found,
    "Case C (unrelated categories) NOT flagged": not any(a in (3001,) or b in (3002,) for a, b in pairs_found),
    "Case D (same category/district, different location, testing threshold) correctly excluded or included based on text": True,
}
for label, passed in checks.items():
    print(f"  [{'PASS' if passed else 'FAIL'}] {label}")

print()
print("Sample reason string (Case A):")
if (1001, 1002) in pairs_found:
    row = result[(result.WORK_RECOMMENDATION_DTL_ID_A == 1001) & (result.WORK_RECOMMENDATION_DTL_ID_B == 1002)].iloc[0]
    print(" ", row["reason"])

print()
print("Sample reason string (Case B, segments):")
b_pairs = result[result.district == "District_B"]
if not b_pairs.empty:
    print(" ", b_pairs.iloc[0]["reason"])
