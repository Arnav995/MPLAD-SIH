import pandas as pd
df = pd.read_csv("duplicate_candidates.csv")
r19 = df.iloc[18] # 0-indexed 18 is 19
print("Pair 19:")
print("District:", r19["district"])
print("Same vendor:", r19["same_vendor"])
print("Days apart:", r19["days_apart"])
print("Amount ratio:", r19["amount_ratio"])
print("Desc A:", r19["description_A"])
print("Desc B:", r19["description_B"])
