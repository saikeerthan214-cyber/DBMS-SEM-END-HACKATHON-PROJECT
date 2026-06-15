"""
Gateway-level JWT verification dependency.

The gateway does NOT issue tokens — it only validates them so it can
enforce access control before forwarding to Spring Boot.

Usage:
    # Any authenticated user
    @router.get("/protected")
    async def handler(claims: dict = Depends(require_auth)):
        ...

    # Admin-only endpoint
    @router.post("/admin-only")
    async def handler(claims: dict = Depends(require_admin)):
        ...
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from utils.config import JWT_ALGORITHM, JWT_SECRET

try:
    from jose import JWTError, jwt
except ImportError as exc:
    raise RuntimeError(
        "python-jose is required. Run: pip install python-jose[cryptography]"
    ) from exc

_bearer = HTTPBearer(auto_error=True)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail={"error": "invalid_token", "message": "Could not validate credentials."},
    headers={"WWW-Authenticate": "Bearer"},
)

_FORBIDDEN_EXCEPTION = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail={"error": "forbidden", "message": "Insufficient permissions."},
)


def _decode(token: str) -> dict:
    """Decode and validate a JWT, raising HTTP 401 on any failure."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise _CREDENTIALS_EXCEPTION


async def require_auth(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> dict:
    """
    FastAPI dependency — resolves to the decoded JWT claims dict.
    Raises HTTP 401 if the token is missing, malformed, or expired.
    """
    return _decode(credentials.credentials)


async def require_admin(
    claims: Annotated[dict, Depends(require_auth)],
) -> dict:
    """
    FastAPI dependency — like require_auth but also enforces ROLE_ADMIN.
    Raises HTTP 403 if the authenticated user is not an admin.
    """
    role: str = claims.get("role", "")
    if role.upper() != "ADMIN":
        raise _FORBIDDEN_EXCEPTION
    return claims


def optional_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
) -> dict | None:
    """
    FastAPI dependency — returns claims if a valid token is provided,
    or None for unauthenticated requests.  Does NOT raise on missing token.
    """
    if credentials is None:
        return None
    try:
        return _decode(credentials.credentials)
    except HTTPException:
        return None
