"""Synthesizes findings into an editorial explanation."""

import logging
from typing import Any, Dict, List, Optional
from pydantic import ValidationError

from app.integrations.gemini_client import GeminiClient
from app.schemas.report import (
    AIExplanation,
    ClaimVerification,
    CredibilityScore,
    EvidenceItem,
)

logger = logging.getLogger(__name__)

class ExplanationEngine:
    """Produces objective, grounded editorial explanations of verification dossiers."""

    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.gemini_client = gemini_client or GeminiClient()

    async def generate_explanation(
        self,
        article_title: str,
        claims: List[ClaimVerification],
        evidence: List[EvidenceItem],
        score: CredibilityScore,
    ) -> AIExplanation:
        """
        Request grounded explanation from Gemini and validate into AIExplanation schema.
        Falls back safely if AI generation fails.
        """
        claims_data = [
            {
                "claim_id": c.claim_id,
                "claim_text": c.claim_text,
                "verdict": c.verdict.value,
                "rationale": c.verdict_rationale,
                "supporting_evidence": c.supporting_evidence_ids,
                "contradicting_evidence": c.contradicting_evidence_ids,
            }
            for c in claims
        ]

        evidence_data = [
            {
                "id": e.id,
                "source": e.source_name,
                "type": e.source_type.value,
                "title": e.title,
                "snippet": e.snippet,
                "url": e.url,
                "rating": e.review_rating or "N/A"
            }
            for e in evidence
        ]

        try:
            raw_result = await self.gemini_client.synthesize_explanation(
                article_title=article_title,
                claims=claims_data,
                evidence=evidence_data,
                score=score.score,
                rating_label=score.rating_label,
            )

            summary = raw_result.get("summary", "")
            key_findings = raw_result.get("key_findings", [])
            evidence_synthesis = raw_result.get("evidence_synthesis", "")
            limitations = raw_result.get("limitations", [])

            if not summary or not evidence_synthesis:
                raise ValueError("Incomplete explanation payload from AI.")

            return AIExplanation(
                summary=summary,
                key_findings=list(key_findings),
                evidence_synthesis=evidence_synthesis,
                limitations=list(limitations)
            )

        except Exception as err:
            logger.warning("AI explanation generation/validation failed (%s). Applying fallback synthesis.", err)
            return self._build_deterministic_explanation(article_title, claims, evidence, score)

    def _build_deterministic_explanation(
        self,
        article_title: str,
        claims: List[ClaimVerification],
        evidence: List[EvidenceItem],
        score: CredibilityScore
    ) -> AIExplanation:
        """Heuristic explanation when AI is unavailable or fails schema validation."""
        supported = [c for c in claims if c.verdict.value == "Supported"]
        contradicted = [c for c in claims if c.verdict.value == "Contradicted"]
        insufficient = [c for c in claims if c.verdict.value == "Insufficient Evidence"]

        findings = []
        if contradicted:
            findings.append(f"{len(contradicted)} statement(s) directly refuted by registered fact-checks or primary records.")
        if supported:
            findings.append(f"{len(supported)} statement(s) substantiated by verified wire reporting.")
        if insufficient:
            findings.append(f"{len(insufficient)} statement(s) lack public documentation in examined registers.")
        if not findings:
            findings.append("No conclusive documentation identified for evaluated claims.")

        return AIExplanation(
            summary=(
                f"TruthLens evaluated {len(claims)} claim(s) from '{article_title}'. "
                f"Based on {len(evidence)} retrieved record(s), the overall credibility score is "
                f"{score.score}/100 ({score.rating_label})."
            ),
            key_findings=findings,
            evidence_synthesis=(
                f"Investigation cross-referenced {len(evidence)} source item(s). "
                f"{len(supported)} claim(s) matched corroborating evidence, while {len(contradicted)} claim(s) "
                f"were disputed by authoritative documentation. Remaining assertions remain unverified."
            ),
            limitations=[
                "Verification scope is limited to public wire archives and Google Fact Check records.",
                "Absence of evidence does not conclusively disprove assertions, but indicates unverified status."
            ]
        )
