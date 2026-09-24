import re
import pandas as pd

# Load existing duplicate candidates
df = pd.read_csv("duplicate_candidates.csv")

# Starter boilerplate phrases
STARTER_BOILERPLATE = [
    "construction of cement concrete road and drain from",
    "construction of cement concrete road and drain",
    "construction of cement concrete road from",
    "construction of cement concrete road at",
    "construction of cement road and drain from",
    "construction of cement road from",
    "construction of cc road with i-block and drainage system from",
    "construction of cc flooring road from",
    "cosntruction of cc flooring road from",
    "construction of road with drainage from",
    "cosntruction of road with drainage from",
    "installation of cement concrete benches at various places under gram panchayat",
    "installation of cement concrete benches for citizens to sit in public places in",
    "installation of cement concrete benches for citizens to sit",
    "installation of cement concrete benches at",
    "providing artificial limbs to the disabled person of wardha district",
    "providing artificial limbs to the disabled person in wardha district",
    "providing artificial limbs to the disabled person",
    "in pune lok sabha constituency",
    "pune lok sabha constituency",
    "ta dist wardha",
    "ta. dist. wardha",
    "ta.dist. wardha",
    "dist. wardha",
    "dist wardha",
    "district wardha",
    "ta. ashti",
    "ta ashti",
    "t selu",
    "taluka deoli",
    "amravati district",
    "dist. amravati",
    "at various places under",
    "at various places",
    "erection of a meeting pavilion on municipal corporation land at",
    "erection of a meeting pavilion on the municipal corporation's land at",
    "construction of a library building on municipal corporation land at",
    "construction of a library on municipal corporation land at",
    "construction of a bus stop at",
    "construction of a bus stop near",
    "upgradation of toilets and related works in",
    "laying of drainage lines",
]

def extract_entities(text: str) -> dict:
    t = str(text).strip()
    entities = {
        "villages": [],
        "gram_panchayats": [],
        "surveys": [],
        "wards": [],
        "beneficiaries": [],
        "segments": [],
        "talukas": [],
        "landmarks": []
    }
    
    # 1. Beneficiaries: (Shri Premkumar...) or Shri. Pravin...
    b_matches = re.findall(r'\(\s*(?:Shri\.?|Mr\.?|Ms\.?|Mrs\.?)\s*([A-Za-z\s.]+?)(?:,|\s+res|\s+resident|\))', t, re.IGNORECASE)
    if not b_matches:
        b_matches = re.findall(r'(?:Shri\.?|Mr\.?|Ms\.?|Mrs\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', t)
    for b in b_matches:
        clean_b = re.sub(r'\s+', ' ', b).strip('. ')
        if len(clean_b) > 3:
            entities["beneficiaries"].append(clean_b)
            
    # 2. Gram Panchayats: Gram Panchayat X, G.P. Y
    gp_matches = re.findall(r'(?:Gram\s+Panchayat|G\.?\s*P\.?)\s+([A-Za-z\s()]+?)(?=(?:,|\s+Ta|\s+Dist|\s*$))', t, re.IGNORECASE)
    for gp in gp_matches:
        clean_gp = re.sub(r'\s+', ' ', gp).strip('. ')
        if clean_gp.lower() not in ("building", "bhavan") and len(clean_gp) > 2:
            entities["gram_panchayats"].append(clean_gp)

    # 3. Mauja / Mouza / Villages
    v_matches = re.findall(r'(?:Mauja|Mouza)\s*[-:]?\s*([A-Za-z\s()]+?)(?=(?:,|\s+Ta|\s+T\s+|\s+Taluka|\s+Dist|\s+Khasra|\s+Mr|\s+Shri|\s+house|\s+Construction|\s*$))', t, re.IGNORECASE)
    for v in v_matches:
        clean_v = re.sub(r'\s+', ' ', v).strip('. ')
        if len(clean_v) > 2:
            entities["villages"].append(clean_v)
            
    # Standalone village in Nandgaon T. Varud
    n_match = re.search(r'at\s+([A-Za-z]+)\s+T\.?\s*([A-Za-z]+)', t, re.IGNORECASE)
    if n_match:
        entities["villages"].append(n_match.group(1))
        entities["talukas"].append(n_match.group(2))

    # 4. Survey / Plot / Khasra
    s_matches = re.findall(r'(?:Survey\s*No\.?|S\.?\s*N\.?|Khasra\s*No\.?|Plot\s*No\.?)\s*([0-9]+(?:\s*(?:and|&|,)\s*[0-9]+)?)', t, re.IGNORECASE)
    for s in s_matches:
        entities["surveys"].append(re.sub(r'\s+', ' ', s).strip())

    # 5. Ward / Prabhag
    w_matches = re.findall(r'(?:Ward\s*No\.?|Prabhag\s*No\.?)\s*([0-9]+(?:\s*(?:and|&|,|-|to)\s*[0-9]+)?)', t, re.IGNORECASE)
    for w in w_matches:
        entities["wards"].append(re.sub(r'\s+', ' ', w).strip())

    # 6. Segments / Lanes
    seg_matches = re.findall(r'(?:lane\s*no\.?|galli\s*no\.?)\s*([0-9]+(?:\s*(?:and|&|,|-|to)\s*[0-9]+)?)', t, re.IGNORECASE)
    for seg in seg_matches:
        entities["segments"].append(f"Lane {re.sub(r'\s+', ' ', seg).strip()}")
    b_block = re.findall(r'\(\s*([bB][\s-]*[0-9]+\s*to\s*[bB][\s-]*[0-9]+)\s*\)', t)
    for bb in b_block:
        entities["segments"].append(bb.strip())
    stretch = re.findall(r'between\s+([A-Za-z\s]+?)\s+and\s+([A-Za-z\s]+?)(?:\s+in|\s+at|$)', t, re.IGNORECASE)
    for st in stretch:
        entities["segments"].append(f"Stretch {st[0].strip()} to {st[1].strip()}")

    # 7. Taluka
    t_matches = re.findall(r'(?:Ta\.?|Taluka|Tehsil|T)\s*[:.]?\s*([A-Za-z]+)', t, re.IGNORECASE)
    for tal in t_matches:
        if tal.lower() not in ("dist", "wardha", "pune", "nagpur", "amravati"):
            entities["talukas"].append(tal.strip())

    # 8. Landmarks / Specific Locations
    lm_keywords = [
        "Borujwada", "Hanuman Mandir", "Hanuman Temple", "Sai Ganesh Park", "Lohegaon",
        "Khandwe Nagar", "Zilla Parishad School", "Vishrantwadi Police Colony",
        "Gokul Nagar", "Kalamna", "Yerwada Metro Station", "Gadikhana",
        "Dattawadi", "Shivtej Mitra Mandal", "Shivdarshan-Parvati", "Hamal Talim",
        "Hingne Home Colony", "Shanipar Mandal", "Saroj Nagar", "Hajari Pahad"
    ]
    for lm in lm_keywords:
        if re.search(r'\b' + re.escape(lm) + r'\b', t, re.IGNORECASE):
            entities["landmarks"].append(lm)

    return entities

print("Entities test:")
sample_t = "Asphalting of roads in lane no. 01 and 02 at Sai Ganesh Park, S.N. 122, Khandwe Nagar, Lohegaon."
print(sample_t, "->", extract_entities(sample_t))
sample_t2 = "Construction of cement road and drain from Sri Prahlad Dhonge to Zilla Parishad School at Mauja Wadala Ta Ashti"
print(sample_t2, "->", extract_entities(sample_t2))
sample_t3 = "Providing artificial limbs to the disabled person of Wardha district. (Shri.Premkumar Dilip Naik, Resident Warud, District Wardha)"
print(sample_t3, "->", extract_entities(sample_t3))
