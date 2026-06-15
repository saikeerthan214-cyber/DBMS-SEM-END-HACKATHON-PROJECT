"""
Global exception handlers for the FastAPI gateway.

Registered on the FastAPI app in main.py so they catch errors raised
anywhere — in route handlers, dependencies, or middleware.
"""

import logging

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("gateway")


def _error_body(error: str, message: str, details=None) -> dict:
    payload: dict = {"error": error, "message": message}
    if details is not None:
        payload["details"] = details
    return payload


# ── Handler functions ─────────────────────────────────────────────────────────

async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Pydantic / FastAPI request-validation errors (422 Unprocessable Entity).
    Converts the internal error list into a flat, readable format.
    """
    errors = []
    for err in exc.errors():
        field = " → ".join(str(loc) for loc in err["loc"] if loc != "body")
        errors.append({"field": field or "body", "issue": err["msg"]})

    logger.warning("Validation error on %s %s: %s", request.method, request.url.path, errors)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_error_body(
            error="validation_error",
            message="Request body or parameters failed validation.",
            details=errors,
        ),
    )


async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """FastAPI HTTPException — preserves the detail payload."""
    if isinstance(exc.detail, dict):
        body = exc.detail
    else:
        body = _error_body(
            error="http_error",
            message=str(exc.detail),
        )

    logger.warning(
        "HTTP %d on %s %s — %s",
        exc.status_code, request.method, request.url.path, exc.detail,
    )
    return JSONResponse(status_code=exc.status_code, content=body)


async def starlette_http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Starlette-level HTTP exceptions (e.g. 404 Not Found from routing)."""
    logger.warning(
        "Starlette HTTP %d on %s %s",
        exc.status_code, request.method, request.url.path,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(
            error="not_found" if exc.status_code == 404 else "http_error",
            message=str(exc.detail),
        ),
    )


async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Catch-all for any unhandled exception — never expose internals."""
    logger.exception(
        "Unhandled exception on %s %s", request.method, request.url.path
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_error_body(
            error="internal_error",
            message="An unexpected error occurred. Please try again later.",
        ),
    )


# ── Registration helper ───────────────────────────────────────────────────────

def register_error_handlers(app: FastAPI) -> None:
    """Register all exception handlers onto *app*."""
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, starlette_http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
