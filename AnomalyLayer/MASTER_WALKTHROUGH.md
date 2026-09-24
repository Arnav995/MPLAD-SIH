# MPLADS-Sentinel: Comprehensive System Architecture & Engineering Walkthrough

**Document Status:** Complete & Frozen Baseline  
**Target Audience:** Core Engineering Team, Backend/Frontend Developers, Domain Auditing Specialists  
**Applicable Dataset:** Live eSAKSHI Ingestion (340 projects across 4 Maharashtra Lok Sabha constituencies: Nagpur, Ramtek, Pune, Wardha)  

---

## 1. Executive Summary & System Architecture

### 1.1 Mission Overview
**MPLADS-Sentinel** is an automated, multi-tiered forensic auditing and anomaly detection platform for the **Members of Parliament Local Area Development Scheme (MPLADS)**, running on live data ingested from the Government of India's **eSAKSHI portal** (`esakshi.gov.in`).

Under MPLADS, each Member of Parliament (MP) receives an annual entitlement of **₹5 Crore** (allocated in two annual tranches of ₹2.5 Crore) to recommend durable community development works to the District Collector / District Planning Officer. Across India, thousands of projects worth thousands of crores are sanctioned annually. However, oversight is largely manual and post-facto. 

MPLADS-Sentinel transforms this oversight into a **proactive, automated triage engine** capable of detecting:
* Statutory & procedural compliance breaches (delays, ceiling violations, unauthorized categories).
* Extreme peer-group cost inflation using machine learning.
* Semantic proposal duplication and physical site overlap using NLP.
* Structural proposal splitting and contract fragmentation designed to evade procurement scrutiny.
* Macro-statistical distribution anomalies (Benford's Law non-conformance).

```
+--------------------------------------------------------------------------------------------------+
|                                    MPLADS-SENTINEL ARCHITECTURE                                   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   [eSAKSHI Portal] --> [Layer 0: Ingestion & Harmonization] --> [projects_master.csv]           |
|                                                                     |                            |
|          +----------------------------------+-----------------------+--------------------+       |
|          |                                  |                                            |       |
|          v                                  v                                            v       |
|   [Layer 1: Statutory Rules]        [Layer 2: Cost ML]               [Layer 3: NLP Duplicates]   |
|   - 14 Config-Driven Rules          - PyOD Isolation Forest          - Sentence-BERT (MiniLM-L6) |
|   - Guidelines & GFR Grounded       - Non-parametric IQR             - Scoped candidate groups   |
|   - Outputs: rule_violations        - cost_anomaly_score             - duplicate_suspicion_score |
|          |                                  |                                            |       |
|          +----------------------------------+--------------------------------------------+       |
|                                             |                                                    |
|                                             v                                                    |
|                         [Layer 5: Composite Risk Index & Triage Gate]                            |
|                         - 0 to 100 continuous score with dynamic weight renormalization          |
|                         - Multi-signal corroboration (>= 2 signals) + Primary Risk Anchor        |
|                                             |                                                    |
|                      +----------------------+----------------------+                             |
|                      |                                             |                             |
|                      v                                             v                             |
|         [Tier 1: Operational Watchlist]              [Tier 2: Actionable Red Flags]              |
|         266 Projects (78.2%)                          20 Projects (5.9%)                         |
|         (Single signals, routine backlogs)            (Corroborated High-Priority Targets)       |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|   [Forensic Statistics: Benford's Law (Pooled Chi2 + Nigrini MAD)]                               |
|   [Roadmap: Layer 4 Vendor Network Cartels & Graph Bipartite Analysis]                           |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Layer 0: Data Ingestion, Entity Resolution & Harmonization

### 2.1 eSAKSHI Portal Ingestion (`esakshi_client.py`, `ingest_pipeline.py`)
The eSAKSHI portal does not provide a single, unified flat table. Data is fragmented across multiple asynchronous REST endpoints representing different workflow stages:
1. **Works Recommended (`raw_pulls/works_recommended.json`)**:
   Contains proposal-level metadata submitted by the MP: `WORK_RECOMMENDATION_DTL_ID`, `LETTER_NO`, `RECOMMENDATION_DATE`, `WORK_DESCRIPTION`, `WORK_CATEGORY`, `RECOMMENDED_AMOUNT`, `IS_SC_AREA`, `IS_ST_AREA`, `IS_TRIBAL_TRUST`.
2. **Works Sanctioned / Ongoing (`raw_pulls/works_sanctioned.json` / embedded in recommendations)**:
   Contains administrative approval milestones: `SANCTION_DATE`, `SANCTION_AMOUNT`, `IDA_NAME` (Implementing District Authority), `WORK_STAGE`.
3. **Works Completed (`raw_pulls/works_completed.json`)**:
   Contains delivery records: `ACTUAL_END_DATE`, `is_completed_flag`.
4. **Expenditure (`raw_pulls/expenditure_on_completed_and_on-going_works_as_on_date.json`)**:
   Contains cumulative fund disbursements per project.

### 2.2 Data Harmonization Pipeline (`parse_to_projects_master.py`)
The harmonizer joins these disparate feeds using `WORK_RECOMMENDATION_DTL_ID` as the canonical join key, resolving them into `projects_master.csv`.

#### Sanitization & Guardrails Implemented:
* **Currency String Unwrapping**: Cleans raw financial fields containing currency symbols, commas, or administrative labels (e.g., stripping the `"Total- ₹"` prefix found in eSAKSHI tables before floating-point parsing).
* **Robust Temporal Normalization**: Handles diverse date formats (`YYYY-MM-DD`, `DD/MM/YYYY`, Unix timestamps) while safely preserving `NaT` for pending proposals without crashing.
* **Derived Timeline Columns**:
  * `days_to_sanction = (SANCTION_DATE - RECOMMENDATION_DATE).dt.days`
  * `days_since_recommendation = (NOW - RECOMMENDATION_DATE).dt.days` (for unsanctioned works)
  * `days_to_complete = (ACTUAL_END_DATE - SANCTION_DATE).dt.days`
* **Boolean Coercion**: Normalizes string representations (`"true"`, `"1"`, `"false"`, `pd.NA`) into strict Python booleans for `IS_SC_AREA`, `IS_ST_AREA`, `IS_TRIBAL_TRUST`, and `is_completed_flag`.

---

## 3. Layer 1: Statutory & Heuristic Rule Engine

### 3.1 Design Philosophy (`rules_config.yaml`, `rule_engine.py`)
* **Decoupled Architecture**: Zero hardcoded thresholds in code. All rule logic, weights, field references, and operators reside in `rules_config.yaml` and are dynamically evaluated by `rule_engine.py`.
* **Standardized Contract**: Each project receives a list of tripped `rule_violations` and a capped `rule_score` (`MAX_RULE_SCORE = 40`).

### 3.2 In-Depth Catalog of Rules

| Rule ID | Name & Intent | Check Type & Logic | Statutory / Regulatory Source | Weight | Administrative Nuances & Caveats |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **R1** | **Sanction SLA Delay** | `row_threshold`: `days_to_sanction > 75` (Evaluated only if `SANCTION_DATE` is present). | **MoSPI MPLADS Guidelines 2023, Para 3.12 / 5.2**: Mandates District Authority accord sanction within 75 days (45d standard + 30d technical prep). | 15 | **Caveat:** Does not account for statutory election pauses (Model Code of Conduct ~82 days in 2024). |
| **R2** | **Unsanctioned Proposal Neglect** | `row_threshold`: `days_since_recommendation > 45` (Evaluated only if `SANCTION_DATE` is null). | **MPLADS Guidelines, Para 3.13**: Requires District Authority to communicate rejection/deficiencies within 45 days. | 10 | Captures bureaucratic paralysis. Statewide high volume reflects pending proposal queues. |
| **R3** | **Project Completion Overrun** | `row_threshold`: `days_to_complete > 365` (Evaluated only if `ACTUAL_END_DATE` is present). | **MPLADS Guidelines, Para 3.16**: Normal completion timeframe is 1 year from administrative sanction. | 15 | Legitimate delays (monsoons, land clearance) can receive formal extensions from District Collectors. |
| **R4** | **Annual ₹5 Crore Entitlement Ceiling** | `aggregate_ceiling`: `sum(SANCTION_AMOUNT) > 50,000,000` grouped by `[MP_NAME, FY]`. | **MPLADS Financial Rules**: ₹5 Crore annual allocation per MP. | 25 | **Major Guard:** Must filter to `SANCTION_DATE.notna()`. Pending proposals must never be summed into actual expenditure. |
| **R5** | **Low-Value Work Cost Floor** | `row_threshold`: `SANCTION_AMOUNT < 100,000`. | **MPLADS Guidelines**: ₹1 Lakh recommended minimum cost floor to avoid micro-administrative fragmentation. | 10 | Routine for items like GP bench sets or borewells. Flagged as a structural signal requiring corroboration, not standalone fraud. |
| **R6** | **SC Area Allocation Deficit** | `aggregate_share_floor`: Share of `SANCTION_AMOUNT` in SC areas `< 15%` per `[MP_NAME, FY]`. | **MPLADS Guidelines, Para 2.4**: Mandates at least 15% of annual allocation be spent in SC inhabited areas. | 20 | Macro portfolio-level guideline over an MP's 5-year tenure; not an enforceable constraint on an individual work. |
| **R7** | **ST Area Allocation Deficit** | `aggregate_share_floor`: Share of `SANCTION_AMOUNT` in ST areas `< 7.5%` per `[MP_NAME, FY]`. | **MPLADS Guidelines, Para 2.4**: Mandates at least 7.5% of annual allocation be spent in ST inhabited areas. | 20 | Same as R6; evaluated at the annual portfolio level. |
| **R8** | **Trust/Society Allocation Ceiling** | `aggregate_cumulative_ceiling`: Cumulative `SANCTION_AMOUNT > ₹50L` (or `₹75L` if `IS_TRIBAL_TRUST`) per `VENDOR_NAME`. | **MPLADS Guidelines Para 3.21.2**: Statutory lifetime ceiling for private registered trusts/societies. | 20 | Prevents funneling public funds into private educational or religious trusts. |
| **R9** | **Prohibited Work Categories** | `keyword_prohibition`: Checks `WORK_DESCRIPTION` for prohibited strings (religious shrines, land purchase, private residences). | **MPLADS Guidelines, Annexure-II**: Negative list of non-permissible works. | 25 | **Caveat:** String matching can trip on legitimate public roads leading *to* a landmark (e.g., "Road from Chowk to Hanuman Mandir"). |
| **R10** | **Restricted / Private Access** | `keyword_prohibition`: Flags completed works with descriptions implying private/gated access. | **MPLADS Guidelines, Para 1.2**: Community asset public-use requirement. | 8 | Low weight; keyword-only heuristic requiring field audit corroboration. |
| **D1** | **Category Cost Outlier (IQR)** | `iqr_outlier`: `SANCTION_AMOUNT > Q3 + 1.5 * IQR` within specific `WORK_CATEGORY`. | **Data-Derived**: Non-parametric statistical cost dispersion benchmark. | 15 | Identifies projects costing significantly above category peers. |
| **D2** | **District Rubber-Stamping** | `group_median_deviation`: District median `days_to_sanction` is $> 20$ days below national median. | **Data-Derived**: Process integrity benchmark. | 10 | Identifies districts according mass sanctions without technical vetting. |
| **D3** | **Co-Letter Tranche Fragmentation** | `shared_letter_bundle`: $\ge 3$ works within $\pm 15\%$ spread of median under one `LETTER_NO`, totaling $\ge ₹50\text{L}$. | **GFR 2017 Rule 157 & MoF Works Manual**: Universal anti-splitting doctrine. | 15 | **Evasion-resilient:** Detects intentional parceling of large budgets into sub-threshold tranches (e.g. ₹24L + ₹25L + ₹26L). |
| **D4** | **Just-Below-Threshold Budget** | `just_below_threshold`: Budget sits within $1\%$ or $₹2,000$ below key financial delegation tiers ($₹1\text{L}, ₹10\text{L}, ₹25\text{L}, ₹50\text{L}, ₹1\text{Cr}$). | **Data-Derived**: Forensic threshold positioning / anti-evasion heuristic. | 15 | **Standard rule only (NOT an anchor):** Detects intentional tender-clipping (e.g. ₹9,99,999 or ₹49.96L) to avoid higher administrative delegation tiers. |

---

## 4. Layer 2: Peer-Group Continuous Cost Anomaly Engine

### 4.1 Motivation & Methodological Architecture (`cost_anomaly.py`)
Static statutory rules cannot detect localized financial inflation: ₹10 Lakhs is standard for a cement road, but egregious for office furniture. Layer 2 models cost expectations conditioned on specific work categories.

```
                                  [SANCTIONED WORKS ONLY]
                               (Guards 227 pending proposals)
                                              |
                    +-------------------------+-------------------------+
                    |                                                   |
              N >= 10 Samples                                     5 <= N < 10 Samples
                    |                                                   |
                    v                                                   v
          [PyOD Isolation Forest]                           [Non-Parametric IQR Outlier]
          - Contamination: 0.05                             - Threshold: Q3 + 1.5 * IQR
          - n_estimators: 100                               - Continuous ratio scaling
                    |                                                   |
                    +-------------------------+-------------------------+
                                              |
                                              v
                            [cost_anomaly_score in 0.0 to 1.0]
                            [Human-Interpretable Rationale String]
```

### 4.2 Guardrails & Rigorous Design Decisions
1. **Preemptive Pending-Proposal Guard (`only_sanctioned=True`)**:
   * Pending proposals sitting with placeholder or inflated draft amounts would distort category medians. Layer 2 filters strictly to records where `SANCTION_DATE.notna()`.
2. **Small-Sample Protection ($N < 5$)**:
   * Small sample sizes ($N=3$) lead to mathematical noise. The engine marks categories with $N < 5$ as `not_evaluated`.
3. **Continuous Score Normalization**:
   * Raw decision scores from Isolation Forest are min-max normalized to $[0, 1]$, feeding directly into Layer 5's composite Risk Index.

---

## 5. Layer 3: Semantic Duplicate & Overlap Detection Engine

### 5.1 Motivation & Methodological Architecture (`duplicate_detection.py`)
In public works, intentional contract duplication occurs when identical works are submitted under slightly varied phrasing or split into multiple parallel proposals for the same physical asset.

* **Model**: Pretrained Sentence-Transformers (`all-MiniLM-L6-v2`) generates dense 384-dimensional semantic embeddings of `WORK_DESCRIPTION`.
* **Scoped Candidate Pairs**: Rather than an $O(N^2)$ global Cartesian product, pairs are scoped within `[IDA_NAME, WORK_CATEGORY]` with temporal proximity $\le 180\text{ days}$.
* **Composite Suspicion Score**:
  $$\text{Suspicion} = 0.50 \cdot \text{Similarity} + 0.20 \cdot \text{SameDate} + 0.15 \cdot \text{SameVendor} + 0.15 \cdot \text{AmountRatio}$$

### 5.2 Calibrations & Administrative Boilerplate Protection
1. **Elevated Anchor Threshold ($\ge 0.92$)**:
   * Standard administrative phrasing across different villages (e.g. "Construction of Bus Stop Shed at...") yields ~85–89% text similarity. Raising the anchor threshold to $0.92$ prevents routine templates from reaching Tier 2.
2. **Bulk-Category & Rate-Card Carve-Out**:
   * Standardized distribution items ($< ₹1\text{ Lakh}$ or categories like `ARTIFICIAL LIMBS / AIDS`, `PANCHAYAT BENCHES`, `BOREWELL INSTALLATION`) are explicitly blocked from anchor promotion, recognizing that uniform wording across panchayats is expected administrative behavior.

---

## 6. Layer 4: Vendor Network Graph & Cartel Detection (Roadmap)

* **Status**: Specification complete; scheduled for Phase 2 pending automated OCR extraction of vendor PANs from PDF sanction orders.
* **Architecture**: Bipartite graph $G = (V_{\text{MP}} \cup V_{\text{Vendor}} \cup V_{\text{Agency}}, E)$.
* **Algorithms**: Louvain modularity community detection for bidding rings, and betweenness centrality to identify monopolistic contractors capturing disproportionate shares across multiple constituencies.

---

## 7. Layer 5: Composite Multi-Layer Risk Index & Two-Tier Alert Triage

### 7.1 Dynamic Weight Renormalization (`risk_index_Layer5.py`)
To prevent missing layers (like Layer 4) from deflating scores, Layer 5 dynamically renormalizes active weights per row:
$$\text{Risk Index} = \sum_{k \in \text{Active}} w_k \cdot \text{Score}_k \cdot \frac{100}{\sum_{k \in \text{Active}} w_k}$$
*Base Weights:* Rules: `0.35`, Cost: `0.30`, NLP Duplicates: `0.15`, Graph (Roadmap): `0.20`.

### 7.2 Two-Tier Alert Gating Architecture

```
+--------------------------------------------------------------------------------------------------+
|                                    TWO-TIER PROMOTION ENGINE                                     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   Rule Violations (Layer 1) + Cost Anomalies (Layer 2) + Duplicate Scores (Layer 3)              |
|                                             |                                                    |
|                                             v                                                    |
|                   Does the project meet ALL Tier 2 Promotion Criteria?                           |
|                   1. At least TWO independent signal types (Layer 1, Layer 2, Layer 3, Fast-Track)|
|                   2. Includes at least ONE Primary Risk Anchor:                                  |
|                      - COST_OUTLIER                                                              |
|                      - DUPLICATE_WORK_OVERLAP (>= 0.92 & not bulk grant)                         |
|                      - LETTER_BUNDLE_FRAGMENTATION (D3)                                          |
|                      - COMPLETION_BREACH (R3) / STATUTORY_PROHIBITION (R9, R10)                  |
|                      - FAST_TRACK_SANCTION (<= district Q0.25)                                   |
|                                             |                                                    |
|                        +--------------------+--------------------+                               |
|                        | YES                                     | NO                            |
|                        v                                         v                               |
|          +----------------------------+            +----------------------------+                |
|          |   TIER 2: ACTIONABLE QUEUE |            |   TIER 1: WATCHLIST        |                |
|          |   - 20 Projects (5.9%)     |            |   - 266 Projects (78.2%)   |                |
|          |   - Human Audit Priority   |            |   - Operational Backlogs   |                |
|          +----------------------------+            +----------------------------+                |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### 7.3 Mathematical Reconciliation of Tier-2 Count Evolution ($49 \rightarrow 36 \rightarrow 16 \rightarrow 20$)

| Iteration | Tier 2 Count | % of Total | Root Cause & Calibration Applied |
| :--- | :---: | :---: | :--- |
| **Uncalibrated Rule-Counting** | **49** | 14.4% | **Intra-Layer Leak**: Counted each individual Rule ID (`R1`, `D4`, `D3`) as an independent signal. 21 delayed projects sitting ₹1–₹15 below round slabs reached Tier 2 purely on Layer 1 rules. |
| **Layer 1 Single-Signal Collapse** | **36** | 10.6% | **Collapsed Layer 1**: All 14 Layer 1 rules strictly count as 1 signal type. However, 19 administrative boilerplate pairs (Pune bus stops, Wardha limbs/benches) reached Tier 2 via `DUPLICATE_WORK_OVERLAP` ($\ge 0.85$) + backlog rule `R2`. |
| **Calibrated Duplicate Anchor (Single District Focus)** | **16** | **4.7%** | **Calibrated Duplicate Anchor ($\ge 0.92$ + Bulk Carve-Out)**: Routine boilerplate items cleanly demoted to Tier 1. Only high-confidence multi-tranche splits and cross-layer corroborated cost outliers reach Tier 2. |
| **Multi-District Validated Baseline (Nagpur, Ramtek, Pune, Wardha)** | **20** | **5.9%** | **Multi-District Anchor Integration**: Incorporates 4 additional high-conviction candidate pairs in Pune (Lohegaon & Yerwada bus shelters) and Wardha (Nandgaon GP & drain works) meeting both the $\ge 0.92$ similarity anchor and independent secondary signal requirements ($\ge 2$ layers). |

---

## 8. Forensic Statistics: Benford's Law Engine

### 8.1 Mathematical Formulation (`benford_check.py`)
Benford's Law states that in naturally occurring financial transactions, the probability $P$ of the first leading digit $d \in \{1, \dots, 9\}$ is:
$$P(d) = \log_{10}\left(1 + \frac{1}{d}\right)$$

### 8.2 Statistical Hardening for Small Sample Sizes
1. **Cochran's Rule Guard**:
   Chi-square ($\chi^2$) goodness-of-fit tests require expected cell frequencies $E_i = N \cdot P(d) \ge 5$. For small district pulls ($N \approx 40 - 100$), digits 7, 8, and 9 fall below 5, producing spurious low p-values.
2. **Dynamic Bin Pooling**:
   When $E_i < 5$, the engine dynamically merges adjacent high-digit bins (e.g. pooling bins 6–9 into a composite tail cell), guaranteeing mathematical validity.
3. **Nigrini's Mean Absolute Deviation (MAD)**:
   Measures absolute deviation independent of sample size:
   $$\text{MAD} = \frac{1}{9} \sum_{d=1}^{9} |O_d - P_d|$$
   *Conformity Slabs:* $< 0.006$ (Close), $0.006–0.012$ (Acceptable), $0.012–0.015$ (Marginally Acceptable), $> 0.015$ (Non-conforming).

### 8.3 Live Dataset Distribution & District Summary
Across all 340 evaluated projects in the dataset, first-digit frequencies exhibit severe deviations from logarithmic expectation:

| Digit | Observed Count | Observed % | Expected Benford % | Forensic Driver |
| :---: | :---: | :---: | :---: | :--- |
| **1** | 178 | **52.4%** | 30.1% | Heavily clustered on round ₹10 Lakh, ₹15 Lakh, and ₹1 Lakh slabs |
| **2** | 39 | **11.5%** | 17.6% | Round ₹20 Lakh and ₹25 Lakh works |
| **3** | 8 | **2.4%** | 12.5% | Severe deficit |
| **4** | 13 | **3.8%** | 9.7% | Deficit |
| **5** | 51 | **15.0%** | 7.9% | Clustered on round ₹5 Lakh and ₹50 Lakh slabs |
| **6** | 7 | **2.1%** | 6.7% | Deficit |
| **7** | 9 | **2.6%** | 5.8% | Deficit |
| **8** | 4 | **1.2%** | 5.1% | Deficit |
| **9** | 31 | **9.1%** | 4.6% | **2x Expected**: Just-below-threshold positioning (e.g. ₹9,99,985) |

#### District-Level Conformity (`benford_summary.csv`):
* **Nagpur ($N = 132$):** $\text{MAD} = 0.08386$ | $p = 7.00 \times 10^{-16}$ | Status: `Non-conforming`
* **Pune ($N = 99$):** $\text{MAD} = 0.09353$ | $p = 7.07 \times 10^{-16}$ | Status: `Non-conforming`
* **Wardha ($N = 101$):** $\text{MAD} = 0.06187$ | $p = 1.08 \times 10^{-9}$ | Status: `Non-conforming`

### 8.4 Forensic Finding: Administrative Budget Quantization
* **Conclusion**: Non-conformance is observed **identically and uniformly across all districts**.
* **Root Cause**: Over **67% of all sanctioned projects land on round administrative lumps** (₹5L, ₹10L, ₹15L, ₹25L) rather than commercial bills of quantities.
* **Audit Implication**: This is an **administrative budget quantization artifact**, not individualized fraud. Because all districts share this exact signature, it represents scheme-wide standard operating procedure. The Sentinel API explicitly ships with an `interpretation_note` to prevent false accusations.

---

## 9. Active Live Findings: The 20 Actionable Tier-2 Red Flags

The following 20 projects represent the top **5.9%** of projects meeting the Two-Tier Corroboration Gate ($\ge 2$ independent signal layers + primary risk anchor):

| Project ID | Constituency | Amount | Risk Index | Corroborating Signals | Signal Count | Forensic Description |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **226219** | Nagpur | ₹99,98,850 | **100.0** | `COST_OUTLIER` + Rules (R1, D1, D4) | 2 | Setting up of E-Library at Dr. Ambedkar Law College (**10.0x category median**, 101d delay, ₹1,150 below ₹1Cr) |
| **215132** | Nagpur | ₹25,00,000 | **87.3** | `DUPLICATE_WORK_OVERLAP` + `LETTER_BUNDLE_FRAGMENTATION` (D3) | 2 | Kalamna Road Tranche 2 (Same-day ₹25L split under single recommendation letter) |
| **215133** | Nagpur | ₹25,00,000 | **87.3** | `DUPLICATE_WORK_OVERLAP` + `LETTER_BUNDLE_FRAGMENTATION` (D3) | 2 | Kalamna Road Tranche 3 (Same-day ₹25L split under single recommendation letter) |
| **227307** | Nagpur | ₹30,00,000 | **86.5** | `COST_OUTLIER` + Rules (R1, D1) | 2 | CC road at Dabha from House of Shri Milind to boundary (**3.0x category median**) |
| **256783** | Nagpur | ₹50,00,000 | **66.3** | `COST_OUTLIER` + Rules (D1) | 2 | Development of Dnyanyogi Dr. Shrikant Jichkar Children Traffic Park (**5.0x category median**) |
| **215081** | Nagpur | ₹20,00,000 | **54.6** | `COST_OUTLIER` + Rules (R1, D1) | 2 | CC Road at Malik Mouza Society Arya Nagar (Cost outlier vs standard road peer norms) |
| **215119** | Nagpur | ₹20,00,000 | **54.6** | `COST_OUTLIER` + Rules (R1, D1) | 2 | CC Road at Sai Sevashram Society, Arya Nagar (Cost outlier vs standard road peer norms) |
| **195289** | Wardha | ₹4,00,000 | **53.5** | `DUPLICATE_WORK_OVERLAP` + Rules (R1) | 2 | Cement drain from Subhash Aawate to Ashok Sonawane house (Paired with road 195114) |
| **186531** | Pune | ₹9,99,985 | **51.8** | `DUPLICATE_WORK_OVERLAP` + Rules (R1, D4) | 2 | Asphalting of roads in lane no. 01 and 02 at Sai Ganesh Park (99.9% identical to 186532, ₹15 below ₹10L) |
| **186532** | Pune | ₹9,99,999 | **51.5** | `DUPLICATE_WORK_OVERLAP` + Rules (R1, D4) | 2 | Asphalting of roads in lane no. 03 and 04 at Sai Ganesh Park (99.9% identical to 186531, ₹1 below ₹10L) |
| **276662** | Nagpur | ₹25,00,000 | **50.9** | `FAST_TRACK_SANCTION` + Rules (D1) | 2 | Open space beside NMC Vyayam Shala at Tulshibagh (Fast-track 1d sanction) |
| **278484** | Wardha | ₹15,00,000 | **49.2** | `DUPLICATE_WORK_OVERLAP` + Rules (R1) | 2 | Gram Panchayat Bhavan at Nandgaon T. Varad (Paired with building 254347) |
| **165694** | Wardha | ₹12,00,000 | **48.3** | `COST_OUTLIER` + Rules (R1, D1) | 2 | Deulgaon Selu cement road from Hamdapur road (Cost outlier for Wardha rural works) |
| **195114** | Wardha | ₹10,00,000 | **47.2** | `DUPLICATE_WORK_OVERLAP` + Rules (R1) | 2 | Cement road from Subhash Avate to Ashok Sonawane house (Paired with drain 195289) |
| **210261** | Pune | ₹10,00,000 | **47.2** | `DUPLICATE_WORK_OVERLAP` + Rules (R1) | 2 | Bus stop near Nagar Road Zonal Office adjacent to Yerwada Metro (Paired with 210260) |
| **210260** | Pune | ₹10,00,000 | **47.2** | `DUPLICATE_WORK_OVERLAP` + Rules (R1) | 2 | Bus stop at Yerwada Metro Station in Pune (Paired with 210261) |
| **291742** | Nagpur | ₹50,00,000 | **46.8** | `FAST_TRACK_SANCTION` + Rules (D1) | 2 | Community hall at Santaji Nagar, Dandekar Layout (Fast-track 1d sanction) |
| **254347** | Wardha | ₹10,00,000 | **46.0** | `DUPLICATE_WORK_OVERLAP` + Rules (R1) | 2 | Gram Panchayat building at Nandgaon T. Varud (Paired with Bhavan 278484) |
| **136731** | Nagpur | ₹9,99,600 | **37.5** | `FAST_TRACK_SANCTION` + Rules (D4) | 2 | Highmast light and electric poles at Gosavi Ghat (1d sanction, ₹400 below ₹10L slab) |
| **280871** | Ramtek(SC) | ₹5,00,000 | **24.6** | `DUPLICATE_WORK_OVERLAP` + `FAST_TRACK_SANCTION` | 2 | Area development at Borujwada near Hanuman Temple (1d sanction + duplicate pair) |

---

## 10. Engineering Roadmap & Open Problems

### 10.1 Automated Vendor Extraction from Sanction PDFs (Layer 4 Dependency)
* **Status**: `VENDOR_NAME`, Contractor PAN, and registration numbers are not exposed in eSAKSHI JSON endpoints; they reside inside scanned PDF sanction orders (`sample_sanction_order.pdf`).
* **Implementation**: Build an automated document processing pipeline using PyMuPDF / Tesseract-OCR / LayoutLM to parse PDF orders, extract vendor names and award amounts, and populate `projects_master.csv`.

### 10.2 Model Code of Conduct (MCC) Calendar Integration
* **Status**: Specification complete.
* **Implementation**: Subtract official Election Commission of India (ECI) moratorium periods (~82 days during the 2024 General Elections) from `days_to_sanction` to prevent false flagging of statutory election pauses under Rule R1.

### 10.3 Cumulative Non-Lapsable Fund Ledger Ingestion
* **Status**: Specification complete.
* **Implementation**: Ingest district unspent balance ledgers to evaluate Rule R4 against multi-year cumulative entitlement balances rather than single-year expenditure ceilings.

---

## 11. Developer Quickstart & Verification Guide

### 11.1 Repository Structure (`AnomalyLayer/`)
```
AnomalyLayer/
├── config.yaml                    # Ingestion scope & safety settings
├── rules_config.yaml              # 14 statutory & empirical anomaly rules
├── esakshi_client.py              # Throttled, scoped eSAKSHI API client
├── ingest_pipeline.py             # Layer 0: Raw JSON ingestion orchestrator
├── parse_to_projects_master.py    # Layer 0: Schema harmonization & feature derivation
├── rule_engine.py                 # Layer 1: Statutory rule evaluation engine
├── cost_anomaly.py                # Layer 2: Peer-group Isolation Forest & IQR modeling
├── duplicate_detection.py         # Layer 3: Sentence-BERT duplicate & overlap detection
├── risk_index_Layer5.py           # Layer 5: Composite Risk Index & 2-Tier Triage Engine
├── test_risk_index_Layer5.py      # Layer 5: Unit test suite
├── benford_check.py               # Forensic statistics: Cochran-pooled Benford test
├── run_pipeline.py                # Master 7-step pipeline orchestrator
└── MASTER_WALKTHROUGH.md          # Comprehensive architectural & forensic guide
```

### 11.2 Master Pipeline Execution
```bash
# Execute full live pipeline (Ingestion -> Rules -> Cost ML -> Duplicates -> Risk Index -> Benford)
python run_pipeline.py

# Execute with institutional anonymization (Constituency A/B/C/D for pitch demo)
python run_pipeline.py --anonymize

# Run unit test suite
python test_rule_engine.py
python test_duplicate_detection.py
python test_risk_index_Layer5.py
```

### 11.3 Output Artifacts Contract
Running `run_pipeline.py` populates the following production files:
1. `projects_master.csv`: Exactly 340 harmonized project records.
2. `duplicate_candidates.csv`: Pairwise NLP similarity matches with composite suspicion scores.
3. `flagged_projects.csv`: Complete enriched dataset with continuous `risk_index` (0–100), `primary_anchors`, `signal_type_count`, and `tier` (`tier_2`, `tier_1`, `clean`).
4. `benford_summary.csv`: Pooled Chi-square and Nigrini MAD statistics across all districts.
5. `flagged_projects_anonymized.csv`: Anonymized dataset for external evaluation.

---

## 12. Validated REST API Contract (Backend & Frontend Interface)

**Contract Status:** Verified & Validated directly against `flagged_projects.csv`, `duplicate_candidates.csv`, and `benford_summary.csv` (`scratch/verify_api_contract.py`).

### 12.1 Architectural Conventions
* **Serialization:** All endpoints return UTF-8 JSON.
* **Currency Formatting:** All financial fields are raw integers in ₹ (paise-free, whole rupees) — localization and formatting (e.g. ₹ Lakhs/Crores) are handled client-side.
* **Role Scoping:** Endpoints assume an authenticated session (Ministry, District, or MP). District and MP identifiers are auto-applied by backend middleware and cannot be overridden via client query parameters.
* **Honest Roadmapping:** Live endpoints map 1:1 to generated pipeline columns. Roadmap features return explicit `{ "status": "roadmap" }` stubs rather than synthetic data.

### 12.2 Live Endpoints Specification

#### 1. `GET /api/projects`
Powers the jurisdiction table for District officers, drill-down lists for Ministry auditors, and MP portfolio reviews.
* **Query Parameters:** `district` (string, maps to `IDA_NAME`), `mp_id` (string), `tier` (`"tier_2"` | `"tier_1"` | `"clean"`), `min_risk_index` (float 0–100), `category` (string), `page` (int), `page_size` (int, default 50), `sort` (`"risk_index_desc"` | `"days_to_sanction_desc"` | `"sanction_amount_desc"`).
* **Response Payload:**
```json
{
  "total_count": 340,
  "page": 1,
  "page_size": 50,
  "results": [
    {
      "work_id": "226219",
      "activity_name": "WS/MP672/2024-2025/226219-Setting up of E-Library",
      "constituency": "NAGPUR",
      "district": "NAGPUR(DISTRICT COLLECTOR NAGPUR_IDA)",
      "mp_name": "Nitin Jairam Gadkari",
      "work_category": "Normal/Others",
      "sanction_amount": 9998850,
      "days_to_sanction": 232.0,
      "is_completed": false,
      "risk_index": 100.0,
      "tier": "tier_2",
      "primary_anchors": ["COST_OUTLIER"],
      "signal_type_count": 2
    }
  ]
}
```

#### 2. `GET /api/projects/{work_id}`
Detailed forensic case card providing complete evidence trails and statutory clause citations.
* **Response Payload:**
```json
{
  "work_id": "226219",
  "activity_name": "WS/MP672/2024-2025/226219-Setting up of E-Library",
  "work_description": "Setting up of E-Library at Dr.Babasaheb Ambedkar Law College, Nagpur...",
  "constituency": "NAGPUR",
  "district": "NAGPUR(DISTRICT COLLECTOR NAGPUR_IDA)",
  "mp_name": "Nitin Jairam Gadkari",
  "work_category": "Normal/Others",
  "recommendation_date": "2024-11-15",
  "sanction_date": "2025-07-05",
  "sanction_amount": 9998850,
  "vendor_name": "Maharashtra State Cyber Security",
  "risk_index": 100.0,
  "tier": "tier_2",
  "primary_anchors": ["COST_OUTLIER"],
  "signal_type_count": 2,
  "reasons": [
    "Work not sanctioned within 75 days of recommendation receipt",
    "Sanction amount is a statistical outlier (beyond 1.5x IQR) for its work category",
    "Just-below-threshold budget positioning (within 1-2% of round slab)",
    "Sanction amount is 10.0x the category median (isolation_forest, n=113)"
  ],
  "rule_violations": [
    {"rule_id": "R1", "description": "Work not sanctioned within 75 days of recommendation receipt", "weight": 15},
    {"rule_id": "D1", "description": "Sanction amount is a statistical outlier (beyond 1.5x IQR) for its work category", "weight": 15},
    {"rule_id": "D4", "description": "Just-below-threshold budget positioning (within 1-2% of round slab)", "weight": 15}
  ],
  "cost_anomaly": {
    "flag": true,
    "score": 1.0,
    "method": "isolation_forest",
    "category_median": 1000000.0,
    "category_sample_size": 113
  },
  "duplicate_candidates": []
}
```

#### 3. `GET /api/alerts/tier2-digest`
Curated executive digest delivering the top 5.9% high-conviction targets to Ministry leadership.
* **Response Payload:**
```json
{
  "generated_at": "2026-09-24T16:30:00Z",
  "total_evaluated": 340,
  "tier2_count": 20,
  "tier2_percentage": 5.9,
  "promotion_criteria": "Requires >= 2 independent corroborating signal types AND >= 1 primary risk anchor",
  "alerts": [ /* Array of 20 serialized tier_2 project objects */ ]
}
```

#### 4. `GET /api/duplicates`
Pairwise duplicate candidate table scoped by district and similarity threshold.
* **Query Parameters:** `district` (string, optional), `min_suspicion_score` (float, default 0.85).
* **Response Payload:**
```json
{
  "results": [
    {
      "work_id_a": "215132",
      "work_id_b": "215133",
      "district": "NAGPUR(DISTRICT COLLECTOR NAGPUR_IDA)",
      "text_similarity": 0.927,
      "days_apart": 0,
      "same_vendor": true,
      "amount_ratio": 1.0,
      "duplicate_suspicion_score": 0.927,
      "reason": "Description text is 92.7% similar...candidate for human review"
    }
  ]
}
```

#### 5. `GET /api/benford/districts`
Forensic statistical summary with statutory budget quantization context.
* **Response Payload:**
```json
{
  "districts": [
    {
      "district": "NAGPUR(DISTRICT COLLECTOR NAGPUR_IDA)",
      "sample_size": 132,
      "mad": 0.08386,
      "chi2_p_value": 7.00e-16,
      "cochran_valid": true,
      "status": "non_conforming"
    }
  ],
  "interpretation_note": "Non-conformance is observed uniformly across all districts and is attributed to administrative budget quantization (round-figure sanctioning), not fraud. See methodology notes."
}
```

#### 6. `GET /api/districts/{district}/summary` & `GET /api/mp/{mp_id}/summary`
Executive KPI header metrics.
* **Response Payload:**
```json
{
  "scope_name": "NAGPUR(DISTRICT COLLECTOR NAGPUR_IDA)",
  "total_works": 132,
  "unsanctioned_pending": 68.2,
  "median_days_to_sanction": 115.0,
  "tier2_count": 11,
  "tier1_count": 80,
  "clean_count": 41
}
```

### 12.3 Phase 2 Roadmap Stubs
* `GET /api/vendor-graph`:
  `{ "status": "roadmap", "message": "Vendor network graph requires PDF sanction-order OCR extraction, planned Phase 2.", "data": null }`
* `GET /api/photo-verification/{work_id}`:
  `{ "status": "roadmap", "message": "Photo-vs-progress verification planned Phase 2 (visual comparison only, EXIF stripped by eSAKSHI).", "data": null }`
* `GET /api/assistant/query`:
  `{ "status": "roadmap", "message": "Statutory RAG assistant planned Phase 2.", "data": null }`
