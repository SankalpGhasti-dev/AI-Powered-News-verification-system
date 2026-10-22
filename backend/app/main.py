"""FastAPI application entry point."""

from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import health, investigations
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TruthLens — AI-Powered News & Claim Verification Backend API. "
                "Cross-references claims with GNews and Google Fact Check Tools API, "
                "scoring credibility and synthesizing objective explanations using Google Gemini.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(investigations.router, prefix=settings.API_V1_PREFIX)

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend" if (ROOT_DIR / "frontend").exists() else ROOT_DIR

@app.get("/", tags=["Root"])
async def root(request: Request):
    """Root endpoint: serves index.html to browser users, or API JSON metadata to programmatic callers."""
    accept = request.headers.get("accept", "")
    index_file = FRONTEND_DIR / "index.html"
    if "text/html" in accept and index_file.exists():
        return FileResponse(index_file)

    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "interactive_ui": "http://127.0.0.1:8000/docs",
        "health_endpoint": f"{settings.API_V1_PREFIX}/health",
        "investigations_endpoint": f"{settings.API_V1_PREFIX}/investigations",
        "documentation": "/docs"
    }

@app.get("/health", include_in_schema=False)
@app.get("/api/health", include_in_schema=False)
async def health_alias():
    """Convenience alias for /api/v1/health."""
    return await health.check_health()

if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
