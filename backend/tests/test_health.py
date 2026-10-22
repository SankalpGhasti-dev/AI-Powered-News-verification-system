"""
Tests for health check and root endpoints.
"""

import pytest


@pytest.mark.asyncio
async def test_health_endpoint(async_client):
    """Verify that the health check endpoint returns 200 and integration keys."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"
    assert "service" in data
    assert "integrations" in data
    assert "gemini" in data["integrations"]
    assert "gnews" in data["integrations"]
    assert "factcheck" in data["integrations"]


@pytest.mark.asyncio
async def test_root_endpoint(async_client):
    """Verify that the root endpoint returns API information."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "online"
    assert data["service"] == "TruthLens API"
    assert "/api/v1/health" in data["health_endpoint"]
    assert "/api/v1/investigations" in data["investigations_endpoint"]
