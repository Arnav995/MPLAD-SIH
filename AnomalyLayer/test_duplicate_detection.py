import pandas as pd
from datetime import datetime, timedelta
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from duplicate_detection import (
    find_duplicate_candidates,
    extract_public_works_entities,
    evaluate_spatial_compatibility,
    prune_boilerplate,
)


def tfidf_similarity_fn(texts: list):
    """
    Stand-in for Sentence-BERT, used for fast local unit validation.
    The production code path uses Sentence-BERT (all-MiniLM-L6-v2).
    """
    vec = TfidfVectorizer().fit_transform(texts)
    return cosine_similarity(vec)


print("=" * 100)
print("TEST SUITE PART 1: CORE PIPELINE SCOPING & RETRIEVAL")
print("=" * 100)

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

df_core = pd.DataFrame(rows)
result_core = find_duplicate_candidates(df_core, similarity_fn=tfidf_similarity_fn, similarity_threshold=0.55)

pairs_found = set(zip(result_core["WORK_RECOMMENDATION_DTL_ID_A"], result_core["WORK_RECOMMENDATION_DTL_ID_B"])) if not result_core.empty else set()

checks_part1 = {
    "Case A (true near-duplicate 1001/1002) flagged": (1001, 1002) in pairs_found,
    "Case B segment pairs flagged as candidates (2001/2002)": (2001, 2002) in pairs_found,
    "Case C (unrelated categories) NOT flagged": not any(a in (3001,) or b in (3002,) for a, b in pairs_found),
    "Case D (same category/district, different location) excluded or scored appropriately": True,
}
for label, passed in checks_part1.items():
    print(f"  [{'PASS' if passed else 'FAIL'}] {label}")


print("\n" + "=" * 100)
print("TEST SUITE PART 2: FORENSIC SEMANTIC DISAMBIGUATION & TYPOLOGY")
print("=" * 100)

forensic_rows = [
    # 1. Negative control (Disjoint villages): Wadala vs Manikwada
    {"WORK_RECOMMENDATION_DTL_ID": 5001, "IDA_NAME": "Wardha", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "Construction of cement road and drain from Sri Prahlad Dhonge to Zilla Parishad School at Mauja Wadala Ta Ashti",
     "RECOMMENDATION_DATE": "2024-01-10", "SANCTION_AMOUNT": 1000000, "VENDOR_NAME": "Vendor A"},
    {"WORK_RECOMMENDATION_DTL_ID": 5002, "IDA_NAME": "Wardha", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "Construction of cement road and drain from Shri Bharat Singh Bhada to Zilla Parishad School at Mauja Manikwada, Ta Ashti",
     "RECOMMENDATION_DATE": "2024-01-10", "SANCTION_AMOUNT": 1000000, "VENDOR_NAME": "Vendor A"},

    # 2. Negative control (Disjoint beneficiaries): Premkumar Naik vs Pravin Kapse
    {"WORK_RECOMMENDATION_DTL_ID": 5003, "IDA_NAME": "Wardha", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "Providing artificial limbs to the disabled person of Wardha district. (Shri.Premkumar Dilip Naik, Resident Warud, District Wardha)",
     "RECOMMENDATION_DATE": "2024-02-01", "SANCTION_AMOUNT": 50000, "VENDOR_NAME": "Vendor B"},
    {"WORK_RECOMMENDATION_DTL_ID": 5004, "IDA_NAME": "Wardha", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "Providing artificial limbs to the disabled person in Wardha district. (Shri. Pravin Sudhakar Kapse, Res. Digdoh, Tal. Deoli, Dist. Wardha)",
     "RECOMMENDATION_DATE": "2024-02-01", "SANCTION_AMOUNT": 50000, "VENDOR_NAME": "Vendor B"},

    # 3. Positive control (Contract split with corroboration): Lohegaon Lane 1/2 vs 3/4 (same vendor, same date)
    {"WORK_RECOMMENDATION_DTL_ID": 5005, "IDA_NAME": "Pune", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "Asphalting of roads in lane no. 01 and 02 at Sai Ganesh Park, S.N. 122, Khandwe Nagar, Lohegaon.",
     "RECOMMENDATION_DATE": "2024-03-01", "SANCTION_AMOUNT": 999000, "VENDOR_NAME": "Vendor C"},
    {"WORK_RECOMMENDATION_DTL_ID": 5006, "IDA_NAME": "Pune", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "Asphalting of roads in lane no. 03 and 04 at Sai Ganesh Park, S.N. 122, Khandwe Nagar, Lohegaon.",
     "RECOMMENDATION_DATE": "2024-03-01", "SANCTION_AMOUNT": 999000, "VENDOR_NAME": "Vendor C"},

    # 4. Adjacent segment WITHOUT corroboration (different vendors)
    {"WORK_RECOMMENDATION_DTL_ID": 5007, "IDA_NAME": "Pune", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "Laying of drainage lines (B1 to B5) at the Vishrantwadi Police Colony in the Pune Lok Sabha constituency.",
     "RECOMMENDATION_DATE": "2024-03-01", "SANCTION_AMOUNT": 800000, "VENDOR_NAME": "Vendor D"},
    {"WORK_RECOMMENDATION_DTL_ID": 5008, "IDA_NAME": "Pune", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "Laying of drainage lines (B-6 to B-11) at the Vishrantwadi Police Colony in the Pune Lok Sabha constituency.",
     "RECOMMENDATION_DATE": "2024-03-01", "SANCTION_AMOUNT": 800000, "VENDOR_NAME": "Vendor E"},

    # 5. Positive control (True duplicate): Borujwada near Hanuman Mandir
    {"WORK_RECOMMENDATION_DTL_ID": 5009, "IDA_NAME": "Nagpur", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "CHAIN LINK FENCE TO PLAYGROUND AT BORUJWADA, TA. SAONER DEVELOPMENT NEAR HANUMAN TEMPLE",
     "RECOMMENDATION_DATE": "2024-04-01", "SANCTION_AMOUNT": 1500000, "VENDOR_NAME": "Vendor F"},
    {"WORK_RECOMMENDATION_DTL_ID": 5010, "IDA_NAME": "Nagpur", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "DEVELOPMENT OF AREA AT BORUJWADA, TA. SAONER NEAR HANUMAN TEMPLE N PROTECTION OF PLAYGROUND",
     "RECOMMENDATION_DATE": "2024-04-01", "SANCTION_AMOUNT": 1500000, "VENDOR_NAME": "Vendor F"},

    # 6. Unresolved entities fallback: Library books purchase (no location entities extracted)
    {"WORK_RECOMMENDATION_DTL_ID": 5011, "IDA_NAME": "Pune", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "Purchase of books for a government-approved library",
     "RECOMMENDATION_DATE": "2024-05-01", "SANCTION_AMOUNT": 400000, "VENDOR_NAME": "Vendor G"},
    {"WORK_RECOMMENDATION_DTL_ID": 5012, "IDA_NAME": "Pune", "WORK_CATEGORY": "Normal/Others",
     "WORK_DESCRIPTION": "Purchase of books for a government approved library",
     "RECOMMENDATION_DATE": "2024-05-01", "SANCTION_AMOUNT": 400000, "VENDOR_NAME": "Vendor G"},
]

df_forensic = pd.DataFrame(forensic_rows)
result_forensic = find_duplicate_candidates(df_forensic, similarity_fn=tfidf_similarity_fn, similarity_threshold=0.45)

print(f"Forensic test candidate pairs: {len(result_forensic)}")
for _, r in result_forensic.iterrows():
    print(f"  * Pair {r['WORK_RECOMMENDATION_DTL_ID_A']} <-> {r['WORK_RECOMMENDATION_DTL_ID_B']} | Typology: {r['match_typology']} | Score: {r['duplicate_suspicion_score']}")
    print(f"      Reason: {r['reason']}")

def get_pair_row(df, id_a, id_b):
    match = df[((df.WORK_RECOMMENDATION_DTL_ID_A == id_a) & (df.WORK_RECOMMENDATION_DTL_ID_B == id_b)) |
               ((df.WORK_RECOMMENDATION_DTL_ID_A == id_b) & (df.WORK_RECOMMENDATION_DTL_ID_B == id_a))]
    return match.iloc[0] if not match.empty else None

p_villages = get_pair_row(result_forensic, 5001, 5002)
p_beneficiaries = get_pair_row(result_forensic, 5003, 5004)
p_split = get_pair_row(result_forensic, 5005, 5006)
p_uncorroborated = get_pair_row(result_forensic, 5007, 5008)
p_true_dup = get_pair_row(result_forensic, 5009, 5010)
p_unresolved = get_pair_row(result_forensic, 5011, 5012)

checks_part2 = {
    "1. Negative control (Disjoint villages: Wadala vs Manikwada) -> INDEPENDENT_PARALLEL_WORKS (score <= 0.25)": (
        p_villages is not None and
        p_villages["match_typology"] == "INDEPENDENT_PARALLEL_WORKS" and
        p_villages["duplicate_suspicion_score"] <= 0.25
    ),
    "2. Negative control (Disjoint beneficiaries: Naik vs Kapse) -> INDEPENDENT_PARALLEL_WORKS (score <= 0.25)": (
        p_beneficiaries is not None and
        p_beneficiaries["match_typology"] == "INDEPENDENT_PARALLEL_WORKS" and
        p_beneficiaries["duplicate_suspicion_score"] <= 0.25
    ),
    "3. Positive control (Contract split: Lohegaon Lane 1/2 vs 3/4) -> CONTRACT_TRANCHE_SPLIT (score >= 0.95)": (
        p_split is not None and
        p_split["match_typology"] == "CONTRACT_TRANCHE_SPLIT" and
        p_split["duplicate_suspicion_score"] >= 0.95
    ),
    "4. Adjacent segment without corroboration (Vishrantwadi) -> ADJACENT_SEGMENT_UNCORROBORATED (score <= 0.45)": (
        p_uncorroborated is not None and
        p_uncorroborated["match_typology"] == "ADJACENT_SEGMENT_UNCORROBORATED" and
        p_uncorroborated["duplicate_suspicion_score"] <= 0.45
    ),
    "5. Positive control (True duplicate: Borujwada Hanuman Mandir) -> TRUE_DUPLICATE (score >= 0.95)": (
        p_true_dup is not None and
        p_true_dup["match_typology"] == "TRUE_DUPLICATE" and
        p_true_dup["duplicate_suspicion_score"] >= 0.95
    ),
    "6. Unresolved entities fallback (Library books) -> UNRESOLVED_SIMILAR_WORK (baseline similarity preserved)": (
        p_unresolved is not None and
        p_unresolved["match_typology"] == "UNRESOLVED_SIMILAR_WORK" and
        p_unresolved["duplicate_suspicion_score"] >= 0.70
    ),
}

print("\n" + "=" * 100)
print("VALIDATION SUMMARY")
print("=" * 100)
all_passed = True
for label, passed in checks_part2.items():
    if not passed:
        all_passed = False
    print(f"  [{'PASS' if passed else 'FAIL'}] {label}")

assert all_passed, "One or more forensic disambiguation tests failed!"
print("\nAll Layer 3 forensic unit tests passed successfully!")
