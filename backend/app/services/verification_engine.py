"""Evaluates claims against retrieved evidence items."""

import logging
import re
from typing import Dict, List, Set, Tuple

from app.schemas.report import (
    ClaimVerification,
    EvidenceItem,
    ExtractedClaim,
    SourceTypeEnum,
    VerdictEnum,
)

logger = logging.getLogger(__name__)

REFUTATION_KEYWORDS = {
    "false", "fake", "fabricated", "incorrect", "debunked", "hoax",
    "pants on fire", "refuted", "misleading", "misattributed", "unsubstantiated",
    "denies", "denied", "disproven", "counterfeit"
}

CORROBORATION_KEYWORDS = {
    "true", "correct", "accurate", "confirmed", "verified", "corroborated",
    "official statement confirms", "records show", "reports confirm"
}

class VerificationEngine:
    """Evaluates claims against evidence records to establish verified verdicts."""

    def verify_claims(
        self,
        claims: List[ExtractedClaim],
        evidence: List[EvidenceItem]
    ) -> List[ClaimVerification]:
        """
        Evaluate each claim against all retrieved evidence records.
        Returns a list of ClaimVerification results.
        """
        verifications: List[ClaimVerification] = []

        for claim in claims:
            supporting_ids: List[str] = []
            contradicting_ids: List[str] = []

            claim_tokens = self._extract_keywords(claim.claim_text)

            for item in evidence:
                relevance = self._compute_relevance(claim_tokens, item)
                if relevance < 0.2:
                    continue  # Irrelevant evidence item

                stance = self._determine_stance(claim, item)
                if stance == "contradicting":
                    contradicting_ids.append(item.id)
                elif stance == "supporting":
                    supporting_ids.append(item.id)

            # Determine verdict based on evidence balance
            verdict, rationale, confidence = self._assign_verdict(
                claim=claim,
                supporting_ids=supporting_ids,
                contradicting_ids=contradicting_ids,
                evidence_lookup={item.id: item for item in evidence}
            )

            verifications.append(
                ClaimVerification(
                    claim_id=claim.id,
                    claim_text=claim.claim_text,
                    verdict=verdict,
                    verdict_rationale=rationale,
                    supporting_evidence_ids=supporting_ids,
                    contradicting_evidence_ids=contradicting_ids,
                    confidence=confidence
                )
            )

        return verifications

    def _assign_verdict(
        self,
        claim: ExtractedClaim,
        supporting_ids: List[str],
        contradicting_ids: List[str],
        evidence_lookup: Dict[str, EvidenceItem]
    ) -> Tuple[VerdictEnum, str, str]:
        """Determine verdict, rationale, and confidence based on collected evidence."""
        has_support = len(supporting_ids) > 0
        has_contradiction = len(contradicting_ids) > 0

        if has_support and has_contradiction:
            verdict = VerdictEnum.MIXED
            sources_sup = ", ".join(evidence_lookup[i].source_name for i in supporting_ids[:2])
            sources_con = ", ".join(evidence_lookup[i].source_name for i in contradicting_ids[:2])
            rationale = (
                f"Conflicting reporting detected: corroborated by {sources_sup}, "
                f"but disputed or qualified by {sources_con}."
            )
            confidence = "Moderate"

        elif has_contradiction:
            verdict = VerdictEnum.CONTRADICTED
            top_evidence = evidence_lookup[contradicting_ids[0]]
            rating_note = f" (rated '{top_evidence.review_rating}')" if top_evidence.review_rating else ""
            rationale = (
                f"Contradicted by documented record from {top_evidence.source_name}{rating_note}."
            )
            # High confidence if verified fact-check or multiple sources
            is_fact_check = any(evidence_lookup[i].source_type == SourceTypeEnum.FACT_CHECK for i in contradicting_ids)
            confidence = "High" if (is_fact_check or len(contradicting_ids) >= 2) else "Moderate"

        elif has_support:
            verdict = VerdictEnum.SUPPORTED
            sources = ", ".join(evidence_lookup[i].source_name for i in supporting_ids[:2])
            rationale = f"Corroborated by independent reporting from {sources}."
            confidence = "High" if len(supporting_ids) >= 2 else "Moderate"

        else:
            verdict = VerdictEnum.INSUFFICIENT_EVIDENCE
            rationale = (
                "No authoritative public records or wire dispatches were found to independently "
                "substantiate or refute this statement."
            )
            confidence = "Low"

        return verdict, rationale, confidence

    def _determine_stance(self, claim: ExtractedClaim, item: EvidenceItem) -> str:
        """
        Classify evidence item stance toward the claim as 'supporting',
        'contradicting', or 'neutral'.
        """
        combined_text = f"{item.title} {item.snippet} {item.review_rating or ''}".lower()

        # 1. Fact-check rating analysis
        if item.source_type == SourceTypeEnum.FACT_CHECK and item.review_rating:
            rating_lower = item.review_rating.lower()
            if any(kw in rating_lower for kw in REFUTATION_KEYWORDS):
                return "contradicting"
            if any(kw in rating_lower for kw in CORROBORATION_KEYWORDS):
                return "supporting"

        # 2. Textual stance detection
        has_refute = any(re.search(rf"\b{re.escape(kw)}\b", combined_text) for kw in REFUTATION_KEYWORDS)
        has_corrob = any(re.search(rf"\b{re.escape(kw)}\b", combined_text) for kw in CORROBORATION_KEYWORDS)

        if has_refute and not has_corrob:
            return "contradicting"
        if has_corrob and not has_refute:
            return "supporting"

        # By default, reliable news reporting with high keyword overlap supports existence of event
        if item.source_type == SourceTypeEnum.NEWS_REPORTING:
            return "supporting"

        return "neutral"

    def _compute_relevance(self, claim_tokens: Set[str], item: EvidenceItem) -> float:
        """Compute keyword overlap ratio between claim and evidence item."""
        if not claim_tokens:
            return 0.0

        item_text = f"{item.title} {item.snippet} {item.claim_reviewed or ''}".lower()
        matched = sum(1 for token in claim_tokens if token in item_text)
        return matched / len(claim_tokens)

    def _extract_keywords(self, text: str) -> Set[str]:
        """Extract substantive words from text, stripping common stop words."""
        stop_words = {
            "the", "and", "that", "this", "with", "from", "have", "were", "been",
            "said", "will", "what", "which", "their", "there", "about", "claim",
            "article", "reported", "claims", "state", "after", "over"
        }
        tokens = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        return {t for t in tokens if t not in stop_words}
