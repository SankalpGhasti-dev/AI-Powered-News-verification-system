# TruthLens V1 — Backend Engine

TruthLens is an AI-powered news and claim verification backend. It analyzes news article URLs or pasted claims by extracting atomic factual assertions, cross-referencing them against independent news wire archives (via GNews API) and registered fact-checks (via Google Fact Check Tools API), computing a transparent 0–100 credibility score using an explicit mathematical formula, and synthesizing an objective editorial explanation using Google Gemini.

---

## 1. Architecture Overview

TruthLens is built around a modular pipeline:

1. **Input Validation (`app/schemas/investigation.py`)**  
   Accepts and validates either `url` or `text` input. Rejects empty content and enforces safe length limits (15 to 50,000 characters for text; up to 2,048 characters for URLs).
2. **Article Extraction & SSRF Protection (`app/services/article_processor.py`, `app/core/ssrf.py`)**  
   Extracts headlines and clean body text from web pages using BeautifulSoup4, stripping script and layout tags.
   - **SSRF Defense**: Validates URL schemes, blocks private/loopback/cloud metadata IP ranges, and enforces response caps and timeouts.
3. **Claim Extraction (`app/services/claim_extractor.py`)**  
   Identifies 2 to 5 falsifiable atomic claims using Gemini structured JSON mode without premature truth evaluation.
4. **Evidence Retrieval (`app/services/evidence_retriever.py`)**  
   Queries Google Fact Check Tools API and GNews API concurrently. Normalizes and deduplicates articles and verified fact-checks.
5. **Claim Verification (`app/services/verification_engine.py`)**  
   Evaluates claims against retrieved evidence items, assigning one of four verdicts: `Supported`, `Contradicted`, `Mixed`, or `Insufficient Evidence`.
6. **Credibility Scoring (`app/services/credibility_scorer.py`)**  
   Calculates an explicit, weighted score from 0 to 100 based on claim verdicts, evidence quality, and coverage ratio.
7. **Explanation Synthesis (`app/services/explanation_engine.py`)**  
   Generates a neutral editorial summary grounded strictly in the verified claims and retrieved evidence records.
8. **Report Generator (`app/services/report_generator.py`)**  
   Coordinates the pipeline end-to-end and returns a structured `InvestigationReport` dossier.

---

## 2. Directory Structure

```text
backend/
├── .env.example              # Environment variables template
├── .gitignore                # Protects secrets, venvs, and cache files
├── pytest.ini                # Pytest async configuration
├── requirements.txt          # Minimal Python dependencies
├── README.md                 # Backend documentation
├── app/
│   ├── __init__.py
│   ├── main.py               # FastAPI entry point & CORS configuration
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py     # GET /api/v1/health
│   │       └── investigations.py # POST /api/v1/investigations
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py         # App settings & environment reader
│   │   ├── errors.py         # Custom exception hierarchy
│   │   └── ssrf.py           # SSRF defense & safe HTTP fetching
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── investigation.py  # Input request schemas & validators
│   │   └── report.py         # Output dossier schemas & enums
│   ├── services/
│   │   ├── __init__.py
│   │   ├── article_processor.py
│   │   ├── claim_extractor.py
│   │   ├── evidence_retriever.py
│   │   ├── verification_engine.py
│   │   ├── credibility_scorer.py
│   │   ├── explanation_engine.py
│   │   └── report_generator.py
│   └── integrations/
│       ├── __init__.py
│       ├── gemini_client.py
│       ├── gnews_client.py
│       └── factcheck_client.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_health.py
    ├── test_input_and_article_processor.py
    ├── test_ssrf_protection.py
    ├── test_claim_extractor.py
    ├── test_evidence_retriever.py
    ├── test_verification_and_scoring.py
    ├── test_explanation_and_report.py
    └── test_investigations_api.py
```

---

## 3. Setup and Installation

### Step 1: Create a Python Virtual Environment

```bash
# Navigate to the backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On macOS / Linux:
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configuring API Keys

API keys are read exclusively from environment variables on the backend. **They are never committed to git or exposed to the frontend.**

1. Copy the example template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your keys:
   ```env
   # Google Gemini API Key
   # https://aistudio.google.com/
   GEMINI_API_KEY=your_actual_gemini_api_key_here

   # GNews API Key
   # https://gnews.io/
   GNEWS_API_KEY=your_actual_gnews_api_key_here

   # Google Fact Check Tools API Key
   # https://console.cloud.google.com/apis/library/factchecktools.googleapis.com
   FACTCHECK_API_KEY=your_actual_factcheck_api_key_here
   ```

*Note: If API keys are omitted or kept as placeholder values, TruthLens operates in **Mock Fallback Mode** (`ENABLE_MOCK_FALLBACK=true`), returning representative mock records and heuristic synthesis so development and frontend testing can proceed without API costs or keys.*

---

## 5. Running the Application

### Development Server (with Auto-Reload)

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at:
- **Root Info:** `http://127.0.0.1:8000/`
- **Health Check:** `http://127.0.0.1:8000/api/v1/health`
- **Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`

---

## 6. API Reference

### Health Check

`GET /api/v1/health`

**Response (`200 OK`):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "service": "TruthLens API",
  "integrations": {
    "gemini": "configured",
    "gnews": "configured",
    "factcheck": "configured"
  }
}
```

---

### Start Investigation

`POST /api/v1/investigations`

#### Option A: Investigating a URL
```json
{
  "input_type": "url",
  "content": "https://example.com/news/economic-report"
}
```

#### Option B: Investigating Pasted Text
```json
{
  "input_type": "text",
  "content": "A viral post claims that the Central Bank confirmed a 35% single-month surge in headline consumer inflation."
}
```

#### Sample Successful Response (`200 OK`):
```json
{
  "investigation_id": "INV-20261021-99B7D1",
  "timestamp": "2026-10-21T18:20:42.642909+00:00",
  "input_type": "text",
  "article": {
    "title": "A viral post claims that the Central Bank confirmed a 35% single-month surge in headline consumer inflation.",
    "url": null,
    "word_count": 18,
    "summary": "A viral post claims that the Central Bank confirmed a 35% single-month surge in headline consumer inflation."
  },
  "credibility_score": {
    "score": 18,
    "rating_label": "Fabricated / Heavily Refuted",
    "confidence": "High",
    "formula_breakdown": {
      "total_claims": 1,
      "supported_claims": 0,
      "contradicted_claims": 1,
      "mixed_claims": 0,
      "insufficient_claims": 0,
      "coverage_ratio": 1.0,
      "verdict_balance": -1.0,
      "sources_consulted": 2
    },
    "disclaimer": "This score measures the extent to which claims are corroborated or contradicted by currently retrieved public records, wire reports, and verified fact-checks. It measures evidentiary support, not the absolute philosophical certainty of truth."
  },
  "claims": [
    {
      "claim_id": "CLM-01",
      "claim_text": "Central Bank confirmed a 35% single-month surge in headline consumer inflation",
      "verdict": "Contradicted",
      "verdict_rationale": "Contradicted by documented record from Reuters Fact Check Wire (rated 'False').",
      "supporting_evidence_ids": [],
      "contradicting_evidence_ids": ["EVD-01"],
      "confidence": "High"
    }
  ],
  "evidence": [
    {
      "id": "EVD-01",
      "source_name": "Reuters Fact Check Wire",
      "source_type": "fact_check",
      "title": "Fact Check: Central Bank did not confirm 35% inflation spike",
      "snippet": "Rating: False. Official gazette records show monthly inflation adjusted by 0.3%.",
      "url": "https://www.reuters.com/fact-check/mock-archive-log",
      "published_date": "2026-10-19T16:30:00Z",
      "claim_reviewed": "Central Bank confirmed a 35% single-month surge",
      "review_rating": "False"
    }
  ],
  "explanation": {
    "summary": "TruthLens evaluated 1 claim(s). Documented records directly refute the assertion, yielding an overall credibility score of 18/100 (Fabricated / Heavily Refuted).",
    "key_findings": [
      "1 claim(s) directly contradicted by independent records or fact-checks."
    ],
    "evidence_synthesis": "Out of 1 consulted source record(s), 0 claim(s) found supporting documentation and 1 claim(s) encountered contradicting evidence.",
    "limitations": [
      "Verification is restricted to open-source public reporting and registered fact-check databases.",
      "Lack of documentation does not by itself prove a statement is false, but reflects unverified status."
    ]
  },
  "metrics": {
    "total_claims": 1,
    "supported_claims": 0,
    "contradicted_claims": 1,
    "mixed_claims": 0,
    "insufficient_evidence_claims": 0,
    "sources_consulted": 1
  },
  "limitations": [
    "Verification is restricted to open-source public reporting and registered fact-check databases.",
    "Lack of documentation does not by itself prove a statement is false, but reflects unverified status.",
    "Real-time breaking events may not yet have complete authoritative coverage."
  ]
}
```

---

## 7. Automated Test Suite

TruthLens includes an automated test suite with **34 test cases** covering all eight modules, SSRF vectors, error cases, and API endpoints.

To run the test suite:

```bash
# Run all tests
python -m pytest backend/tests

# Run tests with verbose output
python -m pytest backend/tests -v
```

### Test Suite Breakdown

| Test File | Tests | Focus Area |
|:---|:---:|:---|
| `test_health.py` | 2 | `/api/v1/health` status, integration indicators, root `/` endpoint |
| `test_ssrf_protection.py` | 8 | Blocks IPv4 loopback (`127.0.0.1`), IPv6 loopback (`::1`), `localhost`, cloud metadata (`169.254.169.254`), private RFC1918 subnets, non-HTTP schemes (`file://`, `ftp://`), pre-network blocking |
| `test_input_and_article_processor.py` | 7 | Empty inputs, text under 15 chars, text over 50,000 chars, invalid URL schemes, text processing, BS4 HTML cleaning, empty page error |
| `test_claim_extractor.py` | 3 | Gemini JSON claim extraction, Pydantic validation, malformed AI output fallback, zero-key fallback |
| `test_evidence_retriever.py` | 2 | GNews and FactCheck normalization, deduplication by canonical URL & query params, API failure/timeout resilience |
| `test_verification_and_scoring.py` | 4 | Corroborated claims $\rightarrow$ `Supported` & high score ($\ge 80$); refuted claims $\rightarrow$ `Contradicted` & low score ($\le 25$); `Mixed` reporting; **Insufficient evidence maintains neutral baseline (50) rather than falsely accusing claims of being disproven** |
| `test_explanation_and_report.py` | 3 | Gemini grounded explanation adopting backend score, deterministic synthesis fallback on AI failure, full report generation |
| `test_investigations_api.py` | 5 | End-to-end `POST /api/v1/investigations` with text input, SSRF blocking, cloud metadata blocking, rejection of empty/short inputs |

**Result:** **34 passed in 0.20s** (100% pass rate).
