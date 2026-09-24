"""
MPLADS-Sentinel — Layer 3: Forensic Semantic Disambiguation & Anti-False-Positive Engine

Catches the same physical work sanctioned twice under different wording,
or near-identical works clustered suspiciously in one place and time,
while forensically distinguishing:
  1. TRUE_DUPLICATE: Same physical asset at the exact same location/survey number,
     potentially double-billed.
  2. CONTRACT_TRANCHE_SPLIT: Adjacent segments/lanes at the same layout/site partitioned
     to bypass statutory tender ceilings.
  3. ADJACENT_SEGMENT_UNCORROBORATED: Legitimate phased execution across adjacent
     segments without procurement corroboration.
  4. INDEPENDENT_PARALLEL_WORKS: Standardized administrative template applied across
     confirmed distinct villages, gram panchayats, or individual beneficiaries.
  5. UNRESOLVED_SIMILAR_WORK: Free-text descriptions lacking extractable entity anchors;
     falls back to conservative text-similarity scoring with explicit audit flags.

CRITICAL DESIGN PRINCIPLE — candidate constraint before comparison:
We NEVER compute pairwise similarity across the whole national/state dataset.
Comparisons only happen WITHIN a candidate group: same district (IDA_NAME)
AND a bounded time window. This is both a correctness requirement (comparing
a Nagpur road to a Pune road is meaningless) and a resource-courtesy one
(O(n^2) on the full dataset is wasteful and unnecessary).

CRITICAL EPISTEMIC PRINCIPLE — this layer flags CANDIDATES for review, not
confirmed duplicates. Outputs are designed for human audit triage. Reason strings
must always remain hedged and grounded in observable entity anchors.

KNOWN ADVERSARIAL LIMITATION:
Entity-based disambiguation relies on named physical anchors. Deliberately altered
or varied landmark descriptions (e.g., using alternate colloquial names for the same
temple, school, or chowk) could fool entity extraction into classifying true duplicate
works as DISJOINT_LOCATION, evading detection.
"""

from __future__ import annotations
import os
import re
import yaml
import pandas as pd
import numpy as np

# ---- Starter Heuristic Configuration ----
# Starter heuristic list scoped to public works descriptions in Nagpur, Pune, and Wardha.
# Auditors can extend this list in rules_config.yaml for newly ingested constituencies.
DEFAULT_STARTER_BOILERPLATE = [
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
    "construction of road at",
    "construction of cement road at",
    "construction of concrete road with drain under",
    "construction of cement road with drain under",
    "installation of cement concrete benches at various places under gram panchayat",
    "installation of cement concrete benches for citizens to sit in public places in",
    "installation of cement concrete benches for citizens to sit",
    "installation of cement concrete benches at various places under",
    "installation of cement concrete benches",
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
    "ta. deoli",
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

DISTRICT_NAMES_FILTER = {"wardha", "pune", "nagpur", "amravati", "collector", "district"}

_MODEL = None
_HAS_SENTENCE_TRANSFORMERS = None


def _get_model():
    """Lazy-loaded SentenceTransformer singleton with offline environment enforcement."""
    global _MODEL, _HAS_SENTENCE_TRANSFORMERS
    if _MODEL is not None:
        return _MODEL
    if _HAS_SENTENCE_TRANSFORMERS is False:
        return None

    try:
        os.environ.setdefault("HF_HUB_OFFLINE", "1")
        os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
        from sentence_transformers import SentenceTransformer
        _HAS_SENTENCE_TRANSFORMERS = True
        _MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        return _MODEL
    except Exception:
        _HAS_SENTENCE_TRANSFORMERS = False
        return None


def _default_similarity_fn(texts: list) -> np.ndarray:
    """Sentence-BERT embeddings + cosine similarity with TF-IDF fallback."""
    model = _get_model()
    if model is not None:
        try:
            from sentence_transformers import util
            embeddings = model.encode(texts, convert_to_tensor=True, show_progress_bar=False)
            return util.cos_sim(embeddings, embeddings).cpu().numpy()
        except Exception:
            pass

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        vec = TfidfVectorizer().fit_transform(texts)
        return cosine_similarity(vec)
    except ImportError:
        raise ImportError("Neither sentence-transformers nor scikit-learn is available for text similarity.")


def load_disambiguation_config(config_path: str = "rules_config.yaml") -> list[str]:
    """Loads external boilerplate phrases from rules_config.yaml if available."""
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                cfg = yaml.safe_load(f)
                if cfg and "layer3_disambiguation" in cfg:
                    phrases = cfg["layer3_disambiguation"].get("boilerplate_phrases")
                    if phrases and isinstance(phrases, list):
                        return phrases
        except Exception:
            pass
    return DEFAULT_STARTER_BOILERPLATE


def prune_boilerplate(text: str, boilerplate_phrases: list[str] = None) -> str:
    """
    Strips high-frequency standardized administrative formulas before residual embedding.
    Preserves residual specific content (village, plot numbers, beneficiaries).
    """
    if not text or not isinstance(text, str):
        return ""
    phrases = boilerplate_phrases or DEFAULT_STARTER_BOILERPLATE
    cleaned = text.lower()
    for phrase in sorted(phrases, key=len, reverse=True):
        cleaned = cleaned.replace(phrase.lower(), " ")
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned if len(cleaned) >= 5 else text.strip()


def extract_public_works_entities(text: str) -> dict:
    """
    Extracts named physical anchors from public works descriptions:
      - villages/maujas
      - gram panchayats
      - survey/khasra/plot numbers
      - wards/prabhags
      - beneficiaries
      - segments/lanes
      - from-to road stretches
      - landmarks
      - talukas
    """
    t = str(text).strip()
    entities = {
        "villages": set(),
        "gram_panchayats": set(),
        "surveys": set(),
        "wards": set(),
        "beneficiaries": set(),
        "segments": set(),
        "from_to_stretch": set(),
        "talukas": set(),
        "landmarks": set(),
    }
    if not t:
        return entities

    # 1. Beneficiaries: (Shri Premkumar...) or Mr. Kartik...
    b_matches = re.findall(r'\(\s*(?:Shri\.?|Mr\.?|Ms\.?|Mrs\.?)\s*([A-Za-z\s.]+?)(?:,|\s+res|\s+resident|\))', t, re.IGNORECASE)
    if not b_matches:
        b_matches = re.findall(r'(?:Shri\.?|Mr\.?|Ms\.?|Mrs\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', t)
    for b in b_matches:
        clean_b = re.sub(r'\s+', ' ', b).strip('. ')
        if len(clean_b) > 3 and not any(k in clean_b.lower() for k in ["zilla", "panchayat", "gram", "school", "mandir"]):
            entities["beneficiaries"].add(clean_b)

    # 2. Gram Panchayats: Gram Panchayat X, G.P. Y
    gp_matches = re.findall(r'(?:Gram\s+Panchayat|G\.?\s*P\.?)\s+([A-Za-z\s()]+?)(?=(?:,|\s+Ta\b|\s+Dist\b|\s*$))', t, re.IGNORECASE)
    for gp in gp_matches:
        clean_gp = re.sub(r'\s+', ' ', gp).strip('. ')
        if clean_gp.lower() not in ("building", "bhavan") and len(clean_gp) > 2:
            entities["gram_panchayats"].add(clean_gp.title())

    # 3. Mauja / Mouza / Villages
    v_matches = re.findall(r'\b(?:Mauja|Mouza)\b\s*[-:]?\s*([A-Za-z\s()]+?)(?=(?:,|\s+Ta\b|\s+T\b|\s+Taluka|\s+Dist|\s+Khasra|\s+Plot|\s+Mr\b|\s+Shri\b|\s+house|\s+home|\s+Construction|\s*$))', t, re.IGNORECASE)
    for v in v_matches:
        clean_v = re.sub(r'\s+', ' ', v).strip('. ')
        if len(clean_v) > 2 and clean_v.lower() not in DISTRICT_NAMES_FILTER:
            entities["villages"].add(clean_v.title())

    v_under = re.findall(r'\b(?:under\s+village|village)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b', t, re.IGNORECASE)
    for v in v_under:
        clean_v = v.strip('. ')
        if clean_v.lower() not in ("road", "project", "benches", "road project") and clean_v.lower() not in DISTRICT_NAMES_FILTER:
            entities["villages"].add(clean_v.title())

    v_before = re.findall(r'\b([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+Village\b', t, re.IGNORECASE)
    for v in v_before:
        clean_v = v.strip('. ')
        if clean_v.lower() not in ("road", "project", "benches", "the") and clean_v.lower() not in DISTRICT_NAMES_FILTER:
            entities["villages"].add(clean_v.title())

    # Standalone locations after "at"
    at_matches = re.findall(r'\bat\s+([A-Za-z\s()]+?)(?=(?:,|\s+Ta\b|\s+T\b|\s+Taluka|\s+Dist|\s+Khasra|\s+Plot|\s+Mr\b|\s+Shri\b|\s+from|\s+between|\s+under|\s*$))', t, re.IGNORECASE)
    for a in at_matches:
        clean_a = re.sub(r'\s+', ' ', a).strip('. ')
        if len(clean_a) > 2 and clean_a.lower() not in ("the", "various", "a", "completed", "various places") and clean_a.lower() not in DISTRICT_NAMES_FILTER:
            entities["villages"].add(clean_a.title())

    # Curated standalone layouts and village anchors
    for area in ["Lohegaon", "Khandwe Nagar", "Kalas", "Yerwada", "Kalamna", "Gokul Nagar",
                 "Borujwada", "Nandgaon", "Dattawadi", "Sonegaon Bori", "Salai", "Aadka",
                 "Chikhali", "Alodi", "Wagholi", "Balabhaupeth", "Shirpur"]:
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
        clean_seg = re.sub(r"\s+", " ", seg).strip()
        entities["segments"].add(f"Lane {clean_seg}")
    #for seg in seg_matches:
    #    entities["segments"].add(f"Lane {re.sub(r'\s+', ' ', seg).strip()}")
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
               "Hingne Home Colony", "Shanipar Mandal", "Saroj Nagar Society",
               "Hajari Pahad", "Golbazar Chowk", "Kejaji Chowk"]:
        if re.search(r'\b' + re.escape(lm) + r'\b', t, re.IGNORECASE):
            entities["landmarks"].add(lm)

    return entities


def evaluate_spatial_compatibility(ent_a: dict, ent_b: dict) -> tuple[str, str]:
    """
    Evaluates spatial and beneficiary compatibility between extracted entities:
      - DISTINCT_BENEFICIARIES: Different human recipients identified.
      - DISJOINT_LOCATION: Mutually exclusive villages, gram panchayats, wards, or survey plots.
      - ADJACENT_SEGMENT: Same parent layout/village, but distinct lanes, block ranges, or stretches.
      - IDENTICAL_SITE: Same physical anchor identified.
      - UNRESOLVED_ENTITIES: Free-text descriptions lack extractable anchors (inconclusive).
    """
    # 1. Beneficiary comparison
    b_a, b_b = ent_a["beneficiaries"], ent_b["beneficiaries"]
    if b_a and b_b:
        if b_a != b_b:
            return "DISTINCT_BENEFICIARIES", f"Distinct individual beneficiaries: {', '.join(b_a)} vs {', '.join(b_b)}"
        else:
            return "IDENTICAL_SITE", f"Same individual beneficiary: {', '.join(b_a)}"

    # 2. Gram Panchayat comparison
    gp_a, gp_b = ent_a["gram_panchayats"], ent_b["gram_panchayats"]
    if gp_a and gp_b:
        if gp_a != gp_b:
            return "DISJOINT_LOCATION", f"Distinct Gram Panchayats: {', '.join(gp_a)} vs {', '.join(gp_b)}"
        else:
            return "IDENTICAL_SITE", f"Same Gram Panchayat: {', '.join(gp_a)}"

    # 3. Maujas / Villages comparison
    # CRITICAL: If both works specify village names and they are disjoint, it is ALWAYS disjoint location.
    # Shared institutions (e.g. 'Zilla Parishad School') exist in almost every village and cannot override village disjunction.
    v_a, v_b = ent_a["villages"], ent_b["villages"]
    if v_a and v_b:
        shared_v = v_a & v_b
        if not shared_v:
            return "DISJOINT_LOCATION", f"Distinct villages/areas: {', '.join(v_a)} vs {', '.join(v_b)}"
        else:
            # Same village: check sub-discriminators (survey, ward, lanes, stretches)
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

    # 4. Standalone Landmarks (when neither side had conflicting village names)
    lm_a, lm_b = ent_a["landmarks"], ent_b["landmarks"]
    if lm_a and lm_b:
        shared_lm = lm_a & lm_b
        if shared_lm:
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


def find_duplicate_candidates(
    df: pd.DataFrame,
    district_col: str = "IDA_NAME",
    desc_col: str = "WORK_DESCRIPTION",
    date_col: str = "RECOMMENDATION_DATE",
    category_col: str = "WORK_CATEGORY",
    amount_col: str = "SANCTION_AMOUNT",
    vendor_col: str = "VENDOR_NAME",
    id_col: str = "WORK_RECOMMENDATION_DTL_ID",
    similarity_threshold: float = 0.85,
    max_days_apart: int = 180,
    same_category_only: bool = True,
    similarity_fn=None,
    config_path: str = "rules_config.yaml",
    include_independent: bool = True,
) -> pd.DataFrame:
    """
    Forensic Semantic Disambiguation Engine:
      - Extracts public works physical anchors (villages, gram panchayats, surveys, beneficiaries).
      - Computes semantic similarity on descriptions.
      - Evaluates spatial compatibility between candidate pairs.
      - Assigns forensic typology:
          * TRUE_DUPLICATE
          * CONTRACT_TRANCHE_SPLIT
          * ADJACENT_SEGMENT_UNCORROBORATED
          * INDEPENDENT_PARALLEL_WORKS
          * UNRESOLVED_SIMILAR_WORK
      - Produces explainable, hedged reasons for audit triage.
    """
    boilerplate_phrases = load_disambiguation_config(config_path)
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")

    group_cols = [district_col] + ([category_col] if same_category_only else [])
    all_pairs = []

    for group_key, group in df.groupby(group_cols):
        group = group.dropna(subset=[desc_col])
        if len(group) < 2:
            continue

        raw_texts = group[desc_col].astype(str).tolist()

        if similarity_fn is not None:
            sim_matrix = similarity_fn(raw_texts)
        else:
            sim_matrix = _default_similarity_fn(raw_texts)

        idx_list = group.index.tolist()
        n = len(idx_list)
        for i in range(n):
            for j in range(i + 1, n):
                sim = float(sim_matrix[i][j])
                if sim < similarity_threshold:
                    continue

                row_i, row_j = group.loc[idx_list[i]], group.loc[idx_list[j]]

                date_i, date_j = row_i[date_col], row_j[date_col]
                if pd.isna(date_i) or pd.isna(date_j):
                    days_apart = None
                else:
                    days_apart = abs((date_i - date_j).days)
                    if days_apart > max_days_apart:
                        continue

                amt_i, amt_j = row_i.get(amount_col), row_j.get(amount_col)
                amount_ratio = None
                total_amount = None
                if pd.notna(amt_i) and pd.notna(amt_j):
                    amt_max = max(amt_i, amt_j)
                    if amt_max > 0:
                        amount_ratio = min(amt_i, amt_j) / amt_max
                    total_amount = amt_i + amt_j

                same_vendor = False
                if vendor_col in group.columns:
                    v_i, v_j = row_i.get(vendor_col), row_j.get(vendor_col)
                    same_vendor = bool(pd.notna(v_i) and pd.notna(v_j) and v_i == v_j)

                desc_a = str(row_i[desc_col])
                desc_b = str(row_j[desc_col])

                # Entity Extraction & Spatial Compatibility Evaluation
                ent_a = extract_public_works_entities(desc_a)
                ent_b = extract_public_works_entities(desc_b)
                spatial_status, spatial_detail = evaluate_spatial_compatibility(ent_a, ent_b)

                # Forensic Typology & Scoring Assignment
                if spatial_status in ("DISTINCT_BENEFICIARIES", "DISJOINT_LOCATION"):
                    match_typology = "INDEPENDENT_PARALLEL_WORKS"
                    raw_score = _composite_suspicion_score(sim, days_apart, amount_ratio, same_vendor, max_days_apart)
                    score = min(raw_score * 0.25, 0.25)
                    reason = (
                        f"Independent parallel works candidate: Standardized administrative template applied across "
                        f"disjoint locations/beneficiaries ({spatial_detail}); low duplicate risk."
                    )
                elif spatial_status == "ADJACENT_SEGMENT":
                    # Corroboration: same vendor + short recommendation window (<= 30d) + similar amounts (ratio >= 0.8)
                    has_corroboration = same_vendor and (days_apart is not None and days_apart <= 30) and (amount_ratio is not None and amount_ratio >= 0.8)
                    if has_corroboration:
                        match_typology = "CONTRACT_TRANCHE_SPLIT"
                        score = max(sim, 0.95)
                        tot_str = f" totaling Rs. {total_amount/100000:.2f}L" if total_amount else ""
                        reason = (
                            f"Potential engineered contract split candidate: Shared site ({spatial_detail}) with adjacent "
                            f"segment partitioning{tot_str} assigned to the same vendor; recommended for procurement review to verify tender ceiling compliance."
                        )
                    else:
                        match_typology = "ADJACENT_SEGMENT_UNCORROBORATED"
                        score = min(sim * 0.5, 0.45)
                        reason = (
                            f"Adjacent segment candidate without procurement corroboration ({spatial_detail}); "
                            f"different vendors or timeline indicates independent project phases."
                        )
                elif spatial_status == "IDENTICAL_SITE":
                    match_typology = "TRUE_DUPLICATE"
                    score = min(0.95 + 0.04 * (same_vendor or (days_apart is not None and days_apart == 0)), 1.0)
                    reason = (
                        f"High-confidence candidate for duplicate sanction: Identical physical site and scope ({spatial_detail}), "
                        f"pending physical confirmation."
                    )
                else:  # UNRESOLVED_ENTITIES
                    match_typology = "UNRESOLVED_SIMILAR_WORK"
                    score = _composite_suspicion_score(sim, days_apart, amount_ratio, same_vendor, max_days_apart)
                    reason = (
                        f"Candidate for overlap review (spatial disambiguation inconclusive -- no entity anchors extracted; "
                        f"textual similarity {sim*100:.0f}%), pending manual site disambiguation."
                    )

                if not include_independent and match_typology == "INDEPENDENT_PARALLEL_WORKS":
                    continue

                all_pairs.append({
                    f"{id_col}_A": row_i[id_col],
                    f"{id_col}_B": row_j[id_col],
                    "district": row_i[district_col],
                    "category": row_i.get(category_col),
                    "text_similarity": round(sim, 3),
                    "days_apart": days_apart,
                    "amount_ratio": round(amount_ratio, 3) if amount_ratio is not None else None,
                    "same_vendor": same_vendor,
                    "spatial_compatibility": spatial_status,
                    "match_typology": match_typology,
                    "duplicate_suspicion_score": round(score, 3),
                    "description_A": desc_a,
                    "description_B": desc_b,
                    "reason": reason,
                })

    if not all_pairs:
        return pd.DataFrame()

    res_df = pd.DataFrame(all_pairs)
    return res_df.sort_values("duplicate_suspicion_score", ascending=False).reset_index(drop=True)


def _composite_suspicion_score(sim, days_apart, amount_ratio, same_vendor, max_days_apart) -> float:
    """Baseline composite scoring used when spatial disambiguation is inconclusive."""
    score = sim * 0.6
    if days_apart is not None:
        recency_factor = 1 - (days_apart / max_days_apart)
        score += 0.2 * max(recency_factor, 0)
    if amount_ratio is not None:
        score += 0.1 * amount_ratio
    if same_vendor:
        score += 0.1
    return min(score, 1.0)
