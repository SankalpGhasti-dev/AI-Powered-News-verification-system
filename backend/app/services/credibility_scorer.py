"""Credibility scoring calculations."""

from typing import Any, Dict, List
from app.schemas.report import (
    ClaimVerification,
    CredibilityScore,
    EvidenceItem,
    VerdictEnum,
)


class CredibilityScorer:
    DISCLAIMER = (
        "This score measures the extent to which claims are corroborated or contradicted "
        "by currently retrieved public records, wire reports, and verified fact-checks. "
        "It measures evidentiary support, not the absolute philosophical certainty of truth."
    )

    def calculate_score(
        self,
        claims: List[ClaimVerification],
        evidence: List[EvidenceItem]
    ) -> CredibilityScore:
        if not claims:
            return CredibilityScore(
                score=50,
                rating_label="Unverified / Insufficient Documentation",
                confidence="Low",
                formula_breakdown={
                    "total_claims": 0,
                    "coverage_ratio": 0.0,
                    "verdict_balance": 0.0,
                    "reason": "No verifiable claims identified."
                },
                disclaimer=self.DISCLAIMER
            )

        total_claims = len(claims)
        supported_count = sum(1 for c in claims if c.verdict == VerdictEnum.SUPPORTED)
        contradicted_count = sum(1 for c in claims if c.verdict == VerdictEnum.CONTRADICTED)
        mixed_count = sum(1 for c in claims if c.verdict == VerdictEnum.MIXED)
        insufficient_count = sum(1 for c in claims if c.verdict == VerdictEnum.INSUFFICIENT_EVIDENCE)

        evaluated_claims = supported_count + contradicted_count + mixed_count
        coverage_ratio = evaluated_claims / total_claims

        total_impact = 0.0
        total_weight = 0.0

        for c in claims:
            if c.verdict == VerdictEnum.SUPPORTED:
                weight = 1.2 if len(c.supporting_evidence_ids) >= 2 else 0.9
                direction = +1.0
            elif c.verdict == VerdictEnum.CONTRADICTED:
                weight = 1.3 if len(c.contradicting_evidence_ids) >= 2 else 1.0
                direction = -1.0
            elif c.verdict == VerdictEnum.MIXED:
                weight = 0.8
                direction = -0.25
            else:
                weight = 0.5
                direction = 0.0

            total_impact += direction * weight
            total_weight += weight

        verdict_balance = (total_impact / total_weight) if total_weight > 0 else 0.0

        fact_check_count = sum(1 for e in evidence if e.source_type.value == "fact_check")
        news_count = sum(1 for e in evidence if e.source_type.value != "fact_check")
        evidence_quality = min(1.0, 0.45 + (fact_check_count * 0.25) + (news_count * 0.15))

        publishers = {e.source_name.strip().lower() for e in evidence if e.source_name}
        unique_sources = len(publishers)
        diversity_bonus = min(0.15, (unique_sources - 1) * 0.05) if unique_sources > 1 else 0.0

        baseline = 50.0
        shift = verdict_balance * 40.0 * (0.6 + 0.4 * coverage_ratio) * evidence_quality

        if verdict_balance > 0:
            shift += (diversity_bonus * 100.0)
        elif verdict_balance < 0:
            shift -= (diversity_bonus * 30.0)

        raw_score = baseline + shift
        score = max(0, min(100, int(round(raw_score))))

        rating_label, confidence = self._categorize_score(score, coverage_ratio, unique_sources, contradicted_count)

        formula_breakdown: Dict[str, Any] = {
            "total_claims": total_claims,
            "supported_claims": supported_count,
            "contradicted_claims": contradicted_count,
            "mixed_claims": mixed_count,
            "insufficient_evidence_claims": insufficient_count,
            "coverage_ratio": round(coverage_ratio, 2),
            "verdict_balance": round(verdict_balance, 2),
            "evidence_quality_factor": round(evidence_quality, 2),
            "diversity_bonus": round(diversity_bonus, 2),
            "unique_sources": unique_sources,
            "raw_score": score
        }

        return CredibilityScore(
            score=score,
            rating_label=rating_label,
            confidence=confidence,
            formula_breakdown=formula_breakdown,
            disclaimer=self.DISCLAIMER
        )

    def _categorize_score(
        self, score: int, coverage_ratio: float, unique_sources: int, contradicted_count: int
    ) -> tuple[str, str]:
        if score >= 80:
            rating_label = "High Credibility / Well-Corroborated"
        elif score >= 60:
            rating_label = "Mostly Credible / Minor Inconsistencies"
        elif score >= 40:
            if coverage_ratio < 0.35 and contradicted_count == 0:
                rating_label = "Unverified / Insufficient Documentation"
            else:
                rating_label = "Mixed / Disputed Claims"
        elif score >= 25:
            rating_label = "Low Credibility / Substantially Contradicted"
        else:
            rating_label = "Fabricated / Heavily Refuted"

        if coverage_ratio >= 0.75 and unique_sources >= 3:
            confidence = "High"
        elif coverage_ratio >= 0.4 and unique_sources >= 2:
            confidence = "Moderate"
        else:
            confidence = "Low"

        return rating_label, confidence
