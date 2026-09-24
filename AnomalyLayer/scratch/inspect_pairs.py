import pandas as pd

df = pd.read_csv("duplicate_candidates.csv")
print(f"Total pairs in duplicate_candidates.csv: {len(df)}")
print("\nFirst 15 pairs:")
for idx, r in df.head(15).iterrows():
    print(f"\n--- Pair {idx+1} ({r['district']}) | Score: {r['duplicate_suspicion_score']} | Sim: {r['text_similarity']} ---")
    print(f"  A: {r['description_A']}")
    print(f"  B: {r['description_B']}")
