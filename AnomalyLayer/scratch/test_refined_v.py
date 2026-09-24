import re

def test_v(t):
    v = set()
    # Mauja / Mouza / Village / Under village
    m1 = re.findall(r'\b(?:Mauja|Mouza|Village|Under\s+Village)\b\s*[-:]?\s*([A-Za-z\s()]+?)(?=(?:,|\s+Ta\b|\s+T\b|\s+Taluka|\s+Dist|\s+Khasra|\s+Mr\b|\s+Shri\b|\s+house|\s+home|\s+Construction|\s*$))', t, re.IGNORECASE)
    for m in m1:
        clean = m.strip('. ')
        if len(clean) > 2 and clean.lower() not in ("road", "drain", "the", "at"):
            v.add(clean.title())
            
    m2 = re.findall(r'([A-Za-z\s()]+?)\s+Village\b', t, re.IGNORECASE)
    for m in m2:
        clean = m.strip('. ')
        if len(clean) > 2:
            v.add(clean.title())

    m3 = re.findall(r'\bat\s+([A-Za-z\s()]+?)(?=(?:,|\s+Ta\b|\s+T\b|\s+Taluka|\s+Dist|\s+Khasra|\s+Mr\b|\s+Shri\b|\s+house|\s+home|\s+from|\s+between|\s+under|\s*$))', t, re.IGNORECASE)
    for m in m3:
        clean = m.strip('. ')
        if len(clean) > 2 and clean.lower() not in ("the", "various", "a", "completed"):
            v.add(clean.title())
            
    return v

samples = [
    "CONSTRUCTION OF ROAD AT SONEGAON BORI, TA. NAGPUR FROM MR. LATIF SAWARE HOME TO MR. RAVI RAMTEKE HOME",
    "CONSTRUCTION OF CEMENT ROAD WITH DRAIN UNDER VILLAGE AADKA, TA. KAMPTEE",
    "CONSTRUCTION OF CONCRETE ROAD WITH DRAIN UNDER CHIKHALI VILLAGE, TA. KAMPTEE",
    "Mauja Alodi, Dist.Wardha Mr. Dhanorkar to Shri.Baba Rao Phukte Construction of Cementing road",
    "Construction of cement road from Shri Dinkarrao Khairkar to Shri Bapurao Kurwade house at Mauza Wagholi Ta Ashti",
    "Borewell work at Borgaon (Meghe), Ward No. 3, Ganesh Nagar, Wardha.",
    "Borewell work at the Om Ganesh Temple in Swapna Nagari, Sindi (Meghe), Wardha.",
    "Cosntruction of CC Flooring road from residence of Shyam Tarare to residence of Ganesh Ghodmare, Balabhaupeth, Nagpur"
]

for s in samples:
    print(s[:60], "->", test_v(s))
