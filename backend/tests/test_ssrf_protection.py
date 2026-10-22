"""
Tests for Server-Side Request Forgery (SSRF) protection.
Verifies that all internal, private, link-local, and loopback destinations
are strictly blocked before making external requests.
"""

import pytest
from app.core.errors import SSRFValidationError
from app.core.ssrf import validate_url_and_resolve_ips, safe_fetch_url


def test_block_direct_loopback_ipv4():
    """Direct 127.0.0.1 IP must be blocked."""
    with pytest.raises(SSRFValidationError) as exc:
        validate_url_and_resolve_ips("http://127.0.0.1:8000/api/secret")
    assert "prohibited" in str(exc.value).lower() or "loopback" in str(exc.value).lower()


def test_block_localhost_hostname():
    """'localhost' hostname must be blocked."""
    with pytest.raises(SSRFValidationError) as exc:
        validate_url_and_resolve_ips("http://localhost:3000/admin")
    assert "prohibited" in str(exc.value).lower()


def test_block_direct_loopback_ipv6():
    """Direct [::1] IPv6 loopback must be blocked."""
    with pytest.raises(SSRFValidationError) as exc:
        validate_url_and_resolve_ips("http://[::1]:8080/internal")
    assert "prohibited" in str(exc.value).lower() or "loopback" in str(exc.value).lower()


def test_block_cloud_metadata_ip():
    """AWS/GCP/Azure metadata address 169.254.169.254 must be blocked."""
    with pytest.raises(SSRFValidationError) as exc:
        validate_url_and_resolve_ips("http://169.254.169.254/latest/meta-data/")
    assert "prohibited" in str(exc.value).lower() or "metadata" in str(exc.value).lower() or "link-local" in str(exc.value).lower()


def test_block_private_rfc1918_ips():
    """Private subnet IPs (10.x, 192.168.x, 172.16.x) must be blocked."""
    private_urls = [
        "http://10.0.0.1/admin",
        "http://192.168.1.1/router",
        "http://172.16.0.5:8080/dashboard",
    ]
    for url in private_urls:
        with pytest.raises(SSRFValidationError):
            validate_url_and_resolve_ips(url)


def test_block_non_http_schemes():
    """Only http and https schemes are permitted; file://, ftp:// must be blocked."""
    bad_schemes = [
        "file:///etc/passwd",
        "ftp://example.com/file.txt",
        "gopher://example.com/",
        "data:text/html,<html></html>",
    ]
    for url in bad_schemes:
        with pytest.raises(SSRFValidationError) as exc:
            validate_url_and_resolve_ips(url)
        assert "unsupported url scheme" in str(exc.value).lower()


def test_block_cloud_internal_hostnames():
    """Internal cloud names like metadata.google.internal must be blocked."""
    with pytest.raises(SSRFValidationError):
        validate_url_and_resolve_ips("http://metadata.google.internal/computeMetadata/v1/")


@pytest.mark.asyncio
async def test_safe_fetch_blocks_ssrf_before_network():
    """safe_fetch_url must reject prohibited destinations before attempting network calls."""
    with pytest.raises(SSRFValidationError):
        await safe_fetch_url("http://127.0.0.1:9999/status")
