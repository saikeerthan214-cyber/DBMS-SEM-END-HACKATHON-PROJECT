"""
Authentication routes — validates request bodies with Pydantic,
then proxies to Spring Boot /api/auth/*.

Public endpoints — no JWT required.
Stricter rate limit (20/minute) applied to prevent brute-force attacks.
"""

from fastapi import APIRouter, Request, status
from fastapi.responses import Response
from slowapi import Limiter
from slowapi.util import get_remote_address

from schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from utils.config import RATE_LIMIT_AUTH
from utils.proxy import proxy

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Auth-specific limiter — tighter than the global default
_limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    responses={
        201: {"description": "Account created successfully", "model": AuthResponse},
        400: {"description": "Username or email already taken"},
        422: {"description": "Validation error — check the details field"},
        429: {"description": "Rate limit exceeded — try again later"},
    },
)
@_limiter.limit(RATE_LIMIT_AUTH)
async def register(body: RegisterRequest, request: Request) -> Response:
    """
    Create a new user account.

    - **username** — 3–50 characters, alphanumeric + underscores
    - **email** — valid e-mail address
    - **password** — minimum 6 characters
    - **role** — optional, defaults to `USER`

    Returns a JWT token on success.
    """
    return await proxy(request, "/api/auth/register")


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    summary="Log in and receive a JWT token",
    responses={
        200: {"description": "Login successful", "model": AuthResponse},
        401: {"description": "Invalid credentials"},
        422: {"description": "Validation error — check the details field"},
        429: {"description": "Rate limit exceeded — try again later"},
    },
)
@_limiter.limit(RATE_LIMIT_AUTH)
async def login(body: LoginRequest, request: Request) -> Response:
    """
    Authenticate with username and password.

    Returns a signed JWT token and the user's role.
    Include the token as `Authorization: Bearer <token>` on subsequent requests.
    """
    return await proxy(request, "/api/auth/login")
