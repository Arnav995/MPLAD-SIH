import pandas as pd
from test_prototype_l3 import proto_df, df

unres = proto_df[proto_df["typology"] == "UNRESOLVED_SIMILAR_WORK"]
for _, r in unres.iterrows():
    idx = r["pair_idx"] - 1
    orig = df.iloc[idx]
    print(f"\n[Pair {r['pair_idx']}] Dist: {orig['district']} | Sim: {orig['text_similarity']} | Score: {r['score']}")
    print(f"  A: {orig['description_A']}")
    print(f"  B: {orig['description_B']}")
