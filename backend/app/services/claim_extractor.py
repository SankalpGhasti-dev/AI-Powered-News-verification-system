"""Factual claim extraction service."""

import logging
from typing import List, Optional
from pydantic import ValidationError

from app.integrations.gemini_client import GeminiClient
from app.schemas.report import ExtractedClaim

logger = logging.getLogger(__name__)


class ClaimExtractor:
    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.gemini_client = gemini_client or GeminiClient()

    async def extract_claims(self, article_text: str, title: str = "") -> List[ExtractedClaim]:
        raw_result = await self.gemini_client.extract_factual_claims(article_text, title=title)
        raw_claims = raw_result.get("claims", [])

        extracted: List[ExtractedClaim] = []

        for idx, item in enumerate(raw_claims, 1):
            claim_id = item.get("id") or f"CLM-{idx:02d}"
            claim_text = item.get("claim_text") or item.get("text") or ""
            entity = item.get("entity") or title or "Subject"
            category = item.get("category") or "factual_assertion"

            if not claim_text.strip():
                continue

            try:
                claim = ExtractedClaim(
                    id=claim_id,
                    claim_text=claim_text.strip(),
                    entity=entity.strip(),
                    category=category.strip()
                )
                extracted.append(claim)
            except ValidationError as err:
                logger.warning("Claim validation failed for item %s: %s", item, err)

        if not extracted:
            fallback_text = article_text[:200].strip()
            extracted.append(
                ExtractedClaim(
                    id="CLM-01",
                    claim_text=fallback_text or "Article core assertion.",
                    entity=title or "Article Subject",
                    category="factual_assertion"
                )
            )

        return extracted[:5]
