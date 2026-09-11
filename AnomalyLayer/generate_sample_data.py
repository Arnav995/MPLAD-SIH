"""
Generates a synthetic projects_master.csv matching the Layer 0 schema,
with deliberately seeded violations so we can verify the rule engine
actually catches what it's supposed to catch, before running it on real data.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

np.random.seed(42)

N = 400  # clean baseline projects
mps = [f"MP_{i}" for i in range(1, 11)]
districts = [f"District_{i}" for i in range(1, 6)]
categories = ["Drinking Water", "Road Construction", "Community Hall", "Street Lighting", "School Infrastructure"]
vendors = [f"Vendor_{i}" for i in range(1, 21)]

rows = []

def make_row(mp, district, category, vendor, rec_amt, days_to_sanction, days_to_complete,
             desc="Standard public infrastructure work", is_sc=False, is_st=False,
             recipient_type="Government Agency", fy="2024-25", completed=True):
    rec_date = datetime(2024, 4, 1) + timedelta(days=np.random.randint(0, 300))
    sanction_date = rec_date + timedelta(days=days_to_sanction) if days_to_sanction is not None else None
    end_date = sanction_date + timedelta(days=days_to_complete) if (sanction_date and completed) else None
    return {
        "WORK_RECOMMENDATION_DTL_ID": None,  # filled in later
        "MP_NAME": mp,
        "IDA_NAME": district,
        "WORK_CATEGORY": category,
        "WORK_DESCRIPTION": desc,
        "VENDOR_NAME": vendor,
        "RECIPIENT_TYPE": recipient_type,
        "RECOMMENDATION_DATE": rec_date,
        "SANCTION_DATE": sanction_date,
        "ACTUAL_END_DATE": end_date,
        "SANCTION_AMOUNT": rec_amt,
        "FUND_DISBURSED_AMT": rec_amt if completed else rec_amt * 0.6,
        "IS_SC_AREA": is_sc,
        "IS_ST_AREA": is_st,
        "IS_TRIBAL_TRUST": False,
        "FY": fy,
        "days_to_sanction": days_to_sanction,
        "days_to_complete": days_to_complete,
        "days_since_recommendation": (datetime(2025, 6, 1) - rec_date).days,
        "is_completed_flag": completed,
    }

# --- 1. Clean baseline projects (normal, category-typical costs, on-time) ---
category_typical_cost = {
    "Drinking Water": 300000, "Road Construction": 1200000, "Community Hall": 800000,
    "Street Lighting": 250000, "School Infrastructure": 900000,
}
for _ in range(N):
    mp = np.random.choice(mps)
    district = np.random.choice(districts)
    category = np.random.choice(categories)
    vendor = np.random.choice(vendors)
    base_cost = category_typical_cost[category]
    cost = max(150000, np.random.normal(base_cost, base_cost * 0.15))
    rows.append(make_row(mp, district, category, vendor, round(cost, 2),
                          days_to_sanction=np.random.randint(10, 60),
                          days_to_complete=np.random.randint(60, 300),
                          is_sc=np.random.rand() < 0.2, is_st=np.random.rand() < 0.1))

# --- 2. R1 violation: sanctioned way past 75 days ---
for _ in range(8):
    rows.append(make_row(np.random.choice(mps), np.random.choice(districts), "Road Construction",
                          np.random.choice(vendors), 1100000, days_to_sanction=140, days_to_complete=200))

# --- 3. R3 violation: completion took way longer than 365 days ---
for _ in range(6):
    rows.append(make_row(np.random.choice(mps), np.random.choice(districts), "Community Hall",
                          np.random.choice(vendors), 800000, days_to_sanction=30, days_to_complete=600))

# --- 4. R4 violation: one MP way over the ₹5 crore annual ceiling ---
for _ in range(6):
    rows.append(make_row("MP_1", "District_1", "Road Construction", np.random.choice(vendors),
                          1_000_000_00 / 6, days_to_sanction=20, days_to_complete=100))  # sums to > 5cr with baseline

# --- 5. R5 violation: suspiciously tiny project cost (possible work-splitting) ---
for _ in range(5):
    rows.append(make_row(np.random.choice(mps), np.random.choice(districts), "Street Lighting",
                          np.random.choice(vendors), 45000, days_to_sanction=20, days_to_complete=60))

# --- 6. R8 violation: one Trust getting way more than the ₹50L lifetime ceiling ---
for _ in range(4):
    rows.append(make_row(np.random.choice(mps), np.random.choice(districts), "Community Hall",
                          "Vendor_TrustXYZ", 1_600_000, days_to_sanction=20, days_to_complete=100,
                          recipient_type="Trust/Society"))

# --- 7. R9 violation: ineligible category keyword ---
for _ in range(3):
    rows.append(make_row(np.random.choice(mps), np.random.choice(districts), "Community Hall",
                          np.random.choice(vendors), 700000, days_to_sanction=20, days_to_complete=100,
                          desc="Temple construction and renovation work"))

# --- 8. D1 violation: cost way beyond category IQR ---
for _ in range(5):
    rows.append(make_row(np.random.choice(mps), np.random.choice(districts), "Drinking Water",
                          np.random.choice(vendors), 4_500_000, days_to_sanction=20, days_to_complete=100))

# --- 9. Benford-manipulation group: District_5 gets suspiciously round/repeated-digit amounts ---
for _ in range(35):
    rows.append(make_row(np.random.choice(mps), "District_5", "Road Construction",
                          np.random.choice(vendors), np.random.choice([700000, 770000, 777000, 700700]),
                          days_to_sanction=25, days_to_complete=100))

df = pd.DataFrame(rows)
df["WORK_RECOMMENDATION_DTL_ID"] = range(100000, 100000 + len(df))

df.to_csv("sample_projects_master.csv", index=False)
print(f"Generated {len(df)} synthetic project rows -> sample_projects_master.csv")
print(df["WORK_CATEGORY"].value_counts())
