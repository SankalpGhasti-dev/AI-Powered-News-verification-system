"""
Report schemas, models, and health response definitions for TruthLens.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VerdictEnum(str, Enum):
    """
    Standard verification verdicts required by TruthLens V1.
    Never forces an unsupported claim into a binary true/false conclusion.
    """
    SUPPORTED = "Supported"
    CONTRADICTED = "Contradicted"
    MIXED = "Mixed"
    INSUFFICIENT_EVIDENCE = "Insufficient Evidence"


class SourceTypeEnum(str, Enum):
    """Classification of retrieved evidence source."""
    FACT_CHECK = "fact_check"
    NEWS_REPORTING = "news_reporting"


class ExtractedClaim(BaseModel):
    """Atomic factual claim extracted from an article."""
    id: str = Field(..., description="Unique claim identifier (e.g. CLM-01)")
    claim_text: str = Field(..., description="Specific factual claim asserted in the content")
    entity: Optional[str] = Field(default=None, description="Primary subject or entity of the claim")
    category: Optional[str] = Field(default="factual_assertion", description="Claim category (statistic, quote, event, policy)")


class EvidenceItem(BaseModel):
    """Normalized evidence item retrieved from external records or wire reporting."""
    id: str = Field(..., description="Unique evidence identifier (e.g. EVD-01)")
    source_name: str = Field(..., description="Publisher, registry, or newsroom name")
    source_type: SourceTypeEnum = Field(..., description="'fact_check' or 'news_reporting'")
    title: str = Field(..., description="Headline or title of the evidence article")
    snippet: str = Field(..., description="Relevant passage, summary, or fact-check review")
    url: str = Field(..., description="Live public URL to the evidence source (never fabricated)")
    published_date: Optional[str] = Field(default=None, description="ISO date or publication timestamp")
    claim_reviewed: Optional[str] = Field(default=None, description="Subject statement reviewed (if fact-check)")
    review_rating: Optional[str] = Field(default=None, description="Original publisher rating (e.g. 'False', 'True')")


class ClaimVerification(BaseModel):
    """Verification outcome for an individual atomic claim."""
    claim_id: str = Field(..., description="Reference to ExtractedClaim.id")
    claim_text: str = Field(..., description="The verified claim statement")
    verdict: VerdictEnum = Field(..., description="One of: Supported, Contradicted, Mixed, Insufficient Evidence")
    verdict_rationale: str = Field(..., description="Concise explanation for why this verdict was assigned")
    supporting_evidence_ids: List[str] = Field(default_factory=list, description="IDs of corroborating evidence")
    contradicting_evidence_ids: List[str] = Field(default_factory=list, description="IDs of refuting evidence")
    confidence: str = Field(default="Moderate", description="'High', 'Moderate', or 'Low' based on source authority")


class CredibilityScore(BaseModel):
    """Credibility score calculated using explicit, documented formula."""
    score: int = Field(..., ge=0, le=100, description="Overall score from 0 to 100")
    rating_label: str = Field(..., description="Descriptive bracket (e.g. 'High Credibility', 'Questionable')")
    confidence: str = Field(..., description="'High', 'Moderate', or 'Low'")
    formula_breakdown: Dict[str, Any] = Field(
        default_factory=dict,
        description="Mathematical factors used: claim coverage, support weight, contradiction penalties"
    )
    disclaimer: str = Field(
        default="This score measures empirical corroboration from currently retrieved public records "
                "and wire reporting. It does not represent an absolute philosophical guarantee of truth.",
        description="Evidentiary scope reminder"
    )


class AIExplanation(BaseModel):
    """Structured editorial explanation synthesized from verified claims and evidence."""
    summary: str = Field(..., description="High-level synthesis of investigation findings")
    key_findings: List[str] = Field(default_factory=list, description="Core analytical takeaways")
    evidence_synthesis: str = Field(..., description="Detailed walk-through connecting claims to evidence")
    limitations: List[str] = Field(
        default_factory=list,
        description="Gaps, missing primary registries, or uncorroborated angles"
    )


class ArticleMetadata(BaseModel):
    """Metadata for the evaluated article or text excerpt."""
    title: str = Field(..., description="Extracted headline or inferred subject")
    url: Optional[str] = Field(default=None, description="Source URL if provided")
    word_count: int = Field(default=0, description="Word count of the analyzed text")
    summary: str = Field(default="", description="Brief extracted summary of the article")


class InvestigationMetrics(BaseModel):
    """Statistical summary of the investigation results."""
    total_claims: int
    supported_claims: int
    contradicted_claims: int
    mixed_claims: int
    insufficient_evidence_claims: int
    sources_consulted: int


class InvestigationReport(BaseModel):
    """Complete, structured investigation dossier returned by TruthLens."""
    investigation_id: str = Field(..., description="Unique case identifier (e.g. INV-20261021-ABCD)")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of the investigation")
    input_type: str = Field(..., description="'url' or 'text'")
    article: ArticleMetadata
    credibility_score: CredibilityScore
    claims: List[ClaimVerification]
    evidence: List[EvidenceItem]
    explanation: AIExplanation
    metrics: InvestigationMetrics
    limitations: List[str]


class HealthResponse(BaseModel):
    """Service health and integration status."""
    status: str = "healthy"
    version: str = "1.0.0"
    service: str = "TruthLens Backend"
    integrations: Dict[str, str] = Field(
        default_factory=dict,
        description="Configuration status for external services (gemini, gnews, factcheck)"
    )
