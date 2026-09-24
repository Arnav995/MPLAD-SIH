import pandas as pd

df = pd.read_csv("duplicate_candidates.csv")
print("All 82 pairs summary:")
for idx, r in df.iterrows():
    print(f"[{idx+1}] Dist={r['district'][:10]} | Score={r['duplicate_suspicion_score']:.3f} | Sim={r['text_similarity']:.3f}")
    print(f"     A: {r['description_A'][:80]}")
    print(f"     B: {r['description_B'][:80]}")
