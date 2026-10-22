"""
GNews API Client Integration for TruthLens.
Retrieves recent, verified news coverage and normalizes into structured evidence.
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional
import urllib.parse
import httpx

from app.core.config import Settings, get_settings
from app.schemas.report import EvidenceItem, SourceTypeEnum

logger = logging.getLogger(__name__)


class GNewsClient:
    """Client for GNews API v4."""

    BASE_URL = "https://gnews.io/api/v4/search"

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.api_key = self.settings.GNEWS_API_KEY
        self.has_key = self.settings.has_gnews_key

    async def search_news(self, query: str, max_results: int = 5) -> List[EvidenceItem]:
        """
        Query GNews for related articles and normalize into EvidenceItem objects.
        """
        clean_query = query.strip()
        if not clean_query:
            return []

        if not self.has_key:
            if self.settings.ENABLE_MOCK_FALLBACK:
                return self._mock_news_response(clean_query)
            logger.info("GNEWS_API_KEY is not configured; skipping news retrieval.")
            return []

        params = {
            "q": clean_query,
            "lang": "en",
            "max": str(max_results),
            "token": self.api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(self.BASE_URL, params=params)

                if response.status_code == 429:
                    logger.info("GNews API rate limit (429); retrying in 1.1s...")
                    await asyncio.sleep(1.1)
                    response = await client.get(self.BASE_URL, params=params)

            if response.status_code == 429:
                logger.warning("GNews API rate limit exceeded after retry.")
                return []
            if response.status_code in (401, 403):
                logger.warning("GNews API authentication failed (HTTP %s). Check GNEWS_API_KEY.", response.status_code)
                return []
            if response.status_code != 200:
                logger.warning("GNews API returned error HTTP %s: %s", response.status_code, response.text[:200])
                return []

            data = response.json()
            articles = data.get("articles", [])
            evidence_items: List[EvidenceItem] = []

            for idx, art in enumerate(articles, 1):
                source_name = art.get("source", {}).get("name", "News Publisher")
                title = art.get("title", "")
                url = art.get("url", "")
                snippet = art.get("description", "") or art.get("content", "")

                if not url or not title:
                    continue

                evidence_items.append(
                    EvidenceItem(
                        id=f"GNEWS-{idx:02d}",
                        source_name=source_name,
                        source_type=SourceTypeEnum.NEWS_REPORTING,
                        title=title,
                        snippet=snippet[:400],
                        url=url,
                        published_date=art.get("publishedAt"),
                    )
                )

            return evidence_items

        except httpx.TimeoutException:
            logger.warning("GNews API request timed out.")
            return []
        except Exception as exc:
            logger.warning("GNews API request failed unexpectedly: %s", exc)
            return []

    def _mock_news_response(self, query: str) -> List[EvidenceItem]:
        """Deterministic mock news items when API key is not configured."""
        return [
            EvidenceItem(
                id="GNEWS-MOCK-01",
                source_name="Associated Press Wire",
                source_type=SourceTypeEnum.NEWS_REPORTING,
                title=f"Wire dispatch regarding '{query[:50]}'",
                snippet=f"Independent correspondents reporting on developments related to {query[:60]} with on-the-record statements.",
                url="https://apnews.com/article/mock-dispatch-archive",
                published_date="2026-10-20T12:00:00Z"
            ),
            EvidenceItem(
                id="GNEWS-MOCK-02",
                source_name="Reuters Archive",
                source_type=SourceTypeEnum.NEWS_REPORTING,
                title=f"Verification records: context and background for '{query[:45]}'",
                snippet=f"Government registers and commercial industry logs offer corroborating background data on {query[:50]}.",
                url="https://www.reuters.com/fact-check/mock-archive-log",
                published_date="2026-10-19T16:30:00Z"
            )
        ]
