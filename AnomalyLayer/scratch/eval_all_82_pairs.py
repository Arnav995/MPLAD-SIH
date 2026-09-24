import re
import pandas as pd

df = pd.read_csv("duplicate_candidates.csv")

def extract_entities(text: str) -> dict:
    t = str(text).strip()
    entities = {
        "villages": set(),
        "gram_panchayats": set(),
        "surveys": set(),
        "wards": set(),
        "beneficiaries": set(),
        "segments": set(),
        "talukas": set(),
        "landmarks": set()
    }
    
    # 1. Beneficiaries: (Shri Premkumar...) or Shri. Pravin...
    b_matches = re.findall(r'\(\s*(?:Shri\.?|Mr\.?|Ms\.?|Mrs\.?)\s*([A-Za-z\s.]+?)(?:,|\s+res|\s+resident|\))', t, re.IGNORECASE)
    if not b_matches:
        b_matches = re.findall(r'(?:Shri\.?|Mr\.?|Ms\.?|Mrs\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', t)
    for b in b_matches:
        clean_b = re.sub(r'\s+', ' ', b).strip('. ')
        if len(clean_b) > 3 and not any(k in clean_b.lower() for k in ["zilla", "panchayat", "gram", "school", "mandir"]):
            entities["beneficiaries"].add(clean_b)
            
    # 2. Gram Panchayats: Gram Panchayat X, G.P. Y
    gp_matches = re.findall(r'(?:Gram\s+Panchayat|G\.?\s*P\.?)\s+([A-Za-z\s()]+?)(?=(?:,|\s+Ta|\s+Dist|\s*$))', t, re.IGNORECASE)
    for gp in gp_matches:
        clean_gp = re.sub(r'\s+', ' ', gp).strip('. ')
        if clean_gp.lower() not in ("building", "bhavan") and len(clean_gp) > 2:
            entities["gram_panchayats"].add(clean_gp.title())

    # 3. Mauja / Mouza / Villages
    v_matches = re.findall(r'\b(?:Mauja|Mouza)\b\s*[-:]?\s*([A-Za-z\s()]+?)(?=(?:,|\s+Ta\b|\s+T\s+|\s+Taluka|\s+Dist|\s+Khasra|\s+Mr\b|\s+Shri\b|\s+house|\s+Construction|\s*$))', t, re.IGNORECASE)
    for v in v_matches:
        clean_v = re.sub(r'\s+', ' ', v).strip('. ')
        if len(clean_v) > 2:
            entities["villages"].add(clean_v.title())
            
    # Standalone village in "Nandgaon T. Varud" or "Nandgaon T. Varad"
    n_match = re.search(r'\bat\s+([A-Za-z]+)\s+T\.?\s*([A-Za-z]+)\b', t, re.IGNORECASE)
    if n_match:
        entities["villages"].add(n_match.group(1).title())
        entities["talukas"].add(n_match.group(2).title())

    # Standalone village in "at Sai Ganesh Park, S.N. 122, Khandwe Nagar, Lohegaon"
    for area in ["Lohegaon", "Khandwe Nagar", "Kalas", "Yerwada", "Kalamna", "Gokul Nagar", "Borujwada", "Nandgaon"]:
        if re.search(r'\b' + re.escape(area) + r'\b', t, re.IGNORECASE):
            entities["villages"].add(area.title())

    # 4. Survey / Plot / Khasra
    s_matches = re.findall(r'\b(?:Survey\s*No\.?|S\.?\s*N\.?|Khasra\s*No\.?|Plot\s*No\.?)\s*([0-9]+(?:\s*(?:and|&|,)\s*[0-9]+)?)\b', t, re.IGNORECASE)
    for s in s_matches:
        entities["surveys"].add(re.sub(r'\s+', ' ', s).strip())

    # 5. Ward / Prabhag
    w_matches = re.findall(r'\b(?:Ward\s*No\.?|Prabhag\s*No\.?)\s*([0-9]+(?:\s*(?:and|&|,|-|to)\s*[0-9]+)?)\b', t, re.IGNORECASE)
    for w in w_matches:
        entities["wards"].add(re.sub(r'\s+', ' ', w).strip())

    # 6. Segments / Lanes
    seg_matches = re.findall(r'\b(?:lane\s*no\.?|galli\s*no\.?)\s*([0-9]+(?:\s*(?:and|&|,|-|to)\s*[0-9]+)?)\b', t, re.IGNORECASE)
    for seg in seg_matches:
        entities["segments"].add(f"Lane {re.sub(r'\\s+', ' ', seg).strip()}")
    b_block = re.findall(r'\(\s*([bB][\s-]*[0-9]+\s*to\s*[bB][\s-]*[0-9]+)\s*\)', t)
    for bb in b_block:
        entities["segments"].add(bb.strip().upper())
    stretch = re.findall(r'between\s+([A-Za-z\s]+?)\s+and\s+([A-Za-z\s]+?)(?:\s+in|\s+at|$)', t, re.IGNORECASE)
    for st in stretch:
        entities["segments"].add(f"Stretch {st[0].strip().title()} to {st[1].strip().title()}")

    # 7. Taluka
    t_matches = re.findall(r'\b(?:Ta\.?|Taluka|Tehsil)\b\s*[:.]?\s*([A-Za-z]+)', t, re.IGNORECASE)
    for tal in t_matches:
        if tal.lower() not in ("dist", "wardha", "pune", "nagpur", "amravati", "collector"):
            entities["talukas"].add(tal.strip().title())

    # 8. Landmarks
    for lm in ["Hanuman Mandir", "Hanuman Temple", "Sai Ganesh Park", "Zilla Parishad School",
               "Vishrantwadi Police Colony", "Yerwada Metro Station", "Gadikhana",
               "Dattawadi", "Shivtej Mitra Mandal", "Shivdarshan-Parvati", "Hamal Talim",
               "Hingne Home Colony", "Shanipar Mandal", "Saroj Nagar Society", "Hajari Pahad"]:
        if re.search(r'\b' + re.escape(lm) + r'\b', t, re.IGNORECASE):
            entities["landmarks"].add(lm)

    return entities

def evaluate_spatial_compatibility(ent_a: dict, ent_b: dict) -> tuple[str, str]:
    """
    Evaluates spatial relationship between extracted entities.
    Returns (compatibility_status, detail_message).
    """
    # 1. Beneficiary comparison
    b_a, b_b = ent_a["beneficiaries"], ent_b["beneficiaries"]
    if b_a and b_b:
        if b_a != b_b:
            return "DISTINCT_BENEFICIARIES", f"Distinct beneficiaries: {', '.join(b_a)} vs {', '.join(b_b)}"
        else:
            return "IDENTICAL_SITE", f"Same beneficiary: {', '.join(b_a)}"

    # 2. Gram Panchayat comparison
    gp_a, gp_b = ent_a["gram_panchayats"], ent_b["gram_panchayats"]
    if gp_a and gp_b:
        if gp_a != gp_b:
            return "DISJOINT_LOCATION", f"Distinct Gram Panchayats: {', '.join(gp_a)} vs {', '.join(gp_b)}"
        else:
            return "IDENTICAL_SITE", f"Same Gram Panchayat: {', '.join(gp_a)}"

    # 3. Village / Mauja comparison
    v_a, v_b = ent_a["villages"], ent_b["villages"]
    if v_a and v_b:
        if not (v_a & v_b):  # disjoint sets
            return "DISJOINT_LOCATION", f"Distinct villages/areas: {', '.join(v_a)} vs {', '.join(v_b)}"

    # 4. Survey / Plot comparison (when village/area is same or overlapping)
    s_a, s_b = ent_a["surveys"], ent_b["surveys"]
    if s_a and s_b:
        if s_a != s_b:
            return "DISJOINT_LOCATION", f"Distinct Survey/Plot numbers: {', '.join(s_a)} vs {', '.join(s_b)}"

    # 5. Ward comparison
    w_a, w_b = ent_a["wards"], ent_b["wards"]
    if w_a and w_b:
        if w_a != w_b:
            return "DISJOINT_LOCATION", f"Distinct Wards: {', '.join(w_a)} vs {', '.join(w_b)}"

    # 6. Segments / Lanes comparison
    seg_a, seg_b = ent_a["segments"], ent_b["segments"]
    if seg_a and seg_b:
        if seg_a != seg_b:
            # If they share the same village, survey, or landmark
            shared_anchors = (v_a & v_b) | (s_a & s_b) | (ent_a["landmarks"] & ent_b["landmarks"])
            if shared_anchors:
                return "ADJACENT_SEGMENT", f"Adjacent segments at {', '.join(shared_anchors)}: {', '.join(seg_a)} vs {', '.join(seg_b)}"
            else:
                return "DISJOINT_LOCATION", f"Different segments across disjoint sites: {', '.join(seg_a)} vs {', '.join(seg_b)}"

    # 7. Landmarks comparison
    lm_a, lm_b = ent_a["landmarks"], ent_b["landmarks"]
    if lm_a and lm_b:
        if lm_a & lm_b:
            return "IDENTICAL_SITE", f"Shared landmark/site: {', '.join(lm_a & lm_b)}"
        else:
            return "DISJOINT_LOCATION", f"Distinct landmarks: {', '.join(lm_a)} vs {', '.join(lm_b)}"

    # Shared village / mauja check if no other discriminators
    if v_a and v_b and (v_a & v_b):
        return "IDENTICAL_SITE", f"Same village/area: {', '.join(v_a & v_b)}"

    # If neither side has enough entities to resolve spatial comparison
    return "UNRESOLVED_ENTITIES", "Spatial disambiguation inconclusive (insufficient named entity anchors)"

results = []
for idx, r in df.iterrows():
    ea = extract_entities(r["description_A"])
    eb = extract_entities(r["description_B"])
    status, detail = evaluate_spatial_compatibility(ea, eb)
    results.append({
        "pair_idx": idx + 1,
        "district": r["district"],
        "status": status,
        "detail": detail,
        "desc_a": r["description_A"][:60],
        "desc_b": r["description_B"][:60],
        "vendor_same": r["same_vendor"],
        "days": r["days_apart"]
    })

res_df = pd.DataFrame(results)
print("Classification Breakdown:")
print(res_df["status"].value_counts())

print("\n--- Samples of each status: ---")
for st in res_df["status"].unique():
    sample = res_df[res_df["status"] == st].iloc[0]
    print(f"\nStatus: {st} ({len(res_df[res_df['status'] == st])} pairs)")
    print(f"  Detail: {sample['detail']}")
    print(f"  A: {sample['desc_a']}")
    print(f"  B: {sample['desc_b']}")
