"""Coordinates verification pipeline and compiles investigation reports."""

from datetime import datetime, timezone
import logging
import uuid
from typing import Optional

from app.schemas.investigation import InvestigationRequest
from app.schemas.report import (
    ArticleMetadata,
    InvestigationMetrics,
    InvestigationReport,
    VerdictEnum,
)
from app.services.article_processor import ArticleProcessor
from app.services.claim_extractor import ClaimExtractor
from app.services.credibility_scorer import CredibilityScorer
from app.services.evidence_retriever import EvidenceRetriever
from app.services.explanation_engine import ExplanationEngine
from app.services.verification_engine import VerificationEngine

logger = logging.getLogger(__name__)


class InvestigationReportGenerator:
    def __init__(
        self,
        article_processor: Optional[ArticleProcessor] = None,
        claim_extractor: Optional[ClaimExtractor] = None,
        evidence_retriever: Optional[EvidenceRetriever] = None,
        verification_engine: Optional[VerificationEngine] = None,
        credibility_scorer: Optional[CredibilityScorer] = None,
        explanation_engine: Optional[ExplanationEngine] = None,
    ):
        self.article_processor = article_processor or ArticleProcessor()
        self.claim_extractor = claim_extractor or ClaimExtractor()
        self.evidence_retriever = evidence_retriever or EvidenceRetriever()
        self.verification_engine = verification_engine or VerificationEngine()
        self.credibility_scorer = credibility_scorer or CredibilityScorer()
        self.explanation_engine = explanation_engine or ExplanationEngine()

    async def run_investigation(self, request: InvestigationRequest) -> InvestigationReport:
        investigation_id = f"INV-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        timestamp = datetime.now(timezone.utc).isoformat()

        logger.info("Starting investigation %s for type=%s", investigation_id, request.input_type.value)

        processed_article = await self.article_processor.process_input(request)

        claims = await self.claim_extractor.extract_claims(
            article_text=processed_article.text,
            title=processed_article.title
        )

        evidence_items = await self.evidence_retriever.retrieve_evidence(
            claims=claims,
            article_title=processed_article.title
        )

        verified_claims = self.verification_engine.verify_claims(
            claims=claims,
            evidence=evidence_items
        )

        score = self.credibility_scorer.calculate_score(
            claims=verified_claims,
            evidence=evidence_items
        )

        explanation = await self.explanation_engine.generate_explanation(
            article_title=processed_article.title,
            claims=verified_claims,
            evidence=evidence_items,
            score=score
        )

        total_claims = len(verified_claims)
        supported_count = sum(1 for c in verified_claims if c.verdict == VerdictEnum.SUPPORTED)
        contradicted_count = sum(1 for c in verified_claims if c.verdict == VerdictEnum.CONTRADICTED)
        mixed_count = sum(1 for c in verified_claims if c.verdict == VerdictEnum.MIXED)
        insufficient_count = sum(1 for c in verified_claims if c.verdict == VerdictEnum.INSUFFICIENT_EVIDENCE)
        unique_sources = len({e.source_name.strip().lower() for e in evidence_items if e.source_name})

        metrics = InvestigationMetrics(
            total_claims=total_claims,
            supported_claims=supported_count,
            contradicted_claims=contradicted_count,
            mixed_claims=mixed_count,
            insufficient_evidence_claims=insufficient_count,
            sources_consulted=len(evidence_items),
        )

        article_meta = ArticleMetadata(
            title=processed_article.title,
            url=processed_article.url,
            word_count=processed_article.word_count,
            snippet=processed_article.summary
        )

        return InvestigationReport(
            investigation_id=investigation_id,
            timestamp=timestamp,
            input_type=request.input_type.value if hasattr(request.input_type, "value") else str(request.input_type),
            article=article_meta,
            claims=verified_claims,
            evidence=evidence_items,
            credibility_score=score,
            explanation=explanation,
            metrics=metrics,
            limitations=explanation.limitations
        )
