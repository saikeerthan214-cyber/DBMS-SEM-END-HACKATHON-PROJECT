"""
User management routes — ADMIN only.
Proxies to Spring Boot /api/users/*.

GET    /api/users        — list all users (ADMIN)
GET    /api/users/{id}   — get user by ID (ADMIN)
DELETE /api/users/{id}   — delete user (ADMIN)
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Request, status
from fastapi.responses import Response

from utils.jwt_guard import require_admin
from utils.proxy import proxy

router = APIRouter(prefix="/api/users", tags=["Users (Admin)"])


@router.get(
    "",
    summary="List all registered users (Admin only)",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Array of user objects (passwords excluded)"},
        401: {"description": "Missing or invalid JWT"},
        403: {"description": "ADMIN role required"},
    },
)
async def get_all_users(
    request: Request,
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """Returns all registered users. Passwords are never included. **Requires ADMIN token.**"""
    return await proxy(request, "/api/users")


@router.get(
    "/{user_id}",
    summary="Get a single user by ID (Admin only)",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "User object"},
        401: {"description": "Missing or invalid JWT"},
        403: {"description": "ADMIN role required"},
        404: {"description": "User not found"},
    },
)
async def get_user_by_id(
    request: Request,
    user_id: Annotated[int, Path(ge=1, description="User ID")],
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """Fetch a single user by ID. **Requires ADMIN token.**"""
    return await proxy(request, f"/api/users/{user_id}")


@router.delete(
    "/{user_id}",
    summary="Delete a user account (Admin only)",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "User deleted"},
        401: {"description": "Missing or invalid JWT"},
        403: {"description": "ADMIN role required"},
        404: {"description": "User not found"},
    },
)
async def delete_user(
    request: Request,
    user_id: Annotated[int, Path(ge=1, description="User ID to delete")],
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """Permanently delete a user account. **Requires ADMIN token.**"""
    return await proxy(request, f"/api/users/{user_id}")
