"""
Health check route for TruthLens Backend.
"""

from fastapi import APIRouter
from app.core.config import get_settings
from app.schemas.report import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def check_health() -> HealthResponse:
    """
    Check backend health status and integration availability.
    """
    settings = get_settings()

    integrations = {
        "gemini": "configured" if settings.has_gemini_key else "unconfigured (mock fallback enabled)" if settings.ENABLE_MOCK_FALLBACK else "unconfigured",
        "gnews": "configured" if settings.has_gnews_key else "unconfigured (mock fallback enabled)" if settings.ENABLE_MOCK_FALLBACK else "unconfigured",
        "factcheck": "configured" if settings.has_factcheck_key else "unconfigured (mock fallback enabled)" if settings.ENABLE_MOCK_FALLBACK else "unconfigured",
    }

    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        service=settings.PROJECT_NAME,
        integrations=integrations
    )
