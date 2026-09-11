"""
MPLADS-Sentinel — Layer 3: Duplicate / Overlap Detection

Catches the same physical work sanctioned twice under different wording,
or near-identical works clustered suspiciously in one place and time.

CRITICAL DESIGN PRINCIPLE — candidate constraint before comparison:
We NEVER compute pairwise similarity across the whole national/state dataset.
Comparisons only happen WITHIN a candidate group: same district (IDA_NAME)
AND a bounded time window. This is both a correctness requirement (comparing
a Nagpur road to a Pune road is meaningless) and a resource-courtesy one
(O(n^2) on the full dataset is wasteful and unnecessary).

CRITICAL EPISTEMIC PRINCIPLE — this layer flags CANDIDATES for review, not
confirmed duplicates. High text similarity between two works can mean:
  (a) the same work was sanctioned/counted twice (a real problem), OR
  (b) two legitimately distinct segments/phases of one larger project
      (e.g. "Road resurfacing Sector 12" and "Road resurfacing Sector 12A"),
      which is normal and NOT a problem.
This layer cannot tell (a) from (b) on text alone — it surfaces the
candidate pair with corroborating context (cost, timing, vendor) and leaves
the actual determination to a human reviewer. Never state a duplicate as
confirmed in any output string.
"""

from __future__ import annotations
import pandas as pd
import numpy as np
try:
    from sentence_transformers import SentenceTransformer, util
    _HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    SentenceTransformer = None
    util = None
    _HAS_SENTENCE_TRANSFORMERS = False

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    _HAS_SKLEARN = True
except ImportError:
    _HAS_SKLEARN = False

_MODEL = None  # lazy-loaded singleton — loading it once, not per call, matters for runtime


def _get_model():
    global _MODEL
    if not _HAS_SENTENCE_TRANSFORMERS:
        return None
    if _MODEL is None:
        try:
            _MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            _MODEL = None
    return _MODEL


def _default_similarity_fn(texts: list) -> np.ndarray:
    """Sentence-BERT embeddings + cosine similarity — the production path with TF-IDF fallback."""
    if _HAS_SENTENCE_TRANSFORMERS:
        try:
            model = _get_model()
            if model is not None and util is not None:
                embeddings = model.encode(texts, convert_to_tensor=True, show_progress_bar=False)
                return util.cos_sim(embeddings, embeddings).numpy()
        except Exception:
            pass
    if _HAS_SKLEARN:
        vec = TfidfVectorizer().fit_transform(texts)
        return cosine_similarity(vec)
    else:
        raise ImportError("Neither sentence-transformers nor scikit-learn is available for text similarity.")


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
) -> pd.DataFrame:
    """
    Returns a dataframe of CANDIDATE duplicate pairs (one row per pair), each with:
      - the two project IDs
      - text_similarity (0-1)
      - days_apart (temporal proximity — closer = more suspicious)
      - same_vendor (bool — corroborating signal, not required)
      - amount_ratio (how similar the sanctioned amounts are — corroborating signal)
      - duplicate_suspicion_score (composite 0-1, for Layer 5 weighting)
      - reason (human-readable, carefully worded as "candidate", never "confirmed")

    Comparisons are scoped to same district + same category (optional) + within
    max_days_apart of each other — never computed across the whole dataset.
    """
    model = _get_model() if similarity_fn is None else None
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")

    group_cols = [district_col] + ([category_col] if same_category_only else [])
    all_pairs = []

    for group_key, group in df.groupby(group_cols):
        group = group.dropna(subset=[desc_col])
        if len(group) < 2:
            continue  # nothing to compare within this district/category

        texts = group[desc_col].astype(str).tolist()
        if similarity_fn is not None:
            sim_matrix = similarity_fn(texts)
        elif model is not None and util is not None:
            embeddings = model.encode(texts, convert_to_tensor=True, show_progress_bar=False)
            sim_matrix = util.cos_sim(embeddings, embeddings).numpy()
        else:
            sim_matrix = _default_similarity_fn(texts)

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
                        continue  # too far apart in time to plausibly be a duplicate-sanctioning event

                amt_i, amt_j = row_i.get(amount_col), row_j.get(amount_col)
                amount_ratio = None
                if pd.notna(amt_i) and pd.notna(amt_j) and max(amt_i, amt_j) > 0:
                    amount_ratio = min(amt_i, amt_j) / max(amt_i, amt_j)

                same_vendor = False
                if vendor_col in group.columns:
                    v_i, v_j = row_i.get(vendor_col), row_j.get(vendor_col)
                    same_vendor = bool(pd.notna(v_i) and pd.notna(v_j) and v_i == v_j)

                score = _composite_suspicion_score(sim, days_apart, amount_ratio, same_vendor, max_days_apart)

                all_pairs.append({
                    f"{id_col}_A": row_i[id_col],
                    f"{id_col}_B": row_j[id_col],
                    "district": row_i[district_col],
                    "category": row_i.get(category_col),
                    "text_similarity": round(sim, 3),
                    "days_apart": days_apart,
                    "amount_ratio": round(amount_ratio, 3) if amount_ratio is not None else None,
                    "same_vendor": same_vendor,
                    "duplicate_suspicion_score": round(score, 3),
                    "description_A": row_i[desc_col],
                    "description_B": row_j[desc_col],
                    "reason": _build_reason(sim, days_apart, amount_ratio, same_vendor),
                })

    return pd.DataFrame(all_pairs).sort_values("duplicate_suspicion_score", ascending=False) if all_pairs else pd.DataFrame()


def _composite_suspicion_score(sim, days_apart, amount_ratio, same_vendor, max_days_apart) -> float:
    """
    Text similarity carries most of the weight since it's the primary signal;
    temporal proximity, amount similarity, and shared vendor are corroborating
    factors that raise (never solely determine) the suspicion level.
    """
    score = sim * 0.6
    if days_apart is not None:
        recency_factor = 1 - (days_apart / max_days_apart)  # closer in time -> higher contribution
        score += 0.2 * max(recency_factor, 0)
    if amount_ratio is not None:
        score += 0.1 * amount_ratio  # near-identical amounts nudge suspicion up
    if same_vendor:
        score += 0.1
    return min(score, 1.0)


def _build_reason(sim, days_apart, amount_ratio, same_vendor) -> str:
    parts = [f"Description text is {sim*100:.0f}% similar to another work in the same district/category"]
    if days_apart is not None:
        parts.append(f"recommended {days_apart} days apart")
    if amount_ratio is not None and amount_ratio > 0.9:
        parts.append("with near-identical sanctioned amounts")
    if same_vendor:
        parts.append("assigned to the same vendor")
    parts.append("— candidate for human review to confirm whether this is a duplicate sanction "
                  "or a legitimately distinct segment/phase of a larger project")
    return "; ".join(parts)
