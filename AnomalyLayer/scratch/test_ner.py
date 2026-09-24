import pandas as pd
import re

df = pd.read_csv("projects_master.csv")
print(f"Total projects in master: {len(df)}")
descriptions = df["WORK_DESCRIPTION"].dropna().unique()

print("\nSample 20 descriptions:")
for d in descriptions[:20]:
    print("-", d)
