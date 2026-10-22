"""
Integration tests for POST /api/v1/investigations endpoint.
"""

import pytest


@pytest.mark.asyncio
async def test_investigation_api_text_success(async_client):
    """POST /api/v1/investigations returns complete dossier for valid text input."""
    payload = {
        "input_type": "text",
        "content": (
            "Regional Trade Accord Signed in Geneva\n\n"
            "Delegates from twelve member states signed a preliminary agreement "
            "reducing border tariffs on medical goods. The pact is scheduled to take effect "
            "following legislative ratification in participating member parliaments."
        )
    }

    response = await async_client.post("/api/v1/investigations", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "investigation_id" in data
    assert data["input_type"] == "text"
    assert "Regional Trade Accord" in data["article"]["title"]
    assert "credibility_score" in data
    assert 0 <= data["credibility_score"]["score"] <= 100
    assert "claims" in data
    assert len(data["claims"]) >= 1
    assert "explanation" in data
    assert "metrics" in data
    assert "limitations" in data


@pytest.mark.asyncio
async def test_investigation_api_blocks_ssrf_url(async_client):
    """POST /api/v1/investigations must block attempts to query localhost/private IPs."""
    payload = {
        "input_type": "url",
        "content": "http://127.0.0.1:8000/api/v1/health"
    }

    response = await async_client.post("/api/v1/investigations", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "SSRF_VALIDATION_ERROR" in str(data) or "prohibited" in str(data).lower()


@pytest.mark.asyncio
async def test_investigation_api_blocks_cloud_metadata(async_client):
    """POST /api/v1/investigations must block cloud metadata address."""
    payload = {
        "input_type": "url",
        "content": "http://169.254.169.254/latest/meta-data/"
    }

    response = await async_client.post("/api/v1/investigations", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "prohibited" in str(data).lower() or "ssrf" in str(data).lower()


@pytest.mark.asyncio
async def test_investigation_api_rejects_empty_input(async_client):
    """POST /api/v1/investigations must reject empty content with 422."""
    payload = {
        "input_type": "text",
        "content": "   "
    }

    response = await async_client.post("/api/v1/investigations", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_investigation_api_rejects_short_text(async_client):
    """POST /api/v1/investigations rejects text shorter than 15 characters."""
    payload = {
        "input_type": "text",
        "content": "Short text."
    }

    response = await async_client.post("/api/v1/investigations", json=payload)
    assert response.status_code in (400, 422)
