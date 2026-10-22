"""
Google Fact Check Tools API Client Integration for TruthLens.
Searches public fact-checks from verified international newsrooms.
"""

import logging
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import Settings, get_settings
from app.schemas.report import EvidenceItem, SourceTypeEnum

logger = logging.getLogger(__name__)


class FactCheckClient:
    """Client for Google Fact Check Tools API."""

    BASE_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search"

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.api_key = self.settings.FACTCHECK_API_KEY
        self.has_key = self.settings.has_factcheck_key

    async def search_fact_checks(self, query: str, max_results: int = 5) -> List[EvidenceItem]:
        """
        Search Google Fact Check Tools API and normalize into EvidenceItem objects.
        """
        clean_query = query.strip()
        if not clean_query:
            return []

        if not self.has_key:
            if self.settings.ENABLE_MOCK_FALLBACK:
                return self._mock_factcheck_response(clean_query)
            logger.info("FACTCHECK_API_KEY is not configured; skipping fact-check retrieval.")
            return []

        params = {
            "query": clean_query,
            "key": self.api_key,
            "pageSize": str(max_results)
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(self.BASE_URL, params=params)

            if response.status_code == 429:
                logger.warning("Fact Check API rate limit exceeded (HTTP 429).")
                return []
            if response.status_code in (401, 403):
                logger.warning("Fact Check API authentication failed (HTTP %s). Check FACTCHECK_API_KEY.", response.status_code)
                return []
            if response.status_code != 200:
                logger.warning("Fact Check API returned HTTP %s: %s", response.status_code, response.text[:200])
                return []

            data = response.json()
            claims = data.get("claims", [])
            evidence_items: List[EvidenceItem] = []
            item_count = 0

            for claim in claims:
                claim_text = claim.get("text", "")
                for review in claim.get("claimReview", []):
                    item_count += 1
                    publisher = review.get("publisher", {}).get("name", "Independent Fact-Checker")
                    title = review.get("title") or f"Fact Check: {claim_text[:60]}"
                    url = review.get("url", "")
                    rating = review.get("textualRating", "Evaluated")
                    review_date = review.get("reviewDate")

                    if not url:
                        continue

                    evidence_items.append(
                        EvidenceItem(
                            id=f"FACTCHECK-{item_count:02d}",
                            source_name=publisher,
                            source_type=SourceTypeEnum.FACT_CHECK,
                            title=title,
                            snippet=f"Rating: {rating}. Review of claim: '{claim_text}'",
                            url=url,
                            published_date=review_date,
                            claim_reviewed=claim_text,
                            review_rating=rating
                        )
                    )

                    if len(evidence_items) >= max_results:
                        return evidence_items

            return evidence_items

        except httpx.TimeoutException:
            logger.warning("Fact Check Tools API request timed out.")
            return []
        except Exception as exc:
            logger.warning("Fact Check Tools API request failed unexpectedly: %s", exc)
            return []

    def _mock_factcheck_response(self, query: str) -> List[EvidenceItem]:
        """Deterministic mock fact-check items when API key is not configured."""
        return [
            EvidenceItem(
                id="FACTCHECK-MOCK-01",
                source_name="PolitiFact Verification Desk",
                source_type=SourceTypeEnum.FACT_CHECK,
                title=f"Review of claim related to '{query[:45]}'",
                snippet=f"Fact-checking organization investigated claim '{query[:50]}' against official government registers and archival data.",
                url="https://www.politifact.com/factchecks/mock-claim-review",
                published_date="2026-10-18T10:00:00Z",
                claim_reviewed=query[:80],
                review_rating="Mostly False" if "fake" in query.lower() or "rumor" in query.lower() else "Needs Context"
            )
        ]
