from test_prototype_l3 import df, prune_boilerplate
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

p_a = [prune_boilerplate(t) for t in df["description_A"]]
p_b = [prune_boilerplate(t) for t in df["description_B"]]

print("Comparison of Original vs Residual for first 5 pairs:")
for i in range(5):
    print(f"\n[Pair {i+1}]")
    print("Orig A:", df["description_A"].iloc[i][:70])
    print("Residual A:", p_a[i][:70])
    print("Orig B:", df["description_B"].iloc[i][:70])
    print("Residual B:", p_b[i][:70])
