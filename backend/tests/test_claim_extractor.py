"""Tests for claim extractor."""

from unittest.mock import AsyncMock
import pytest

from app.integrations.gemini_client import GeminiClient
from app.schemas.report import ExtractedClaim
from app.services.claim_extractor import ClaimExtractor

@pytest.mark.asyncio
async def test_claim_extractor_with_mock_client():
    """Claim extractor extracts structured ExtractedClaim objects."""
    mock_gemini = AsyncMock(spec=GeminiClient)
    mock_gemini.extract_factual_claims.return_value = {
        "summary": "Article reports on inflation figures.",
        "claims": [
            {
                "id": "CLM-01",
                "claim_text": "Consumer inflation reached 12 percent in September.",
                "entity": "Statistics Bureau",
                "category": "statistic"
            },
            {
                "id": "CLM-02",
                "claim_text": "Central Bank announced rate cuts for next quarter.",
                "entity": "Central Bank",
                "category": "policy"
            }
        ]
    }

    extractor = ClaimExtractor(gemini_client=mock_gemini)
    claims = await extractor.extract_claims("Sample article body text.", title="Inflation Report")

    assert len(claims) == 2
    assert isinstance(claims[0], ExtractedClaim)
    assert claims[0].id == "CLM-01"
    assert "12 percent" in claims[0].claim_text
    assert claims[1].id == "CLM-02"

@pytest.mark.asyncio
async def test_claim_extractor_handles_malformed_ai_output():
    """Claim extractor falls back gracefully when AI returns malformed or empty data."""
    mock_gemini = AsyncMock(spec=GeminiClient)
    # Simulate malformed output
    mock_gemini.extract_factual_claims.return_value = {
        "invalid_key": "No claims here"
    }

    extractor = ClaimExtractor(gemini_client=mock_gemini)
    article_text = "Prime Minister announced a major emergency decree today regarding national power grids."
    claims = await extractor.extract_claims(article_text, title="Energy Crisis")

    assert len(claims) >= 1
    assert isinstance(claims[0], ExtractedClaim)
    assert "CLM-01" == claims[0].id
    assert "Prime Minister announced" in claims[0].claim_text

@pytest.mark.asyncio
async def test_claim_extractor_fallback_mode_without_keys():
    """Default ClaimExtractor operates smoothly in mock fallback mode when no API keys are present."""
    extractor = ClaimExtractor()  # Uses default client with fallback enabled
    text = (
        "Officials reported record renewable energy generation this spring. "
        "Wind and solar installations supplied 45 percent of domestic demand according to grid logs."
    )
    claims = await extractor.extract_claims(text, title="Renewable Energy Record")

    assert len(claims) >= 1
    assert all(isinstance(c, ExtractedClaim) for c in claims)
    assert all(c.id.startswith("CLM-") for c in claims)
