"""
Shared proxy helper — forwards any request to the Spring Boot backend.
"""

import logging

import httpx
from fastapi import Request, Response
from fastapi.responses import JSONResponse

logger = logging.getLogger("gateway")

SPRING_BOOT_BASE = "http://localhost:8081"

# Headers that must not be forwarded to the backend
_HOP_BY_HOP = {"transfer-encoding", "connection", "keep-alive", "content-encoding"}
_STRIP_REQUEST = {"host", "content-length"}


async def proxy(request: Request, backend_path: str) -> Response:
    """
    Forward *request* to Spring Boot at *backend_path* and return its response.
    Preserves method, headers, body, and query parameters.
    """
    client: httpx.AsyncClient = request.app.state.client

    query = str(request.url.query)
    url = backend_path + (f"?{query}" if query else "")

    headers = {
        k: v for k, v in request.headers.items()
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
        logger.error("Cannot connect to Spring Boot at %s", SPRING_BOOT_BASE)
        return JSONResponse(
            status_code=502,
            content={"message": "Backend service unavailable. Is Spring Boot running on port 8081?"},
        )
    except httpx.TimeoutException:
        logger.error("Request to %s timed out", url)
        return JSONResponse(
            status_code=504,
            content={"message": "Backend request timed out."},
        )

    resp_headers = {
        k: v for k, v in backend_resp.headers.items()
        if k.lower() not in _HOP_BY_HOP
    }

    return Response(
        content=backend_resp.content,
        status_code=backend_resp.status_code,
        headers=resp_headers,
        media_type=backend_resp.headers.get("content-type", "application/json"),
    )
