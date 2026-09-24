import re
import pandas as pd
import numpy as np

df = pd.read_csv("duplicate_candidates.csv")

DISTRICT_NAMES = {"wardha", "pune", "nagpur", "amravati", "collector"}

def extract_public_works_entities(text: str) -> dict:
    t = str(text).strip()
    entities = {
        "villages": set(),
        "gram_panchayats": set(),
        "surveys": set(),
        "wards": set(),
        "beneficiaries": set(),
        "segments": set(),
        "talukas": set(),
        "landmarks": set(),
        "from_to_stretch": set()
    }
    
    # 1. Beneficiaries
    b_matches = re.findall(r'\(\s*(?:Shri\.?|Mr\.?|Ms\.?|Mrs\.?)\s*([A-Za-z\s.]+?)(?:,|\s+res|\s+resident|\))', t, re.IGNORECASE)
    if not b_matches:
        b_matches = re.findall(r'(?:Shri\.?|Mr\.?|Ms\.?|Mrs\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', t)
    for b in b_matches:
        clean_b = re.sub(r'\s+', ' ', b).strip('. ')
        if len(clean_b) > 3 and not any(k in clean_b.lower() for k in ["zilla", "panchayat", "gram", "school", "mandir"]):
            entities["beneficiaries"].add(clean_b)
            
    # 2. Gram Panchayats
    gp_matches = re.findall(r'(?:Gram\s+Panchayat|G\.?\s*P\.?)\s+([A-Za-z\s()]+?)(?=(?:,|\s+Ta\b|\s+Dist\b|\s*$))', t, re.IGNORECASE)
    for gp in gp_matches:
        clean_gp = re.sub(r'\s+', ' ', gp).strip('. ')
        if clean_gp.lower() not in ("building", "bhavan") and len(clean_gp) > 2:
            entities["gram_panchayats"].add(clean_gp.title())

    # 3. Mauja / Mouza / Villages
    v_matches = re.findall(r'\b(?:Mauja|Mouza)\b\s*[-:]?\s*([A-Za-z\s()]+?)(?=(?:,|\s+Ta\b|\s+T\b|\s+Taluka|\s+Dist|\s+Khasra|\s+Mr\b|\s+Shri\b|\s+house|\s+home|\s+Construction|\s*$))', t, re.IGNORECASE)
    for v in v_matches:
        clean_v = re.sub(r'\s+', ' ', v).strip('. ')
        if len(clean_v) > 2 and clean_v.lower() not in DISTRICT_NAMES:
            entities["villages"].add(clean_v.title())
            
    v_under = re.findall(r'\b(?:under\s+village|village)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b', t, re.IGNORECASE)
    for v in v_under:
        clean_v = v.strip('. ')
        if clean_v.lower() not in ("road", "project", "benches", "road project") and clean_v.lower() not in DISTRICT_NAMES:
            entities["villages"].add(clean_v.title())

    v_before = re.findall(r'\b([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+Village\b', t, re.IGNORECASE)
    for v in v_before:
        clean_v = v.strip('. ')
        if clean_v.lower() not in ("road", "project", "benches", "the") and clean_v.lower() not in DISTRICT_NAMES:
            entities["villages"].add(clean_v.title())

    at_matches = re.findall(r'\bat\s+([A-Za-z\s()]+?)(?=(?:,|\s+Ta\b|\s+T\b|\s+Taluka|\s+Dist|\s+Khasra|\s+Plot|\s+Mr\b|\s+Shri\b|\s+from|\s+between|\s+under|\s*$))', t, re.IGNORECASE)
    for a in at_matches:
        clean_a = re.sub(r'\s+', ' ', a).strip('. ')
        if len(clean_a) > 2 and clean_a.lower() not in ("the", "various", "a", "completed", "various places") and clean_a.lower() not in DISTRICT_NAMES:
            entities["villages"].add(clean_a.title())

    for area in ["Lohegaon", "Khandwe Nagar", "Kalas", "Yerwada", "Kalamna", "Gokul Nagar",
                 "Borujwada", "Nandgaon", "Dattawadi", "Sonegaon Bori", "Salai", "Aadka", "Chikhali", "Alodi", "Wagholi", "Balabhaupeth"]:
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
        entities["segments"].add(f"Lane {re.sub(r'\s+', ' ', seg).strip()}")
    b_block = re.findall(r'\(\s*([bB][\s-]*[0-9]+\s*to\s*[bB][\s-]*[0-9]+)\s*\)', t)
    for bb in b_block:
        entities["segments"].add(bb.strip().upper())
    stretch = re.findall(r'between\s+([A-Za-z\s]+?)\s+and\s+([A-Za-z\s]+?)(?:\s+in|\s+at|$)', t, re.IGNORECASE)
    for st in stretch:
        entities["segments"].add(f"Stretch {st[0].strip().title()} to {st[1].strip().title()}")

    # 7. Start / End residence stretches
    ft_match = re.search(r'from\s+(?:the\s+)?(?:residence\s+of|house\s+of|home\s+of|mr\.?|shri\.?)\s+([A-Za-z\s.]+?)\s+to\s+(?:the\s+)?(?:residence\s+of|house\s+of|home\s+of|mr\.?|shri\.?)\s+([A-Za-z\s.]+?)(?:,|\s+at|\s+in|\s+ta|\s*$|\.)', t, re.IGNORECASE)
    if ft_match:
        entities["from_to_stretch"].add(f"{ft_match.group(1).strip()} to {ft_match.group(2).strip()}")

    # 8. Taluka
    t_matches = re.findall(r'\b(?:Ta\.?|Taluka|Tehsil)\b\s*[:.]?\s*([A-Za-z]+)', t, re.IGNORECASE)
    for tal in t_matches:
        if tal.lower() not in ("dist", "wardha", "pune", "nagpur", "amravati", "collector"):
            entities["talukas"].add(tal.strip().title())

    # 9. Landmarks
    for lm in ["Hanuman Mandir", "Hanuman Temple", "Sai Ganesh Park", "Zilla Parishad School",
               "Vishrantwadi Police Colony", "Yerwada Metro Station", "Gadikhana",
               "Shivtej Mitra Mandal", "Shivdarshan-Parvati", "Hamal Talim",
               "Hingne Home Colony", "Shanipar Mandal", "Saroj Nagar Society", "Hajari Pahad", "Golbazar Chowk", "Kejaji Chowk"]:
        if re.search(r'\b' + re.escape(lm) + r'\b', t, re.IGNORECASE):
            entities["landmarks"].add(lm)

    return entities

def evaluate_spatial_compatibility(ent_a: dict, ent_b: dict) -> tuple[str, str]:
    # 1. Beneficiaries
    b_a, b_b = ent_a["beneficiaries"], ent_b["beneficiaries"]
    if b_a and b_b:
        if b_a != b_b:
            return "DISTINCT_BENEFICIARIES", f"Distinct individual beneficiaries: {', '.join(b_a)} vs {', '.join(b_b)}"
        else:
            return "IDENTICAL_SITE", f"Same individual beneficiary: {', '.join(b_a)}"

    # 2. Gram Panchayats
    gp_a, gp_b = ent_a["gram_panchayats"], ent_b["gram_panchayats"]
    if gp_a and gp_b:
        if gp_a != gp_b:
            return "DISJOINT_LOCATION", f"Distinct Gram Panchayats: {', '.join(gp_a)} vs {', '.join(gp_b)}"
        else:
            return "IDENTICAL_SITE", f"Same Gram Panchayat: {', '.join(gp_a)}"

    # 3. Maujas / Villages: If both have villages and they are disjoint, it is ALWAYS disjoint location!
    v_a, v_b = ent_a["villages"], ent_b["villages"]
    if v_a and v_b:
        shared_v = v_a & v_b
        if not shared_v:
            return "DISJOINT_LOCATION", f"Distinct villages/areas: {', '.join(v_a)} vs {', '.join(v_b)}"
        else:
            # Same village! Check sub-discriminators: Survey, Ward, Segments, Stretches
            s_a, s_b = ent_a["surveys"], ent_b["surveys"]
            if s_a and s_b and s_a != s_b:
                return "DISJOINT_LOCATION", f"Same area ({', '.join(shared_v)}) but distinct Survey/Plot: {', '.join(s_a)} vs {', '.join(s_b)}"
            
            w_a, w_b = ent_a["wards"], ent_b["wards"]
            if w_a and w_b and w_a != w_b:
                return "DISJOINT_LOCATION", f"Same area ({', '.join(shared_v)}) but distinct Wards: {', '.join(w_a)} vs {', '.join(w_b)}"

            seg_a, seg_b = ent_a["segments"], ent_b["segments"]
            if seg_a and seg_b and seg_a != seg_b:
                return "ADJACENT_SEGMENT", f"Adjacent segments at {', '.join(shared_v)}: {', '.join(seg_a)} vs {', '.join(seg_b)}"

            ft_a, ft_b = ent_a["from_to_stretch"], ent_b["from_to_stretch"]
            if ft_a and ft_b and ft_a != ft_b:
                return "ADJACENT_SEGMENT", f"Distinct road stretches within {', '.join(shared_v)}: {', '.join(ft_a)} vs {', '.join(ft_b)}"

            return "IDENTICAL_SITE", f"Same village/area: {', '.join(shared_v)}"

    # 4. Standalone Landmarks (if neither side had conflicting village names)
    lm_a, lm_b = ent_a["landmarks"], ent_b["landmarks"]
    if lm_a and lm_b:
        shared_lm = lm_a & lm_b
        if shared_lm:
            # Check segments at shared landmark
            seg_a, seg_b = ent_a["segments"], ent_b["segments"]
            if seg_a and seg_b and seg_a != seg_b:
                return "ADJACENT_SEGMENT", f"Adjacent segments at {', '.join(shared_lm)}: {', '.join(seg_a)} vs {', '.join(seg_b)}"
            return "IDENTICAL_SITE", f"Shared landmark/site: {', '.join(shared_lm)}"
        else:
            return "DISJOINT_LOCATION", f"Distinct landmarks: {', '.join(lm_a)} vs {', '.join(lm_b)}"

    # 5. Standalone Surveys / Wards / Segments
    s_a, s_b = ent_a["surveys"], ent_b["surveys"]
    if s_a and s_b:
        if s_a != s_b:
            return "DISJOINT_LOCATION", f"Distinct Survey/Plot numbers: {', '.join(s_a)} vs {', '.join(s_b)}"

    w_a, w_b = ent_a["wards"], ent_b["wards"]
    if w_a and w_b:
        if w_a != w_b:
            return "DISJOINT_LOCATION", f"Distinct Wards: {', '.join(w_a)} vs {', '.join(w_b)}"

    seg_a, seg_b = ent_a["segments"], ent_b["segments"]
    if seg_a and seg_b and seg_a != seg_b:
        return "ADJACENT_SEGMENT", f"Adjacent segments: {', '.join(seg_a)} vs {', '.join(seg_b)}"

    return "UNRESOLVED_ENTITIES", "Spatial disambiguation inconclusive (insufficient named entity anchors)"

results = []
for idx, r in df.iterrows():
    ea = extract_public_works_entities(r["description_A"])
    eb = extract_public_works_entities(r["description_B"])
    status, detail = evaluate_spatial_compatibility(ea, eb)
    
    same_vendor = bool(r.get("same_vendor", False))
    days_apart = r.get("days_apart")
    amount_ratio = r.get("amount_ratio")
    
    if status in ("DISTINCT_BENEFICIARIES", "DISJOINT_LOCATION"):
        typology = "INDEPENDENT_PARALLEL_WORKS"
        score = min(float(r["duplicate_suspicion_score"]) * 0.25, 0.25)
        reason = f"Independent parallel works candidate: Standardized administrative template applied across disjoint locations/beneficiaries ({detail}); low duplicate risk."
    elif status == "ADJACENT_SEGMENT":
        if same_vendor and (days_apart is not None and days_apart <= 30) and (amount_ratio is not None and amount_ratio >= 0.8):
            typology = "CONTRACT_TRANCHE_SPLIT"
            score = max(float(r["text_similarity"]), 0.95)
            reason = f"Potential engineered contract split candidate: Shared site ({detail}) with adjacent segment partitioning assigned to the same vendor; recommended for procurement review to verify tender ceiling compliance."
        else:
            typology = "ADJACENT_SEGMENT_UNCORROBORATED"
            score = min(float(r["text_similarity"]) * 0.5, 0.45)
            reason = f"Adjacent segment candidate without procurement corroboration ({detail}); different vendors or timeline indicates independent project phases."
    elif status == "IDENTICAL_SITE":
        typology = "TRUE_DUPLICATE"
        score = min(0.95 + 0.04 * (same_vendor or days_apart == 0), 1.0)
        reason = f"High-confidence candidate for duplicate sanction: Identical physical site and scope ({detail}), pending physical verification."
    else:  # UNRESOLVED_ENTITIES
        typology = "UNRESOLVED_SIMILAR_WORK"
        score = float(r["duplicate_suspicion_score"])
        reason = f"Candidate for overlap review (spatial disambiguation inconclusive — no entity anchors extracted; textual similarity {float(r['text_similarity'])*100:.0f}%), pending manual site disambiguation."
        
    results.append({
        "pair_idx": idx + 1,
        "typology": typology,
        "score": round(score, 3),
        "detail": detail,
        "desc_a": r["description_A"][:60],
        "desc_b": r["description_B"][:60]
    })

proto_df = pd.DataFrame(results)
print("Updated Typology Breakdown:")
print(proto_df["typology"].value_counts())

print("\n--- High Conviction Candidates (TRUE_DUPLICATE / CONTRACT_TRANCHE_SPLIT): ---")
high_conv = proto_df[proto_df["typology"].isin(["TRUE_DUPLICATE", "CONTRACT_TRANCHE_SPLIT"])]
print(f"Total High Conviction Pairs: {len(high_conv)}")
for _, r in high_conv.iterrows():
    print(f"\n[{r['pair_idx']}] Typology: {r['typology']} | Score: {r['score']}")
    print(f"  Detail: {r['detail']}")
    print(f"  A: {r['desc_a']}")
    print(f"  B: {r['desc_b']}")
