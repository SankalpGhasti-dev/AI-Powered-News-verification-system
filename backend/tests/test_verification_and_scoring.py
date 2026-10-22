"""
Tests for Module 5 (Verification Engine) and Module 6 (Credibility Scoring Engine).
Validates four mandatory verdicts: Supported, Contradicted, Mixed, and Insufficient Evidence.
Verifies the explicit 0-100 mathematical scoring formula and neutral baseline behavior.
"""

import pytest

from app.schemas.report import (
    ClaimVerification,
    EvidenceItem,
    ExtractedClaim,
    SourceTypeEnum,
    VerdictEnum,
)
from app.services.credibility_scorer import CredibilityScorer
from app.services.verification_engine import VerificationEngine

def test_supported_claims_high_score(sample_claims, sample_supporting_evidence):
    """When evidence corroborates claims, verdict is Supported and score is high."""
    verification_engine = VerificationEngine()
    credibility_scorer = CredibilityScorer()

    verified = verification_engine.verify_claims(sample_claims, sample_supporting_evidence)

    assert len(verified) == 2
    assert all(c.verdict == VerdictEnum.SUPPORTED for c in verified)
    assert all(len(c.supporting_evidence_ids) > 0 for c in verified)
    assert all(len(c.contradicting_evidence_ids) == 0 for c in verified)

    score_result = credibility_scorer.calculate_score(verified, sample_supporting_evidence)

    assert score_result.score >= 80
    assert "High Credibility" in score_result.rating_label
    assert score_result.confidence in ("High", "Moderate")
    assert score_result.formula_breakdown["supported_claims"] == 2
    assert score_result.formula_breakdown["contradicted_claims"] == 0

def test_contradicted_claims_low_score(sample_refuting_evidence):
    """When a fact-check refutes claims, verdict is Contradicted and score is heavily penalized."""
    verification_engine = VerificationEngine()
    credibility_scorer = CredibilityScorer()

    fake_claim = [
        ExtractedClaim(
            id="CLM-01",
            claim_text="Governor ordered 40 percent industrial reserve freeze.",
            entity="Governor",
            category="quote"
        )
    ]

    verified = verification_engine.verify_claims(fake_claim, sample_refuting_evidence)

    assert len(verified) == 1
    assert verified[0].verdict == VerdictEnum.CONTRADICTED
    assert len(verified[0].contradicting_evidence_ids) > 0

    score_result = credibility_scorer.calculate_score(verified, sample_refuting_evidence)

    # Score must be severely penalized (< 25)
    assert score_result.score <= 25
    assert "Fabricated" in score_result.rating_label or "Questionable" in score_result.rating_label
    assert score_result.formula_breakdown["contradicted_claims"] == 1

def test_insufficient_evidence_neutral_baseline(sample_claims):
    """
    CRITICAL REQUIREMENT: Insufficient evidence must maintain a neutral baseline (~50),
    NOT a score of 0 (which would falsely imply the article is disproven).
    """
    verification_engine = VerificationEngine()
    credibility_scorer = CredibilityScorer()

    # Pass empty evidence list
    verified = verification_engine.verify_claims(sample_claims, evidence=[])

    assert len(verified) == 2
    assert all(c.verdict == VerdictEnum.INSUFFICIENT_EVIDENCE for c in verified)
    assert all(len(c.supporting_evidence_ids) == 0 for c in verified)
    assert all(len(c.contradicting_evidence_ids) == 0 for c in verified)

    score_result = credibility_scorer.calculate_score(verified, evidence=[])

    # Score should be neutral (around 50), not 0
    assert score_result.score == 50
    assert "Unverified" in score_result.rating_label or "Insufficient" in score_result.rating_label
    assert score_result.confidence == "Low"
    assert "measures the extent to which claims are corroborated" in score_result.disclaimer

def test_mixed_evidence_verdict():
    """When evidence contains both supporting and contradicting reports, verdict is Mixed."""
    verification_engine = VerificationEngine()
    credibility_scorer = CredibilityScorer()

    claim = [
        ExtractedClaim(
            id="CLM-01",
            claim_text="Ministry confirmed plans to construct regional high-speed rail line.",
            entity="Ministry of Transport",
            category="policy"
        )
    ]

    conflicting_evidence = [
        EvidenceItem(
            id="EVD-01",
            source_name="National Daily Wire",
            source_type=SourceTypeEnum.NEWS_REPORTING,
            title="Ministry confirmed initial feasibility studies for high-speed rail",
            snippet="Officials confirmed high-speed rail routing proposals are actively under review.",
            url="https://nationaldaily.com/rail-plans",
            published_date="2026-10-15"
        ),
        EvidenceItem(
            id="EVD-02",
            source_name="Independent Fact Check",
            source_type=SourceTypeEnum.FACT_CHECK,
            title="Fact Check: Claims that construction has begun are false",
            snippet="Rating: False. Ministry denies any approved budget or imminent construction schedule.",
            url="https://factcheck.org/rail-denial",
            published_date="2026-10-16",
            review_rating="False"
        )
    ]

    verified = verification_engine.verify_claims(claim, conflicting_evidence)

    assert len(verified) == 1
    assert verified[0].verdict == VerdictEnum.MIXED
    assert len(verified[0].supporting_evidence_ids) == 1
    assert len(verified[0].contradicting_evidence_ids) == 1

    score_result = credibility_scorer.calculate_score(verified, conflicting_evidence)
    # Score for mixed evidence should reflect tension (middle range)
    assert 30 <= score_result.score <= 65
