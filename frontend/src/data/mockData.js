// Realistic Mock Data for MPLADS Sentinel Platform

export const MINISTRY_STATS = {
  totalAllocated: "₹4,250.00 Cr",
  disbursedUtilized: "₹3,680.50 Cr",
  utilizationRate: "86.6%",
  flaggedExpenditure: "₹142.50 Cr",
  flaggedProjectsCount: 184,
  activeConstituencies: "543 / 543",
  districtsAudited: 748,
  anomalyScoreAvg: "4.2 / 10"
};

export const STATE_PERFORMANCE_DATA = [
  { id: "UP", state: "Uttar Pradesh", allocation: "₹640.0 Cr", disbursed: "₹552.0 Cr", utilization: "86.25%", riskLevel: "HIGH", flaggedAmount: "₹28.4 Cr", activeProjects: 1420, criticalAnomalies: 42 },
  { id: "MH", state: "Maharashtra", allocation: "₹480.0 Cr", disbursed: "₹428.0 Cr", utilization: "89.17%", riskLevel: "MODERATE", flaggedAmount: "₹14.2 Cr", activeProjects: 1105, criticalAnomalies: 18 },
  { id: "WB", state: "West Bengal", allocation: "₹420.0 Cr", disbursed: "₹345.0 Cr", utilization: "82.14%", riskLevel: "HIGH", flaggedAmount: "₹22.1 Cr", activeProjects: 980, criticalAnomalies: 31 },
  { id: "TN", state: "Tamil Nadu", allocation: "₹390.0 Cr", disbursed: "₹365.0 Cr", utilization: "93.59%", riskLevel: "LOW", flaggedAmount: "₹4.8 Cr", activeProjects: 890, criticalAnomalies: 5 },
  { id: "BR", state: "Bihar", allocation: "₹400.0 Cr", disbursed: "₹312.0 Cr", utilization: "78.00%", riskLevel: "HIGH", flaggedAmount: "₹31.0 Cr", activeProjects: 1040, criticalAnomalies: 48 },
  { id: "KA", state: "Karnataka", allocation: "₹280.0 Cr", disbursed: "₹252.0 Cr", utilization: "90.00%", riskLevel: "LOW", flaggedAmount: "₹3.5 Cr", activeProjects: 650, criticalAnomalies: 4 },
  { id: "GJ", state: "Gujarat", allocation: "₹260.0 Cr", disbursed: "₹241.0 Cr", utilization: "92.69%", riskLevel: "LOW", flaggedAmount: "₹2.9 Cr", activeProjects: 610, criticalAnomalies: 3 },
  { id: "RJ", state: "Rajasthan", allocation: "₹250.0 Cr", disbursed: "₹210.0 Cr", utilization: "84.00%", riskLevel: "MODERATE", flaggedAmount: "₹9.8 Cr", activeProjects: 580, criticalAnomalies: 12 },
  { id: "MP", state: "Madhya Pradesh", allocation: "₹290.0 Cr", disbursed: "₹245.0 Cr", utilization: "84.48%", riskLevel: "MODERATE", flaggedAmount: "₹11.5 Cr", activeProjects: 690, criticalAnomalies: 15 },
  { id: "KL", state: "Kerala", allocation: "₹200.0 Cr", disbursed: "₹188.0 Cr", utilization: "94.00%", riskLevel: "LOW", flaggedAmount: "₹1.8 Cr", activeProjects: 420, criticalAnomalies: 1 }
];

export const TOP_ANOMALY_CATEGORIES = [
  { category: "Unit Rate Overrun vs State SOR", count: 74, exposure: "₹52.4 Cr", trend: "+12%" },
  { category: "Spatial & Spec Vector Duplication", count: 48, exposure: "₹41.8 Cr", trend: "+5%" },
  { category: "Benford Digit Frequency Distortion", count: 36, exposure: "₹29.1 Cr", trend: "-3%" },
  { category: "Single-Vendor Contract Clustering", count: 26, exposure: "₹19.2 Cr", trend: "+8%" }
];

export const TIER2_DIGEST_DATA = {
  digestPeriod: "Bi-Weekly Executive Digest — Cycle 18 (Sep 01 - Sep 15, 2026)",
  criticalCount: 14,
  flaggedExposure: "₹48.20 Cr",
  districtComplianceIndex: "89.4%",
  highlightClusters: [
    {
      id: "CLS-409",
      title: "Varanasi Urban Road Resurfacing Specification Duplication",
      district: "Varanasi (UP)",
      severity: "CRITICAL",
      exposure: "₹4.85 Cr",
      affectedProjects: 3,
      description: "AI Vector Engine matched 94% text & spatial overlap between PRJ-2026-VAR-089 (MP Funded) and PWD Scheme #UP-PWD-2025-44. High risk of double invoice disbursement.",
      recommendedAction: "Freeze Tranche 2 Disbursement immediately & order physical inspection."
    },
    {
      id: "CLS-212",
      title: "Baramulla Solar Street Light Unit Rate Inflation Spike",
      district: "Baramulla (JK)",
      severity: "HIGH",
      exposure: "₹3.20 Cr",
      affectedProjects: 5,
      description: "BOQ pricing unit rate for 120W LED Solar Fixture submitted at ₹48,500/unit compared to State Schedule of Rates (SOR) benchmark of ₹26,000/unit (+86.5% variance).",
      recommendedAction: "Issue Notice to District Executing Agency for BOQ rate revision."
    },
    {
      id: "CLS-105",
      title: "Patna Drinking Water Pipe Supply Benford First-Digit Anomaly",
      district: "Patna (BR)",
      severity: "HIGH",
      exposure: "₹7.40 Cr",
      affectedProjects: 8,
      description: "Chi-square statistical test revealed significant anomaly (p < 0.001) in invoice amounts starting with digit '4' (48% vs expected 9.7%), signaling intentional voucher splitting below approval threshold.",
      recommendedAction: "Escalate to CAG Audit Cell & initiate forensic ledger scan."
    }
  ],
  escalationMatrix: [
    { id: "ESC-881", state: "Uttar Pradesh", district: "Varanasi", category: "Duplicate Vector", riskScore: 9.4, status: "ACTION REQUIRED", exposure: "₹4.85 Cr" },
    { id: "ESC-882", state: "Bihar", district: "Patna", category: "Benford Distortion", riskScore: 8.9, status: "UNDER REVIEW", exposure: "₹7.40 Cr" },
    { id: "ESC-883", state: "Jammu & Kashmir", district: "Baramulla", category: "Unit Rate Overrun", riskScore: 8.6, status: "ACTION REQUIRED", exposure: "₹3.20 Cr" },
    { id: "ESC-884", state: "West Bengal", district: "Murshidabad", category: "Vendor Monopoly", riskScore: 8.2, status: "PENDING DA RESPONSE", exposure: "₹2.90 Cr" },
    { id: "ESC-885", state: "Maharashtra", district: "Thane", category: "Unapproved Scope Change", riskScore: 7.8, status: "ESCALATED TO CAG", exposure: "₹5.10 Cr" }
  ]
};

export const BENFORD_ANALYSIS_DATA = {
  totalTransactions: "48,290",
  chiSquareValue: "34.21",
  chiSquareThreshold: "15.51",
  distortionStatus: "HIGH DISTORTION FLAGGED",
  pVal: "< 0.0001",
  firstDigitDistribution: [
    { digit: "1", expected: 30.1, actual: 21.4, status: "DEFICIT" },
    { digit: "2", expected: 17.6, actual: 16.2, status: "NORMAL" },
    { digit: "3", expected: 12.5, actual: 11.8, status: "NORMAL" },
    { digit: "4", expected: 9.7, actual: 24.8, status: "SPIKE (Voucher Splitting)" },
    { digit: "5", expected: 7.9, actual: 7.1, status: "NORMAL" },
    { digit: "6", expected: 6.7, actual: 5.9, status: "NORMAL" },
    { digit: "7", expected: 5.8, actual: 4.6, status: "NORMAL" },
    { digit: "8", expected: 5.1, actual: 3.2, status: "NORMAL" },
    { digit: "9", expected: 4.6, actual: 5.0, status: "NORMAL" }
  ],
  flaggedTransactions: [
    { id: "TXN-90412", district: "Varanasi", contractor: "M/s Surya Infra Tech", amount: "₹4,98,500", leadDigit: "4", anomalyScore: "9.2", reason: "Repeated vouchers just under ₹5 Lakh approval threshold", date: "2026-09-02", projectRef: "PRJ-2026-VAR-089" },
    { id: "TXN-90413", district: "Varanasi", contractor: "M/s Surya Infra Tech", amount: "₹4,99,200", leadDigit: "4", anomalyScore: "9.4", reason: "Repeated vouchers just under ₹5 Lakh approval threshold", date: "2026-09-02", projectRef: "PRJ-2026-VAR-089" },
    { id: "TXN-90414", district: "Varanasi", contractor: "M/s Surya Infra Tech", amount: "₹4,97,800", leadDigit: "4", anomalyScore: "9.1", reason: "Repeated vouchers just under ₹5 Lakh approval threshold", date: "2026-09-03", projectRef: "PRJ-2026-VAR-089" },
    { id: "TXN-88102", district: "Patna", contractor: "Ganga Civil Works Pvt Ltd", amount: "₹48,90,000", leadDigit: "4", anomalyScore: "8.7", reason: "High artificial frequency spike on digit 4 in quarterly ledger", date: "2026-08-28", projectRef: "PRJ-2026-PAT-012" },
    { id: "TXN-77319", district: "Baramulla", contractor: "Northern Heights Const", amount: "₹4,85,000", leadDigit: "4", anomalyScore: "8.5", reason: "Voucher cluster near ₹5L sanction boundary", date: "2026-08-21", projectRef: "PRJ-2026-BAR-004" }
  ]
};

export const DISTRICT_VARANASI_DATA = {
  districtName: "Varanasi",
  state: "Uttar Pradesh",
  collectorName: "Shri S. Rajalingam, IAS",
  totalAllocation: "₹25.00 Cr",
  sanctionedDisbursed: "₹19.40 Cr",
  activeWorks: 42,
  pendingAlertsCount: 6,
  workStages: [
    { stage: "Recommended", count: 8, amount: "₹3.80 Cr" },
    { stage: "Sanctioned", count: 12, amount: "₹5.60 Cr" },
    { stage: "Tendered", count: 6, amount: "₹2.90 Cr" },
    { stage: "In Execution", count: 14, amount: "₹6.10 Cr" },
    { stage: "Completed", count: 2, amount: "₹1.00 Cr" }
  ],
  sectorAllocation: [
    { sector: "Roads & Bridges", allocated: "₹8.5 Cr", percentage: 34 },
    { sector: "Drinking Water", allocated: "₹5.2 Cr", percentage: 21 },
    { sector: "Education & Schools", allocated: "₹4.8 Cr", percentage: 19 },
    { sector: "Healthcare Facilities", allocated: "₹3.5 Cr", percentage: 14 },
    { sector: "Sanitation & Waste", allocated: "₹3.0 Cr", percentage: 12 }
  ],
  monthlyDisbursement: [
    { month: "Apr 26", amount: 1.2 },
    { month: "May 26", amount: 2.1 },
    { month: "Jun 26", amount: 3.4 },
    { month: "Jul 26", amount: 4.2 },
    { month: "Aug 26", amount: 4.8 },
    { month: "Sep 26", amount: 3.7 }
  ]
};

export const PROJECTS_LIST = [
  {
    id: "PRJ-2026-VAR-089",
    title: "Solar Street Light Installation Phase-3",
    mpName: "Shri Narendra Modi",
    constituency: "Varanasi",
    sector: "Rural Infrastructure",
    sanctionedAmount: "₹45,00,000",
    estimatedCost: "₹45,00,000",
    disbursedAmount: "₹22,50,000",
    status: "IN EXECUTION",
    riskLevel: "CRITICAL ANOMALY",
    executingAgency: "Varanasi Municipal Corp / M/s Surya Infra Tech",
    location: "Kashi Vidyapeeth Block, Varanasi",
    dateRecommended: "2026-04-12",
    dateSanctioned: "2026-05-18",
    completionTarget: "2026-11-30",
    anomalyType: "Unit Rate + Vector Duplication",
    similarityScore: "94%"
  },
  {
    id: "PRJ-2026-VAR-044",
    title: "RO Drinking Water Plant Construction in Sevapuri",
    mpName: "Shri Narendra Modi",
    constituency: "Varanasi",
    sector: "Drinking Water",
    sanctionedAmount: "₹28,00,000",
    estimatedCost: "₹28,00,000",
    disbursedAmount: "₹28,00,000",
    status: "COMPLETED",
    riskLevel: "LOW RISK",
    executingAgency: "UP Jal Nigam",
    location: "Sevapuri Block, Varanasi",
    dateRecommended: "2026-02-10",
    dateSanctioned: "2026-03-05",
    completionTarget: "2026-08-15",
    anomalyType: "None",
    similarityScore: "12%"
  },
  {
    id: "PRJ-2026-VAR-102",
    title: "Smart Classroom Digital Equipment for Govt Inter College",
    mpName: "Shri Narendra Modi",
    constituency: "Varanasi",
    sector: "Education",
    sanctionedAmount: "₹35,00,000",
    estimatedCost: "₹35,00,000",
    disbursedAmount: "₹17,50,000",
    status: "IN EXECUTION",
    riskLevel: "MODERATE RISK",
    executingAgency: "EdTech Infra Solutions Ltd",
    location: "Varanasi City",
    dateRecommended: "2026-05-02",
    dateSanctioned: "2026-06-14",
    completionTarget: "2026-12-15",
    anomalyType: "Single Bidder Variance",
    similarityScore: "35%"
  },
  {
    id: "PRJ-2026-VAR-118",
    title: "Community Health Sub-Center Building Extension",
    mpName: "Shri Narendra Modi",
    constituency: "Varanasi",
    sector: "Healthcare",
    sanctionedAmount: "₹62,00,000",
    estimatedCost: "₹62,00,000",
    disbursedAmount: "₹0",
    status: "SANCTIONED",
    riskLevel: "LOW RISK",
    executingAgency: "UP PWD Division 2",
    location: "Pindra Block, Varanasi",
    dateRecommended: "2026-06-20",
    dateSanctioned: "2026-07-28",
    completionTarget: "2027-03-31",
    anomalyType: "None",
    similarityScore: "08%"
  },
  {
    id: "PRJ-2026-VAR-140",
    title: "CC Road & Covered Drain Construction at Chhataripur",
    mpName: "Shri Narendra Modi",
    constituency: "Varanasi",
    sector: "Roads & Sanitation",
    sanctionedAmount: "₹52,00,000",
    estimatedCost: "₹52,00,000",
    disbursedAmount: "₹26,00,000",
    status: "TENDERED",
    riskLevel: "HIGH ANOMALY",
    executingAgency: "M/s Purvanchal Builders",
    location: "Chhataripur Ward, Varanasi",
    dateRecommended: "2026-07-04",
    dateSanctioned: "2026-08-10",
    completionTarget: "2027-02-28",
    anomalyType: "BOQ Rate Inflation (+38%)",
    similarityScore: "78%"
  }
];

export const DUPLICATE_DETECTION_PAIRS = [
  {
    id: "DUP-MATCH-01",
    similarityScore: 94,
    status: "FLAGGED DUPLICATE",
    proposalA: {
      id: "PRJ-2026-VAR-089",
      title: "Solar Street Light Installation Phase-3",
      source: "MP Recommendation (2026)",
      agency: "Varanasi Municipal Corp / M/s Surya Infra",
      cost: "₹45,00,000",
      location: "GPS: 25.3176° N, 82.9739° E (Kashi Vidyapeeth)",
      specSummary: "Supply & installation of 150 nos. 120W Octagonal Pole Solar LED Lighting Units along main arterial stretches."
    },
    proposalB: {
      id: "UP-PWD-2025-44",
      title: "Kashi Vidyapeeth Smart Renewable Lighting Project",
      source: "State PWD Scheme (Sanctioned Oct 2025)",
      agency: "UP Renewable Energy Dev Agency (UPREDA)",
      cost: "₹42,50,000",
      location: "GPS: 25.3179° N, 82.9742° E (Kashi Vidyapeeth)",
      specSummary: "Installation of 145 octagonal pole 120W solar street lights in Kashi Vidyapeeth block area."
    },
    vectorBreakdown: {
      spatialDistance: "14 meters",
      textualSimilarity: "96.4%",
      boqOverlap: "91.2%",
      contractorMatch: "Same Vendor Sub-contractor (M/s Surya Infra)"
    }
  },
  {
    id: "DUP-MATCH-02",
    similarityScore: 82,
    status: "UNDER REVIEW",
    proposalA: {
      id: "PRJ-2026-VAR-140",
      title: "CC Road & Covered Drain Construction at Chhataripur",
      source: "MP Recommendation (2026)",
      agency: "M/s Purvanchal Builders",
      cost: "₹52,00,000",
      location: "GPS: 25.3512° N, 82.9910° E (Chhataripur)",
      specSummary: "1.2 km M-30 Grade Cement Concrete pavement with R.C.C box drain on both flanks."
    },
    proposalB: {
      id: "DUDA-2024-VAR-88",
      title: "Chhataripur Internal Lane Concreting & Drainage",
      source: "District Urban Development Agency (2024)",
      agency: "M/s Purvanchal Builders",
      cost: "₹48,00,000",
      location: "GPS: 25.3518° N, 82.9915° E (Chhataripur)",
      specSummary: "Construction of CC road and side drains in Chhataripur Ward lanes."
    },
    vectorBreakdown: {
      spatialDistance: "65 meters",
      textualSimilarity: "84.0%",
      boqOverlap: "80.5%",
      contractorMatch: "Identical Contractor (M/s Purvanchal)"
    }
  }
];

export const COST_ANOMALIES_BOQ = [
  {
    id: "BOQ-089-01",
    itemDescription: "120W LED Solar Luminaire with Octagonal Galvanized Pole (8m) & LiFePO4 Battery Pack",
    claimedUnitRate: 48500,
    sorBenchmarkRate: 26000,
    unit: "Each",
    quantity: 150,
    claimedTotal: "₹72,75,000",
    benchmarkTotal: "₹39,00,000",
    variancePercent: "+86.5%",
    severity: "CRITICAL",
    contractor: "M/s Surya Infra Tech"
  },
  {
    id: "BOQ-089-02",
    itemDescription: "M-25 Grade Reinforced Cement Concrete Foundation for Light Pole (1.2m x 1.2m x 1.5m)",
    claimedUnitRate: 14200,
    sorBenchmarkRate: 9800,
    unit: "Cum",
    quantity: 150,
    claimedTotal: "₹21,30,000",
    benchmarkTotal: "₹14,70,000",
    variancePercent: "+44.9%",
    severity: "HIGH",
    contractor: "M/s Surya Infra Tech"
  },
  {
    id: "BOQ-140-01",
    itemDescription: "M-30 Concrete Road Pavement (200mm thickness) Ready Mix",
    claimedUnitRate: 6800,
    sorBenchmarkRate: 4900,
    unit: "Cum",
    quantity: 600,
    claimedTotal: "₹40,80,000",
    benchmarkTotal: "₹29,40,000",
    variancePercent: "+38.8%",
    severity: "HIGH",
    contractor: "M/s Purvanchal Builders"
  },
  {
    id: "BOQ-102-01",
    itemDescription: "75-inch Interactive Smart Display Touch Panel 4K UHD with OPS i5",
    claimedUnitRate: 225000,
    sorBenchmarkRate: 180000,
    unit: "Set",
    quantity: 12,
    claimedTotal: "₹27,00,000",
    benchmarkTotal: "₹21,60,000",
    variancePercent: "+25.0%",
    severity: "MODERATE",
    contractor: "EdTech Infra Solutions Ltd"
  }
];

export const AUDIT_LOGS_DATA = [
  {
    id: "LOG-10942",
    timestamp: "2026-09-10 14:32:05",
    user: "Shri S. Rajalingam (Collector)",
    role: "District Authority",
    action: "FLAGGED_COST_ANOMALY",
    targetEntity: "PRJ-2026-VAR-089 (BOQ Line #1)",
    ipAddress: "10.42.18.91",
    verificationStamp: "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    severity: "CRITICAL",
    details: "Issued Freeze order on Tranche 2 due to +86.5% unit rate inflation vs PWD SOR."
  },
  {
    id: "LOG-10941",
    timestamp: "2026-09-10 11:15:22",
    user: "AI Sentinel Engine",
    role: "Automated System",
    action: "VECTOR_DUPLICATE_FLAG",
    targetEntity: "PRJ-2026-VAR-089 vs UP-PWD-2025-44",
    ipAddress: "127.0.0.1 (System)",
    verificationStamp: "SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    severity: "HIGH",
    details: "High 94% text and spatial vector similarity detected."
  },
  {
    id: "LOG-10940",
    timestamp: "2026-09-09 16:45:10",
    user: "Ministry Audit Director",
    role: "Ministry Oversight",
    action: "BENFORD_SCAN_EXECUTE",
    targetEntity: "UP District Ledgers Q2-2026",
    ipAddress: "14.139.60.12",
    verificationStamp: "SHA256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    severity: "INFO",
    details: "Scanned 48,290 ledger transactions; chi-square 34.21 flagged digit '4' distortion."
  },
  {
    id: "LOG-10939",
    timestamp: "2026-09-08 09:20:18",
    user: "MP Office (Varanasi Secretariat)",
    role: "Member of Parliament",
    action: "RECOMMENDED_NEW_WORK",
    targetEntity: "PRJ-2026-VAR-140",
    ipAddress: "117.211.89.44",
    verificationStamp: "SHA256:3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b",
    severity: "INFO",
    details: "MP Recommendation letter uploaded for CC Road Chhataripur (₹52L)."
  },
  {
    id: "LOG-10938",
    timestamp: "2026-09-07 15:10:00",
    user: "District Planning Officer",
    role: "District Authority",
    action: "TRANCHE_DISBURSEMENT_APPROVE",
    targetEntity: "PRJ-2026-VAR-044",
    ipAddress: "10.42.18.88",
    verificationStamp: "SHA256:b4c5c7694f4c8033ef639d67b7f14b62ebc002f2323e20e8d5e0d4949f57d6ef",
    severity: "INFO",
    details: "Final milestone disbursement ₹14.0L released upon physical completion certificate."
  }
];

export const INVESTIGATION_DETAIL_PRJ089 = {
  project: PROJECTS_LIST[0],
  forensicSummary: {
    overallRiskScore: "9.4 / 10 (CRITICAL)",
    anomalyFlags: [
      "BOQ Unit Rate Inflation (+86.5% on LED Luminaire)",
      "Spatial & Vector Match (94% overlap with UP-PWD-2025-44)",
      "Voucher Splitting (3 consecutive ₹4.98L payments to same vendor)"
    ],
    financialExposure: "₹45,00,000 (100% of Sanctioned Value)",
    recommendedAction: "Freeze Disbursement & Issue Show-Cause Notice to Executing Agency"
  },
  milestonesTimeline: [
    { title: "MP Recommendation Received", date: "12 Apr 2026", status: "COMPLETED", verifiedBy: "MP Secretariat" },
    { title: "District Technical Sanction", date: "18 May 2026", status: "COMPLETED", verifiedBy: "Executive Engineer (VMC)" },
    { title: "Tender Awarded to M/s Surya Infra", date: "10 Jun 2026", status: "COMPLETED", verifiedBy: "Purchase Committee" },
    { title: "Tranche 1 Disbursed (50%)", date: "25 Jun 2026", status: "COMPLETED", amount: "₹22,50,000" },
    { title: "AI Sentinel Vector Flag Raised", date: "02 Sep 2026", status: "FLAGGED", note: "Matched with UPREDA Scheme" },
    { title: "Tranche 2 Disbursement (50%)", date: "Pending", status: "FROZEN", amount: "₹22,50,000" }
  ],
  contractorInfo: {
    companyName: "M/s Surya Infra Tech Pvt Ltd",
    gstin: "09AAACS9012F1Z8",
    pan: "AAACS9012F",
    registeredAddress: "Plot 42, Industrial Area, Ramnagar, Varanasi (UP)",
    totalMPLADSShare: "42% of Varanasi Solar Lighting Contracts",
    riskRating: "HIGH RISK VENDOR (Clustering detected)"
  }
};
