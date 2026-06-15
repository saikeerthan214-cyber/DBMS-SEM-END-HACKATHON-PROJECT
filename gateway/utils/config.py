"""
Centralised gateway configuration.
All service URLs and tuneable knobs live here — change once, applies everywhere.
"""

import os

# ── Backend service base URLs ─────────────────────────────────────────────────
SPRING_BOOT_BASE: str = os.getenv("SPRING_BOOT_BASE", "http://127.0.0.1:8082")
NODE_BACKEND_BASE: str = os.getenv("NODE_BACKEND_BASE", "http://127.0.0.1:3001")

# ── JWT ───────────────────────────────────────────────────────────────────────
# Must match jwt.secret in backend/src/main/resources/application.properties
JWT_SECRET: str = os.getenv(
    "JWT_SECRET",
    "MySuperSecretKeyForJWTAuthenticationPlatform2024",
)
JWT_ALGORITHM: str = "HS256"

# ── HTTP client timeouts (seconds) ────────────────────────────────────────────
TIMEOUT_SECONDS: float = float(os.getenv("GATEWAY_TIMEOUT", "30"))

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# ── Rate-limiting defaults ────────────────────────────────────────────────────
# Format understood by slowapi: "N/second|minute|hour"
RATE_LIMIT_DEFAULT: str = os.getenv("RATE_LIMIT_DEFAULT", "120/minute")
RATE_LIMIT_AUTH: str = os.getenv("RATE_LIMIT_AUTH", "20/minute")
