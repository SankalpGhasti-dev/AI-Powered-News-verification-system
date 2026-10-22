"""
Investigations route for TruthLens Backend.
Handles claim and article verification workflows.
"""

from fastapi import APIRouter, HTTPException, status
import logging

from app.core.errors import ArticleExtractionError, ExternalAPIError, SSRFValidationError
from app.schemas.investigation import InvestigationRequest
from app.schemas.report import InvestigationReport
from app.services.report_generator import InvestigationReportGenerator

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Investigations"])

generator = InvestigationReportGenerator()


@router.post(
    "/investigations",
    response_model=InvestigationReport,
    status_code=status.HTTP_200_OK,
    summary="Run verification investigation on URL or text",
    description="Accepts an article URL or pasted text excerpt, extracts factual claims, "
                "queries GNews and Google Fact Check Tools, evaluates claim verdicts, "
                "calculates a 0-100 credibility score, and synthesizes an objective explanation."
)
async def create_investigation(payload: InvestigationRequest) -> InvestigationReport:
    """Execute news and claim verification workflow."""
    try:
        report = await generator.run_investigation(payload)
        return report

    except SSRFValidationError as exc:
        logger.warning("SSRF validation blocked request: %s", exc.message)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "SSRF_VALIDATION_ERROR", "message": exc.message}
        )

    except ArticleExtractionError as exc:
        logger.warning("Article extraction failed: %s", exc.message)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "ARTICLE_EXTRACTION_ERROR", "message": exc.message}
        )

    except ExternalAPIError as exc:
        logger.error("External integration failed: %s", exc.message)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "EXTERNAL_API_ERROR", "message": exc.message}
        )

    except ValueError as exc:
        logger.warning("Validation error during investigation: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_INPUT", "message": str(exc)}
        )

    except Exception as exc:
        logger.exception("Unexpected error executing investigation: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "INTERNAL_SERVER_ERROR", "message": "An unexpected server error occurred."}
        )
