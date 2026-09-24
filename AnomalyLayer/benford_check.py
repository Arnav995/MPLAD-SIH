"""
MPLADS-Sentinel — Layer 1 add-on: Benford's Law conformity check.
"""

import sys
import json
import numpy as np
import pandas as pd
from scipy.stats import chisquare

# Benford's expected first-digit distribution (digits 1–9)
BENFORD_EXPECTED = np.array([np.log10(1 + 1 / d) for d in range(1, 10)])


def first_digit(n) -> int | None:
    n = abs(float(n))
    if n == 0 or pd.isna(n):
        return None
    while n < 1:
        n *= 10
    while n >= 10:
        n /= 10
    return int(n)


def benford_conformity(amounts: pd.Series, min_sample_size: int = 30):
    digits = amounts.dropna().apply(first_digit).dropna()
    digits = digits[digits > 0]

    n = len(digits)
    if n < min_sample_size:
        return None

    observed_counts = (
        digits.value_counts()
        .reindex(range(1, 10), fill_value=0)
        .sort_index()
        .values
    )

    observed_freq = observed_counts / n
    expected_counts = BENFORD_EXPECTED * n

    chi2_std, p_value_std = chisquare(
        f_obs=observed_counts,
        f_exp=expected_counts,
    )

    cells_under_5 = (expected_counts < 5).sum()
    cochran_valid = bool(
        (cells_under_5 / 9.0 <= 0.2)
        and (expected_counts >= 1).all()
    )

    cutoff_bin = 5
    while cutoff_bin > 1 and expected_counts[cutoff_bin:].sum() < 5:
        cutoff_bin -= 1

    obs_pooled = np.append(
        observed_counts[:cutoff_bin],
        observed_counts[cutoff_bin:].sum(),
    )
    exp_pooled = np.append(
        expected_counts[:cutoff_bin],
        expected_counts[cutoff_bin:].sum(),
    )

    _, p_value_pooled = chisquare(
        f_obs=obs_pooled,
        f_exp=exp_pooled,
    )

    effective_p = p_value_std if cochran_valid else p_value_pooled

    mad = float(np.mean(np.abs(observed_freq - BENFORD_EXPECTED)))

    if mad <= 0.006:
        conformity = "Close conformity"
    elif mad <= 0.012:
        conformity = "Acceptable conformity"
    elif mad <= 0.015:
        conformity = "Marginally acceptable"
    else:
        conformity = "Non-conforming"

    return {
        "chi_square": float(chi2_std),
        "p_value": float(p_value_std),
        "p_value_pooled": float(p_value_pooled),
        "effective_p": float(effective_p),
        "cochran_valid": cochran_valid,
        "mad": mad,
        "conformity": conformity,
        "is_flagged": effective_p < 0.05 and mad > 0.015,
        "observed_freq": dict(zip(range(1, 10), observed_freq)),
        "expected_freq": dict(zip(range(1, 10), BENFORD_EXPECTED)),
        "sample_size": n,
    }


def run_benford_by_group(
    df: pd.DataFrame,
    amount_field: str,
    group_field: str,
) -> pd.DataFrame:
    results = []

    for group_val, group_df in df.groupby(group_field):
        result = benford_conformity(group_df[amount_field])

        if result is None:
            continue

        results.append({
            group_field: group_val,
            "sample_size": result["sample_size"],
            "mad": round(result["mad"], 5),
            "conformity": result["conformity"],
            "p_value": result["p_value"],
            "p_value_pooled": result["p_value_pooled"],
            "cochran_valid": result["cochran_valid"],
            "is_flagged": result["is_flagged"],
        })

    if not results:
        return pd.DataFrame(
            columns=[
                group_field,
                "sample_size",
                "mad",
                "conformity",
                "p_value",
                "p_value_pooled",
                "cochran_valid",
                "is_flagged",
            ]
        )

    return pd.DataFrame(results).sort_values("p_value")


# ---------- Backend entry point ----------

def main():
    raw = sys.stdin.read()

    if not raw.strip():
        print(json.dumps({
            "totalTransactions": 0,
            "chiSquareValue": 0,
            "chiSquareThreshold": 15.51,
            "pVal": "1.000",
            "firstDigitDistribution": [],
            "flaggedTransactions": [],
        }))
        return

    records = json.loads(raw)
    df = pd.DataFrame(records)

    if df.empty:
        print(json.dumps({
            "totalTransactions": 0,
            "chiSquareValue": 0,
            "chiSquareThreshold": 15.51,
            "pVal": "1.000",
            "firstDigitDistribution": [],
            "flaggedTransactions": [],
        }))
        return

    result = benford_conformity(df["amount"], min_sample_size=1)

    observed = result["observed_freq"]
    expected = result["expected_freq"]

    distribution = []

    for digit in range(1, 10):
        actual = round(observed[digit] * 100, 1)
        expected_pct = round(expected[digit] * 100, 1)

        distribution.append({
            "digit": digit,
            "expected": expected_pct,
            "actual": actual,
            "status": "SPIKE"
            if abs(actual - expected_pct) >= 5
            else "NORMAL",
        })

    df["leadDigit"] = df["amount"].apply(first_digit)
    df["deviation"] = df["leadDigit"].apply(
        lambda d: abs(observed[d] * 100 - expected[d] * 100)
    )

    flagged = (
        df.sort_values("deviation", ascending=False)
        .head(25)
        .to_dict("records")
    )

    flagged_rows = []

    for row in flagged:
        flagged_rows.append({
            "id": row["projectRef"],
            "district": row["district"],
            "contractor": row["contractor"],
            "amount": f"₹{int(row['amount']):,}",
            "leadDigit": int(row["leadDigit"]),
            "anomalyScore": round(
                min(10, row["deviation"] / 1.5),
                1,
            ),
            "reason": (
                f"Lead digit {row['leadDigit']} deviates "
                "from Benford expectation"
            ),
            "projectRef": row["projectRef"],
        })

    output = {
        "totalTransactions": len(df),
        "chiSquareValue": round(result["chi_square"], 2),
        "chiSquareThreshold": 15.51,
        "pVal": (
            "<0.001"
            if result["effective_p"] < 0.001
            else f"{result['effective_p']:.3f}"
        ),
        "firstDigitDistribution": distribution,
        "flaggedTransactions": flagged_rows,
    }

    print(json.dumps(output))


if __name__ == "__main__":
    main()
# """
# MPLADS-Sentinel — Layer 1 add-on: Benford's Law conformity check.

# Grounded in peer-reviewed precedent (Benford's Law applied to Indonesian
# government ministry expenditure, and to Brazil's Bolsa Familia welfare
# payments). Zero training required — a chi-square goodness-of-fit test
# against Benford's expected first-digit distribution.

# Flags a GROUP (e.g. an Implementing Agency or District), not an individual
# project — a Benford deviation is a population-level signal that a set of
# amounts may have been manipulated/rounded/fabricated, not a diagnosis of
# any single transaction.
# """

# import numpy as np
# import pandas as pd
# from scipy.stats import chisquare

# # Benford's expected first-digit distribution (digits 1-9)
# BENFORD_EXPECTED = np.array([np.log10(1 + 1 / d) for d in range(1, 10)])


# def first_digit(n) -> int | None:
#     n = abs(n)
#     if n == 0 or pd.isna(n):
#         return None
#     while n < 1:
#         n *= 10
#     while n >= 10:
#         n /= 10
#     return int(n)


# def benford_conformity(amounts: pd.Series, min_sample_size: int = 30):
#     """
#     Evaluates first-digit conformity against Benford's Law using both
#     Chi-Square (with Cochran rule verification and bin pooling for small counts)
#     and Nigrini's Mean Absolute Deviation (MAD).

#     Returns a dict with test results, or None if sample size < min_sample_size.
#     """
#     digits = amounts.dropna().apply(first_digit).dropna()
#     digits = digits[digits > 0]
#     n = len(digits)
#     if n < min_sample_size:
#         return None

#     observed_counts = digits.value_counts().reindex(range(1, 10), fill_value=0).sort_index().values
#     observed_freq = observed_counts / n
#     expected_counts = BENFORD_EXPECTED * n

#     # 1. Standard 9-digit Chi-Square
#     chi2_std, p_value_std = chisquare(f_obs=observed_counts, f_exp=expected_counts)

#     # 2. Cochran condition: no expected cell < 1, and no more than 20% < 5
#     cells_under_5 = (expected_counts < 5).sum()
#     cochran_valid = bool((cells_under_5 / 9.0 <= 0.2) and (expected_counts >= 1).all())

#     # 3. Pooled Chi-Square for rare high-digits (bins 6-9 pooled if any expected count < 5)
#     # This guarantees sufficient cell counts for small-to-medium samples (e.g. N = 40 to 110)
#     cutoff_bin = 5
#     while cutoff_bin > 1 and expected_counts[cutoff_bin:].sum() < 5:
#         cutoff_bin -= 1
#     obs_pooled = np.append(observed_counts[:cutoff_bin], observed_counts[cutoff_bin:].sum())
#     exp_pooled = np.append(expected_counts[:cutoff_bin], expected_counts[cutoff_bin:].sum())
#     _, p_value_pooled = chisquare(f_obs=obs_pooled, f_exp=exp_pooled)

#     # Use pooled p-value if standard Cochran rule fails
#     effective_p = p_value_std if cochran_valid else p_value_pooled

#     # 4. Nigrini Mean Absolute Deviation (MAD) — scale-invariant forensic benchmark
#     mad = float(np.mean(np.abs(observed_freq - BENFORD_EXPECTED)))
#     if mad <= 0.006:
#         conformity = "Close conformity"
#     elif mad <= 0.012:
#         conformity = "Acceptable conformity"
#     elif mad <= 0.015:
#         conformity = "Marginally acceptable"
#     else:
#         conformity = "Non-conforming"

#     return {
#         "p_value": p_value_std,
#         "p_value_pooled": p_value_pooled,
#         "effective_p": effective_p,
#         "cochran_valid": cochran_valid,
#         "mad": mad,
#         "conformity": conformity,
#         "is_flagged": effective_p < 0.05 and mad > 0.015,
#         "observed_freq": dict(zip(range(1, 10), observed_freq)),
#         "expected_freq": dict(zip(range(1, 10), BENFORD_EXPECTED)),
#         "sample_size": n,
#     }


# def run_benford_by_group(df: pd.DataFrame, amount_field: str, group_field: str) -> pd.DataFrame:
#     """
#     Runs the Benford check per group (e.g. per IDA_NAME / Implementing Agency).
#     Returns a summary dataframe with standard chi2, pooled chi2, MAD, and conformity status.
#     """
#     results = []
#     for group_val, group_df in df.groupby(group_field):
#         result = benford_conformity(group_df[amount_field])
#         if result is None:
#             continue
#         results.append({
#             group_field: group_val,
#             "sample_size": result["sample_size"],
#             "mad": round(result["mad"], 5),
#             "conformity": result["conformity"],
#             "p_value": result["p_value"],
#             "p_value_pooled": result["p_value_pooled"],
#             "cochran_valid": result["cochran_valid"],
#             "is_flagged": result["is_flagged"],
#         })
#     if not results:
#         return pd.DataFrame(columns=[group_field, "sample_size", "mad", "conformity", "p_value", "p_value_pooled", "cochran_valid", "is_flagged"])
#     return pd.DataFrame(results).sort_values("p_value")
