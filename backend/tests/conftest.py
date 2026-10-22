"""
Pytest configuration and fixtures for TruthLens backend tests.
"""

import os
import sys
from pathlib import Path
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Add app to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Ensure test environment variables are set before loading app
os.environ["APP_ENV"] = "testing"
os.environ["ENABLE_MOCK_FALLBACK"] = "true"
os.environ["GEMINI_API_KEY"] = ""
os.environ["GNEWS_API_KEY"] = ""
os.environ["FACTCHECK_API_KEY"] = ""

from app.main import app
from app.schemas.report import EvidenceItem, ExtractedClaim, SourceTypeEnum, VerdictEnum


@pytest_asyncio.fixture(loop_scope="function")
async def async_client():
    """Async client for testing FastAPI application."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest.fixture
def sample_news_html():
    """Sample valid news HTML page for testing ArticleProcessor."""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Central Bank Releases Q3 Economic Stabilization Plan - Financial Daily</title>
        <meta property="og:title" content="Central Bank Releases Q3 Economic Stabilization Plan">
    </head>
    <body>
        <nav><a href="/">Home</a><a href="/news">News</a></nav>
        <header><h1>Header Banner</h1></header>
        <article>
            <h1>Central Bank Releases Q3 Economic Stabilization Plan</h1>
            <p>The Monetary Authority announced yesterday a package of measures targeting inflation stabilization.</p>
            <p>Under the new directives, commercial reserve requirements will remain steady at 4.5 percent.</p>
            <p>Governor Sarah Jenkins stated that headline price growth moderated during the last fiscal quarter.</p>
        </article>
        <footer><p>Copyright 2026 Financial Daily. All rights reserved.</p></footer>
    </body>
    </html>
    """


@pytest.fixture
def sample_claims():
    """Sample extracted claims for testing."""
    return [
        ExtractedClaim(
            id="CLM-01",
            claim_text="Commercial reserve requirements will remain steady at 4.5 percent.",
            entity="Monetary Authority",
            category="policy"
        ),
        ExtractedClaim(
            id="CLM-02",
            claim_text="Governor stated headline price growth moderated during the last fiscal quarter.",
            entity="Governor Sarah Jenkins",
            category="quote"
        )
    ]


@pytest.fixture
def sample_supporting_evidence():
    """Evidence items that corroborate the sample claims."""
    return [
        EvidenceItem(
            id="EVD-01",
            source_name="Financial Times Wire",
            source_type=SourceTypeEnum.NEWS_REPORTING,
            title="Monetary Authority holds reserve ratio steady at 4.5 percent",
            snippet="Official briefing documents confirm commercial reserve requirements will remain at 4.5 percent.",
            url="https://ft.com/content/mock-archive-01",
            published_date="2026-10-20"
        ),
        EvidenceItem(
            id="EVD-02",
            source_name="Reuters Market Desk",
            source_type=SourceTypeEnum.NEWS_REPORTING,
            title="Governor Jenkins confirms price moderation in quarterly review",
            snippet="The Governor noted during Tuesday's press conference that quarterly headline inflation showed measurable slowing.",
            url="https://reuters.com/business/mock-archive-02",
            published_date="2026-10-20"
        )
    ]


@pytest.fixture
def sample_refuting_evidence():
    """Evidence items that refute claims (e.g. from fact checks)."""
    return [
        EvidenceItem(
            id="EVD-01",
            source_name="AFP Factuel",
            source_type=SourceTypeEnum.FACT_CHECK,
            title="Fact Check: Fabricated quote attributed to Governor regarding reserve rates",
            snippet="Rating: False. Official transcripts show no such emergency reserve changes were announced.",
            url="https://factcheck.afp.com/mock-refute-01",
            published_date="2026-10-21",
            claim_reviewed="Governor ordered 40 percent industrial reserve freeze",
            review_rating="False"
        )
    ]
