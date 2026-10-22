"""Evidence retrieval across GNews and Google Fact Check APIs."""

import asyncio
import logging
import re
from typing import Dict, List, Optional, Set
import urllib.parse

from app.integrations.factcheck_client import FactCheckClient
from app.integrations.gnews_client import GNewsClient
from app.schemas.report import EvidenceItem, ExtractedClaim

logger = logging.getLogger(__name__)


class EvidenceRetriever:
    def __init__(
        self,
        gnews_client: Optional[GNewsClient] = None,
        factcheck_client: Optional[FactCheckClient] = None,
    ):
        self.gnews_client = gnews_client or GNewsClient()
        self.factcheck_client = factcheck_client or FactCheckClient()

    async def retrieve_evidence(
        self,
        claims: List[ExtractedClaim],
        article_title: str = "",
        max_total_sources: int = 10,
    ) -> List[EvidenceItem]:
        queries: List[str] = []
        if article_title and len(article_title) > 8:
            queries.append(self._clean_query(article_title))

        for claim in claims[:3]:
            cq = self._formulate_claim_query(claim.claim_text, claim.entity)
            if cq and cq not in queries:
                queries.append(cq)

        if not queries:
            queries = ["current news claims"]

        tasks = []
        for q in queries[:3]:
            tasks.append(self.factcheck_client.search_fact_checks(q, max_results=3))
            tasks.append(self.gnews_client.search_news(q, max_results=3))

        results_lists = await asyncio.gather(*tasks, return_exceptions=True)

        raw_items: List[EvidenceItem] = []
        for res in results_lists:
            if isinstance(res, list):
                raw_items.extend(res)
            elif isinstance(res, Exception):
                logger.warning("Evidence search branch failed: %s", res)

        deduplicated = self._deduplicate_evidence(raw_items)

        fact_checks = [e for e in deduplicated if e.source_type.value == "fact_check"]
        news_articles = [e for e in deduplicated if e.source_type.value != "fact_check"]

        combined = fact_checks + news_articles
        final_list = combined[:max_total_sources]

        for idx, item in enumerate(final_list, 1):
            item.id = f"EVD-{idx:02d}"

        return final_list

    def _formulate_claim_query(self, claim_text: str, entity: str = "") -> str:
        clean = re.sub(r"[^\w\s]", " ", claim_text)
        stopwords = {
            "a", "an", "the", "and", "or", "in", "on", "at", "to", "for",
            "is", "are", "was", "were", "been", "by", "that", "this", "it",
            "from", "with", "as", "about", "into", "through", "after", "before",
            "has", "have", "had", "will", "would", "could", "should", "claims", "alleges"
        }
        tokens = [w for w in clean.split() if len(w) > 3 and w.lower() not in stopwords]

        if entity and len(entity) > 2 and entity.lower() not in [t.lower() for t in tokens]:
            tokens = [entity] + tokens

        selected = tokens[:6]
        return " ".join(selected).strip()

    def _clean_query(self, text: str) -> str:
        clean = re.sub(r"\s+[|\-–—]\s+.*$", "", text)
        clean = re.sub(r"[^\w\s]", " ", clean)
        words = clean.split()
        return " ".join(words[:6]).strip()

    def _deduplicate_evidence(self, items: List[EvidenceItem]) -> List[EvidenceItem]:
        seen_urls: Set[str] = set()
        seen_titles: Set[str] = set()
        deduped: List[EvidenceItem] = []

        for item in items:
            canonical_url = self._canonicalize_url(item.url)
            norm_title = re.sub(r"\W+", "", item.title.lower())[:40]

            if canonical_url and canonical_url in seen_urls:
                continue
            if norm_title and norm_title in seen_titles:
                continue

            if canonical_url:
                seen_urls.add(canonical_url)
            if norm_title:
                seen_titles.add(norm_title)

            deduped.append(item)

        return deduped

    def _canonicalize_url(self, url: str) -> str:
        if not url:
            return ""
        try:
            parsed = urllib.parse.urlparse(url)
            netloc = parsed.netloc.lower()
            if netloc.startswith("www."):
                netloc = netloc[4:]
            path = parsed.path.rstrip("/")
            return f"{netloc}{path}"
        except Exception:
            return url.strip().lower()
