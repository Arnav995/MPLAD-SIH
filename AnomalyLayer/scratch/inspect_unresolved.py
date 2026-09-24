import re
import pandas as pd
from eval_all_82_pairs import extract_entities, evaluate_spatial_compatibility

df = pd.read_csv("duplicate_candidates.csv")
unresolved = []
for idx, r in df.iterrows():
    ea = extract_entities(r["description_A"])
    eb = extract_entities(r["description_B"])
    status, detail = evaluate_spatial_compatibility(ea, eb)
    if status == "UNRESOLVED_ENTITIES":
        unresolved.append((idx+1, r["description_A"], r["description_B"]))

print(f"Total unresolved: {len(unresolved)}")
for idx, a, b in unresolved:
    print(f"\n[{idx}]")
    print("  A:", a.strip())
    print("  B:", b.strip())
