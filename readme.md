# MPLADS Sentinel

AI-assisted monitoring and risk analysis platform for MPLADS (Members of Parliament Local Area Development Scheme) projects.

MPLADS Sentinel ingests project and expenditure data from the eSAKSHI ecosystem, normalizes it into a relational data model, evaluates projects for potential risk signals, and exposes the results through REST APIs and role-oriented dashboards.

The current MVP focuses on explainable project-level risk assessment rather than attempting to automate government audit decisions.

---

## 1. What is MPLADS Sentinel?

MPLADS projects pass through multiple stages:

Recommendation → Sanction → Progress → Payment → Completion

MPLADS Sentinel uses information available across these stages to identify projects that may deserve additional human review.

The system currently focuses on:

- Project and expenditure ingestion
- Project lifecycle tracking
- Cross-stage rule checks
- Cost anomaly detection
- Duplicate/overlap detection
- Composite project risk scoring
- Explainable risk reasons
- Tier-based risk classification
- Ministry and District dashboards
- Project-level investigation
- Duplicate candidate review
- Cost anomaly review

The platform is designed as a **decision-support and monitoring system**.

It does not automatically declare a project fraudulent or irregular.

---

# 2. Current MVP

The current implementation contains the following major layers:

```text
eSAKSHI / Project Data
        │
        ▼
Data Ingestion
        │
        ▼
Normalization
        │
        ▼
PostgreSQL + Prisma
        │
        ├───────────────┐
        │               │
        ▼               ▼
   Python ML Layer   REST API
        │               │
        ▼               ▼
 Risk Assessment    Express Backend
        │               │
        └───────┬───────┘
                │
                ▼
          React Frontend
                │
        ┌───────┴────────┐
        ▼                ▼
 Ministry Dashboard   District Dashboard