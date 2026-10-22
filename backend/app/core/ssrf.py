"""
SSRF Protection and Safe HTTP Fetching Engine.
Protects against Server-Side Request Forgery by strictly resolving hostnames,
blocking private/loopback/cloud-metadata IP ranges, validating redirect hops,
and enforcing strict timeouts and size limits.
"""

import ipaddress
import socket
from typing import Set, Tuple
import urllib.parse
import httpx

from app.core.errors import SSRFValidationError, ArticleExtractionError

# Disallowed IP Networks (IPv4 and IPv6)
DISALLOWED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),          # Current network
    ipaddress.ip_network("10.0.0.0/8"),          # Private RFC 1918
    ipaddress.ip_network("100.64.0.0/10"),       # Carrier-grade NAT
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback
    ipaddress.ip_network("169.254.0.0/16"),      # Link-local / Cloud Metadata (169.254.169.254)
    ipaddress.ip_network("172.16.0.0/12"),       # Private RFC 1918
    ipaddress.ip_network("192.0.0.0/24"),        # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),        # TEST-NET-1
    ipaddress.ip_network("192.88.99.0/24"),      # 6to4 relay
    ipaddress.ip_network("192.168.0.0/16"),      # Private RFC 1918
    ipaddress.ip_network("198.18.0.0/15"),       # Network benchmark tests
    ipaddress.ip_network("198.51.100.0/24"),     # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),      # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved
    ipaddress.ip_network("255.255.255.255/32"),  # Broadcast
    ipaddress.ip_network("::/128"),             # Unspecified IPv6
    ipaddress.ip_network("::1/128"),            # Loopback IPv6
    ipaddress.ip_network("fc00::/7"),           # Unique local address (ULA)
    ipaddress.ip_network("fe80::/10"),          # Link-local IPv6
    ipaddress.ip_network("ff00::/8"),           # Multicast IPv6
    ipaddress.ip_network("::ffff:0:0/96"),      # IPv4-mapped IPv6
]


def is_ip_prohibited(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> Tuple[bool, str]:
    """
    Check if an IP address falls into a private, loopback, link-local,
    multicast, or cloud metadata network.
    """
    if ip.is_loopback:
        return True, "loopback address"
    if ip.is_private:
        return True, "private network address"
    if ip.is_link_local:
        return True, "link-local address (metadata target)"
    if ip.is_multicast:
        return True, "multicast address"
    if ip.is_reserved:
        return True, "reserved address"
    if ip.is_unspecified:
        return True, "unspecified address"

    # Check against explicit disallowed ranges
    for network in DISALLOWED_NETWORKS:
        if ip in network:
            return True, f"blocked network {network}"

    return False, ""


def validate_url_and_resolve_ips(url_str: str) -> Set[str]:
    """
    Validate URL scheme, syntax, and resolve hostname to verify no target IP
    is private, loopback, or cloud-internal.
    Returns the set of resolved safe IP addresses.
    """
    try:
        parsed = urllib.parse.urlparse(url_str.strip())
    except Exception as exc:
        raise SSRFValidationError(f"Invalid URL structure: {exc}")

    # Enforce strictly http or https
    if parsed.scheme.lower() not in ("http", "https"):
        raise SSRFValidationError(
            f"Unsupported URL scheme '{parsed.scheme}'. Only 'http' and 'https' are allowed."
        )

    hostname = parsed.hostname
    if not hostname:
        raise SSRFValidationError("URL must include a valid hostname.")

    # Block obvious local names
    lower_host = hostname.lower()
    if lower_host in ("localhost", "127.0.0.1", "::1", "metadata.google.internal", "instance-data"):
        raise SSRFValidationError(f"Access to host '{hostname}' is prohibited.")

    # Check if host is direct IP address string
    try:
        direct_ip = ipaddress.ip_address(lower_host)
        is_bad, reason = is_ip_prohibited(direct_ip)
        if is_bad:
            raise SSRFValidationError(f"Direct IP {hostname} is prohibited: {reason}.")
        return {str(direct_ip)}
    except ValueError:
        # Not a direct IP; resolve hostname via DNS
        pass

    # Resolve all addresses via socket
    port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
    try:
        addr_info = socket.getaddrinfo(hostname, port, socket.AF_UNSPEC, socket.SOCK_STREAM)
    except socket.gaierror as err:
        raise SSRFValidationError(f"Could not resolve hostname '{hostname}': {err}")

    resolved_ips: Set[str] = set()
    for item in addr_info:
        sockaddr = item[4]
        ip_str = sockaddr[0]
        resolved_ips.add(ip_str)

        try:
            ip_obj = ipaddress.ip_address(ip_str)
            is_bad, reason = is_ip_prohibited(ip_obj)
            if is_bad:
                raise SSRFValidationError(
                    f"Host '{hostname}' resolves to prohibited IP {ip_str} ({reason})."
                )
        except ValueError:
            raise SSRFValidationError(f"Invalid resolved IP format '{ip_str}' for host '{hostname}'.")

    if not resolved_ips:
        raise SSRFValidationError(f"No IP addresses could be resolved for host '{hostname}'.")

    return resolved_ips


async def safe_fetch_url(
    url: str,
    timeout_seconds: float = 8.0,
    max_bytes: int = 3 * 1024 * 1024,
    max_redirects: int = 3,
) -> str:
    """
    Safely fetch the HTML content of a URL with SSRF checks at every redirect hop,
    enforcing connection timeouts and response size limits.
    """
    current_url = url
    headers = {
        "User-Agent": "TruthLensNewsVerificationBot/1.0 (+https://github.com/TruthLens/verification)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    timeout = httpx.Timeout(timeout_seconds, connect=4.0)

    for hop in range(max_redirects + 1):
        # SSRF validation before every hop
        validate_url_and_resolve_ips(current_url)

        try:
            async with httpx.AsyncClient(
                follow_redirects=False,
                timeout=timeout,
                verify=True
            ) as client:
                response = await client.get(current_url, headers=headers)

                # Check for redirects
                if response.status_code in (301, 302, 303, 307, 308):
                    location = response.headers.get("Location")
                    if not location:
                        raise ArticleExtractionError("Redirect response received without Location header.")
                    
                    next_url = urllib.parse.urljoin(current_url, location)
                    if hop >= max_redirects:
                        raise ArticleExtractionError(f"Exceeded maximum allowed redirects ({max_redirects}).")
                    current_url = next_url
                    continue

                if response.status_code >= 400:
                    raise ArticleExtractionError(
                        f"Target website returned HTTP error {response.status_code}."
                    )

                # Content-Type check
                content_type = response.headers.get("content-type", "").lower()
                if content_type and not any(t in content_type for t in ("text/html", "application/xhtml+xml", "text/plain")):
                    raise ArticleExtractionError(
                        f"Unsupported Content-Type '{content_type}'. TruthLens expects HTML or plain text."
                    )

                # Check Content-Length header if present
                content_length = response.headers.get("content-length")
                if content_length and int(content_length) > max_bytes:
                    raise ArticleExtractionError(
                        f"Article content length ({content_length} bytes) exceeds maximum limit of {max_bytes} bytes."
                    )

                # Enforce size limit while reading content
                body_bytes = response.content
                if len(body_bytes) > max_bytes:
                    raise ArticleExtractionError(
                        f"Article payload exceeds maximum allowed limit of {max_bytes} bytes."
                    )

                # Decode using detected encoding or utf-8 fallback
                encoding = response.encoding or "utf-8"
                try:
                    return body_bytes.decode(encoding, errors="replace")
                except Exception:
                    return body_bytes.decode("utf-8", errors="replace")

        except httpx.TimeoutException:
            raise ArticleExtractionError(
                f"Request to '{current_url}' timed out after {timeout_seconds}s."
            )
        except httpx.RequestError as exc:
            raise ArticleExtractionError(f"Network error while fetching article: {exc}")

    raise ArticleExtractionError("Failed to fetch article: maximum redirect depth reached.")
