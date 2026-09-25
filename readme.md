# MPLADS Sentinel

AI-assisted monitoring and risk analysis platform for MPLADS (Members of Parliament Local Area Development Scheme) projects.

## Overview

MPLADS Sentinel ingests project and expenditure data from the eSAKSHI ecosystem, normalizes it into a relational data model, evaluates projects for potential risk signals, and exposes the results through REST APIs and role-oriented dashboards.


### Features

- 🇮🇳 Pan-India MPLADS ingestion (36 States & UTs)
- 🤖 ML Risk Scoring (Tier 1 / Tier 2 / Clean)
- 🔍 Duplicate Work Detection
- 💰 Cost Anomaly Detection
- 📈 Benford's Law Forensic Analysis
- 📊 Ministry Dashboard & REST APIs
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
- Benford Analysis
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

## Architecture

```text
eSAKSHI APIs
      │
      ▼
TypeScript Ingestion
      │
      ▼
PostgreSQL + Prisma
      │
      ├── Python ML Layer
      ├── Benford Analysis
      ▼
Express REST API
      ▼
React + Vite Dashboard
```

---


## Tech Stack

| Layer | Technologies |
|--------|--------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma |
| ML Layer | Python, Pandas, NumPy, SciPy |

---

## Local Setup

### 1. Backend

```bash
cd backend
npm install
npx prisma migrate reset
```

Create `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mplad_db"
PORT=4000
```

### 2. ML Layer

```bash
cd ../AnomalyLayer
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

---

## Data & Analytics Pipeline

```bash
# Pan-India ingestion
npm run esakshi:ingest

# Expenditure records
npm run esakshi:ingest-expenditure

# ML anomaly detection
npm run risk:ml

# Benford forensic analysis
npm run benford
```

---

## REST APIs

| Endpoint | Purpose |
|----------|---------|
| `/api/summary` | Dashboard KPIs |
| `/api/projects` | Paginated projects |
| `/api/alerts` | High-risk alerts |
| `/api/benford` | Benford analysis |

Backend → `http://localhost:4000`  
Frontend → `http://localhost:3000`

---

## Dataset

- 36 States & Union Territories
- 110,000+ public works
- 35,000+ completed works
- Vendor & expenditure records
- Implementing agency metadata
- Citizen review signals (where available)

---

## Author

**Arnav Gandhi**  
      B.Tech COE, Thapar Institute of Engineering & Technology

> Academic project demonstrating AI-assisted detection of duplicate public works and financial irregularities using public MPLADS data.
