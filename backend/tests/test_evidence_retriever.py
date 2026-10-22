"""Tests for evidence retriever."""

from unittest.mock import AsyncMock
import pytest

from app.integrations.factcheck_client import FactCheckClient
from app.integrations.gnews_client import GNewsClient
from app.schemas.report import EvidenceItem, SourceTypeEnum
from app.services.evidence_retriever import EvidenceRetriever

@pytest.mark.asyncio
async def test_evidence_retriever_deduplication(sample_claims):
    """Retriever must deduplicate sources with identical URLs or tracking parameters."""
    mock_gnews = AsyncMock(spec=GNewsClient)
    mock_factcheck = AsyncMock(spec=FactCheckClient)

    # Return duplicate URLs with different tracking query params
    mock_gnews.search_news.return_value = [
        EvidenceItem(
            id="RAW-01",
            source_name="Reuters",
            source_type=SourceTypeEnum.NEWS_REPORTING,
            title="Monetary Authority Statement on Rates",
            snippet="Snippet text",
            url="https://reuters.com/article/monetary-rates?utm_source=twitter&utm_medium=social"
        ),
        EvidenceItem(
            id="RAW-02",
            source_name="Reuters Wire",
            source_type=SourceTypeEnum.NEWS_REPORTING,
            title="Monetary Authority Statement on Rates",
            snippet="Identical story from reuters",
            url="https://reuters.com/article/monetary-rates?utm_source=facebook"
        )
    ]

    mock_factcheck.search_fact_checks.return_value = [
        EvidenceItem(
            id="FC-01",
            source_name="PolitiFact",
            source_type=SourceTypeEnum.FACT_CHECK,
            title="Fact-Check: Rates were not cut by 50 percent",
            snippet="Rating: False",
            url="https://politifact.com/factchecks/rates-claim"
        )
    ]

    retriever = EvidenceRetriever(gnews_client=mock_gnews, factcheck_client=mock_factcheck)
    evidence = await retriever.retrieve_evidence(sample_claims, article_title="Interest Rates")

    # The 2 duplicate Reuters articles must be deduped into 1
    assert len(evidence) == 2
    urls = [e.url for e in evidence]
    assert len(urls) == 2
    assert evidence[0].id == "EVD-01"
    assert evidence[1].id == "EVD-02"

@pytest.mark.asyncio
async def test_evidence_retriever_handles_api_failures(sample_claims):
    """Retriever must handle API errors/timeouts gracefully without crashing."""
    mock_gnews = AsyncMock(spec=GNewsClient)
    mock_factcheck = AsyncMock(spec=FactCheckClient)

    # Simulate GNews returning empty and FactCheck throwing an exception
    mock_gnews.search_news.return_value = []
    mock_factcheck.search_fact_checks.side_effect = Exception("API rate limit exceeded")

    retriever = EvidenceRetriever(gnews_client=mock_gnews, factcheck_client=mock_factcheck)
    evidence = await retriever.retrieve_evidence(sample_claims, article_title="Sample Title")

    # Should not crash; returns empty list
    assert isinstance(evidence, list)
    assert len(evidence) == 0
