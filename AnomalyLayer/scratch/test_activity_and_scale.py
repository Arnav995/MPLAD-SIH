import re
import pandas as pd

df = pd.read_csv("projects_master.csv")
print(f"Total projects in master: {len(df)}")

def classify_activity(row):
    act = str(row.get("ACTIVITY_NAME", "")).lower()
    desc = str(row.get("WORK_DESCRIPTION", "")).lower()
    text = act + " " + desc
    
    if any(k in text for k in ["road", "pathway", "cc road", "asphalting", "paver block", "i-block", "i block", "drain", "drainage", "gutter", "culvert", "puliya", "footpath", "cement road"]):
        return "ROADS_AND_DRAINAGE"
    elif any(k in text for k in ["community hall", "samaj bhavan", "community center", "auditorium", "shed", "pavilion", "covered sitting"]):
        return "COMMUNITY_HALLS_AND_STRUCTURES"
    elif any(k in text for k in ["bench", "benches", "sitting rcc benches"]):
        return "PUBLIC_BENCHES"
    elif any(k in text for k in ["borewell", "bore well", "tube well", "hand pump", "drinking water", "water supply"]):
        return "WATER_AND_BOREWELLS"
    elif any(k in text for k in ["bus stop", "passenger shed"]):
        return "BUS_STOPS"
    elif any(k in text for k in ["computer", "smart class", "smart board", "printer", "it system", "modular science", "e-library", "library"]):
        return "EDUCATION_AND_IT"
    elif any(k in text for k in ["prosthetic", "artificial limb", "wheel chair", "tricycle", "hearing aid", "disabled person", "assistive"]):
        return "HEALTH_AND_ASSISTIVE_DEVICES"
    elif any(k in text for k in ["light", "highmast", "street light", "electric pole", "solar"]):
        return "LIGHTING_AND_ELECTRICAL"
    elif any(k in text for k in ["repair", "renovation"]):
        return "REPAIR_AND_RENOVATION"
    else:
        return "OTHER_PUBLIC_FACILITIES"

def extract_scale(row):
    desc = str(row.get("WORK_DESCRIPTION", ""))
    # 1. Benches
    b_match = re.search(r'(\d+)\s*(?:cement concrete benches|benches|rcc benches)', desc, re.IGNORECASE)
    if b_match:
        return {"item": "benches", "quantity": int(b_match.group(1))}
    # 2. Computers
    c_match = re.search(r'(\d+)\s*(?:computer sets|computers|computer systems)', desc, re.IGNORECASE)
    if c_match:
        return {"item": "computers", "quantity": int(c_match.group(1))}
    # 3. Borewells
    if "borewell" in desc.lower():
        bw_match = re.search(r'(\d+)\s*borewell', desc, re.IGNORECASE)
        qty = int(bw_match.group(1)) if bw_match else 1
        return {"item": "borewells", "quantity": qty}
    return None

df["classified_activity"] = df.apply(classify_activity, axis=1)
print("\nClassified Activity Distribution:")
print(df["classified_activity"].value_counts())

print("\nSample physical scale extractions:")
scale_count = 0
for idx, row in df.iterrows():
    scale = extract_scale(row)
    if scale:
        scale_count += 1
        if scale_count <= 8:
            print(f"  ID {row['WORK_RECOMMENDATION_DTL_ID']} | Amount: Rs {row['SANCTION_AMOUNT']:,.0f} | Item: {scale['item']} x {scale['quantity']} | Rate: Rs {row['SANCTION_AMOUNT']/scale['quantity']:,.0f}/unit | Desc: {row['WORK_DESCRIPTION'][:65]}")
print(f"Total works with extracted scale: {scale_count}")
