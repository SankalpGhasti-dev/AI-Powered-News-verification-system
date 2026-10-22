"""Tests for explanation engine and report generation."""

from unittest.mock import AsyncMock
import pytest

from app.integrations.gemini_client import GeminiClient
from app.schemas.investigation import InputType, InvestigationRequest
from app.schemas.report import (
    AIExplanation,
    ClaimVerification,
    CredibilityScore,
    InvestigationReport,
    VerdictEnum,
)
from app.services.explanation_engine import ExplanationEngine
from app.services.report_generator import InvestigationReportGenerator

@pytest.mark.asyncio
async def test_explanation_engine_respects_backend_score():
    """AI explanation must strictly adopt backend-computed score and return structured fields."""
    mock_gemini = AsyncMock(spec=GeminiClient)
    mock_gemini.synthesize_explanation.return_value = {
        "summary": "Investigation evaluated the core statements.",
        "key_findings": ["Statement was corroborated by primary reporting."],
        "evidence_synthesis": "Evidence demonstrates alignment with wire coverage.",
        "limitations": ["Limited to open records."]
    }

    engine = ExplanationEngine(gemini_client=mock_gemini)

    test_claims = [
        ClaimVerification(
            claim_id="CLM-01",
            claim_text="Inflation eased to 3 percent.",
            verdict=VerdictEnum.SUPPORTED,
            verdict_rationale="Confirmed by reports.",
            supporting_evidence_ids=["EVD-01"],
            contradicting_evidence_ids=[]
        )
    ]
    test_score = CredibilityScore(
        score=88,
        rating_label="High Credibility / Well-Corroborated",
        confidence="High"
    )

    explanation = await engine.generate_explanation(
        article_title="Inflation Moderates",
        claims=test_claims,
        evidence=[],
        score=test_score
    )

    assert isinstance(explanation, AIExplanation)
    assert len(explanation.key_findings) == 1
    assert "Investigation evaluated" in explanation.summary
    # Verify that synthesis was called with score=88
    mock_gemini.synthesize_explanation.assert_awaited_once()
    call_kwargs = mock_gemini.synthesize_explanation.await_args.kwargs
    assert call_kwargs["score"] == 88

@pytest.mark.asyncio
async def test_explanation_engine_fallback_on_ai_failure():
    """Explanation engine gracefully uses deterministic synthesis if AI fails."""
    mock_gemini = AsyncMock(spec=GeminiClient)
    mock_gemini.synthesize_explanation.side_effect = Exception("Gemini service timeout")

    engine = ExplanationEngine(gemini_client=mock_gemini)
    test_claims = [
        ClaimVerification(
            claim_id="CLM-01",
            claim_text="Unverified assertion.",
            verdict=VerdictEnum.INSUFFICIENT_EVIDENCE,
            verdict_rationale="No records found.",
            supporting_evidence_ids=[],
            contradicting_evidence_ids=[]
        )
    ]
    test_score = CredibilityScore(
        score=50,
        rating_label="Unverified / Insufficient Documentation",
        confidence="Low"
    )

    explanation = await engine.generate_explanation(
        article_title="Unverified Event",
        claims=test_claims,
        evidence=[],
        score=test_score
    )

    assert isinstance(explanation, AIExplanation)
    assert "Unverified Event" in explanation.summary
    assert len(explanation.limitations) > 0

@pytest.mark.asyncio
async def test_report_generator_full_workflow():
    """Report generator compiles a complete InvestigationReport dossier without database persistence."""
    generator = InvestigationReportGenerator()

    req = InvestigationRequest(
        input_type=InputType.TEXT,
        content=(
            "Major Central Bank Announces Inflation Target Adjustment\n\n"
            "The central banking council concluded its bi-monthly policy summit on Friday. "
            "In an official communique, council members affirmed their commitment to a 2 percent "
            "symmetric target, noting that recent supply shocks had largely dissipated."
        )
    )

    report = await generator.run_investigation(req)

    assert isinstance(report, InvestigationReport)
    assert report.investigation_id.startswith("INV-")
    assert report.input_type == "text"
    assert report.article.word_count > 15
    assert len(report.claims) >= 1
    assert 0 <= report.credibility_score.score <= 100
    assert report.metrics.total_claims == len(report.claims)
    assert len(report.limitations) > 0
    assert len(report.explanation.key_findings) > 0
