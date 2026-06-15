"""
Shared proxy helpers — forward any request to either backend service.

Two entry-points:
  proxy()       →  Spring Boot  (http://127.0.0.1:8082)
  proxy_node()  →  Node.js      (http://127.0.0.1:3001)
"""

import logging

import httpx
from fastapi import Request, Response
from fastapi.responses import JSONResponse

from utils.config import SPRING_BOOT_BASE, NODE_BACKEND_BASE

logger = logging.getLogger("gateway")

# Headers that must be rewritten or dropped before forwarding
_STRIP_REQUEST: frozenset[str] = frozenset({"host", "content-length"})
_HOP_BY_HOP: frozenset[str] = frozenset(
    {"transfer-encoding", "connection", "keep-alive", "content-encoding"}
)


def _get_client(request: Request, attr: str) -> httpx.AsyncClient:
    """Retrieve a named async client stored on app.state."""
    return getattr(request.app.state, attr)


async def _forward(
    request: Request,
    client: httpx.AsyncClient,
    backend_path: str,
    service_name: str,
) -> Response:
    """
    Core forwarding logic shared by both proxy helpers.

    Preserves:
      - HTTP method
      - Request headers (minus hop-by-hop / host)
      - Query string
      - Request body
    """
    query = str(request.url.query)
    url = backend_path + (f"?{query}" if query else "")

    headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in _STRIP_REQUEST
    }

    body = await request.body()

    try:
        backend_resp = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
        )
    except httpx.ConnectError:
        logger.error("Cannot connect to %s at %s", service_name, url)
        return JSONResponse(
            status_code=502,
            content={
                "error": "service_unavailable",
                "message": f"{service_name} is unreachable. Make sure it is running.",
                "service": service_name,
            },
        )
    except httpx.TimeoutException:
        logger.error("Request to %s timed out (%s)", service_name, url)
        return JSONResponse(
            status_code=504,
            content={
                "error": "gateway_timeout",
                "message": f"Request to {service_name} timed out.",
                "service": service_name,
            },
        )
    except httpx.HTTPError as exc:
        logger.error("HTTP error forwarding to %s: %s", service_name, exc)
        return JSONResponse(
            status_code=502,
            content={
                "error": "bad_gateway",
                "message": "Unexpected error communicating with backend.",
                "service": service_name,
            },
        )

    resp_headers = {
        k: v
        for k, v in backend_resp.headers.items()
        if k.lower() not in _HOP_BY_HOP
    }

    return Response(
        content=backend_resp.content,
        status_code=backend_resp.status_code,
        headers=resp_headers,
        media_type=backend_resp.headers.get("content-type", "application/json"),
    )


async def proxy(request: Request, backend_path: str) -> Response:
    """Forward *request* to the Spring Boot backend at *backend_path*."""
    client = _get_client(request, "spring_client")
    return await _forward(request, client, backend_path, "Spring Boot")


async def proxy_node(request: Request, backend_path: str) -> Response:
    """Forward *request* to the Node.js backend at *backend_path*."""
    client = _get_client(request, "node_client")
    return await _forward(request, client, backend_path, "Node.js")
