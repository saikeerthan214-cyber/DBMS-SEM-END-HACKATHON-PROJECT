"""
API Gateway — FastAPI
Proxies all requests from the React frontend (port 5173)
to the Spring Boot backend (port 8081).
"""

import logging
import time
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from controllers.authenticationController import router as auth_router
from controllers.planController import router as plan_router
from controllers.subscriptionController import router as subscription_router
from utils.proxy import SPRING_BOOT_BASE

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("gateway")

TIMEOUT_SECONDS = 30.0


# ── Lifespan: shared async HTTP client ───────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.client = httpx.AsyncClient(
        base_url=SPRING_BOOT_BASE,
        timeout=TIMEOUT_SECONDS,
    )
    logger.info("✅ Gateway started — proxying to %s", SPRING_BOOT_BASE)
    yield
    await app.state.client.aclose()
    logger.info("🛑 Gateway shut down")


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Search Platform API Gateway",
    description="Proxies requests from the React frontend to Spring Boot backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request logging middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    logger.info("→ %s %s", request.method, request.url.path)
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "← %s %s  %d  %.1fms",
        request.method, request.url.path, response.status_code, elapsed,
    )
    return response


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(plan_router)
app.include_router(subscription_router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/gateway/health", tags=["Gateway"])
async def health_check():
    """Returns gateway status and checks Spring Boot connectivity."""
    try:
        client: httpx.AsyncClient = app.state.client
        resp = await client.get("/api/categories", timeout=5.0)
        backend_status = "reachable" if resp.status_code < 500 else "error"
    except Exception:
        backend_status = "unreachable"

    return {
        "status":         "gateway running",
        "gateway_port":   8000,
        "backend_url":    SPRING_BOOT_BASE,
        "backend_status": backend_status,
    }
