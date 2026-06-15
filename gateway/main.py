"""
SearchAI — FastAPI API Gateway  (port 8000)

Responsibilities:
  • Request validation via Pydantic schemas (fast failure before hitting backends)
  • JWT verification for protected routes (mirrors Spring Boot RBAC)
  • Rate limiting via slowapi
  • Transparent proxying to Spring Boot (port 8082) and Node.js (port 3001)
  • Uniform error responses across all routes
  • Request / response logging with timing
  • OpenAPI / Swagger UI at /docs  |  ReDoc at /redoc
"""

import logging
import time
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from controllers.authenticationController import router as auth_router
from controllers.nodeController import router as node_router
from controllers.planController import router as items_router
from controllers.subscriptionController import router as categories_router
from controllers.userController import router as users_router
from middleware.error_handler import register_error_handlers
from utils.config import (
    CORS_ORIGINS,
    NODE_BACKEND_BASE,
    RATE_LIMIT_DEFAULT,
    SPRING_BOOT_BASE,
    TIMEOUT_SECONDS,
)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("gateway")

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=[RATE_LIMIT_DEFAULT])


# ── Lifespan: manage shared async HTTP clients ────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # One persistent client per backend service — connection-pool reuse
    app.state.spring_client = httpx.AsyncClient(
        base_url=SPRING_BOOT_BASE,
        timeout=TIMEOUT_SECONDS,
        headers={"Accept": "application/json"},
    )
    app.state.node_client = httpx.AsyncClient(
        base_url=NODE_BACKEND_BASE,
        timeout=TIMEOUT_SECONDS,
        headers={"Accept": "application/json"},
    )
    logger.info("✅ Gateway started")
    logger.info("   Spring Boot  → %s", SPRING_BOOT_BASE)
    logger.info("   Node.js      → %s", NODE_BACKEND_BASE)
    logger.info("   Rate limit   → %s per IP", RATE_LIMIT_DEFAULT)

    yield  # ── application runs ─────────────────────────────────────────────

    await app.state.spring_client.aclose()
    await app.state.node_client.aclose()
    logger.info("🛑 Gateway shut down — HTTP clients closed")


# ── FastAPI application ───────────────────────────────────────────────────────
app = FastAPI(
    title="SearchAI — API Gateway",
    description=(
        "Central API gateway for the Multi-Category Search and Filter Platform.\n\n"
        "## Services behind the gateway\n"
        "| Service | Port | Responsibilities |\n"
        "|---------|------|------------------|\n"
        "| Spring Boot | 8082 | Auth (JWT), items, categories |\n"
        "| Node.js | 3001 | Search logs, reviews, saved items, activity |\n\n"
        "## Authentication\n"
        "Protected endpoints require a JWT token in the `Authorization: Bearer <token>` header.\n"
        "Obtain a token via `POST /api/auth/login`.\n\n"
        "## Rate limiting\n"
        f"Default: **{RATE_LIMIT_DEFAULT}** per client IP.  "
        "Auth endpoints: stricter limit applies."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "SearchAI Platform",
    },
    license_info={
        "name": "MIT",
    },
)

# ── Rate-limit exceeded handler ───────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global error handlers ─────────────────────────────────────────────────────
register_error_handlers(app)


# ── Request logging middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    logger.info("→ %s %s", request.method, request.url.path)
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "← %s %s  HTTP %d  %.1f ms",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(items_router)
app.include_router(categories_router)
app.include_router(users_router)
app.include_router(node_router)


# ── Gateway health endpoint ───────────────────────────────────────────────────
@app.get(
    "/gateway/health",
    tags=["Gateway"],
    summary="Gateway and backend connectivity check",
    response_description="Status of the gateway and all backend services",
)
async def health_check(request: Request):
    """
    Checks whether the gateway is running and probes each backend service.

    Returns a JSON object with connectivity status for:
    - The FastAPI gateway itself
    - Spring Boot (port 8082)
    - Node.js (port 3001)
    """
    spring_status = "unreachable"
    node_status = "unreachable"

    try:
        resp = await request.app.state.spring_client.get(
            "/api/categories", timeout=5.0
        )
        spring_status = "reachable" if resp.status_code < 500 else "error"
    except Exception:
        spring_status = "unreachable"

    try:
        resp = await request.app.state.node_client.get(
            "/node/health", timeout=5.0
        )
        node_status = "reachable" if resp.status_code < 500 else "error"
    except Exception:
        node_status = "unreachable"

    overall = (
        "healthy"
        if spring_status == "reachable" and node_status == "reachable"
        else "degraded"
    )

    return JSONResponse(
        status_code=200,
        content={
            "status": overall,
            "gateway": {
                "port": 8000,
                "version": "2.0.0",
            },
            "backends": {
                "spring_boot": {
                    "url": SPRING_BOOT_BASE,
                    "status": spring_status,
                },
                "node_js": {
                    "url": NODE_BACKEND_BASE,
                    "status": node_status,
                },
            },
        },
    )
