"""
Category routes — validates request bodies with Pydantic,
enforces JWT-based access control at the gateway layer,
then proxies to Spring Boot /api/categories/*.

GET    /api/categories              — public
GET    /api/categories/{id}         — public
GET    /api/categories/{id}/item-count — public
POST   /api/categories              — ADMIN only
PUT    /api/categories/{id}         — ADMIN only
DELETE /api/categories/{id}         — ADMIN only
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Request, status
from fastapi.responses import Response

from schemas.categories import CategoryCreateRequest
from utils.jwt_guard import require_admin
from utils.proxy import proxy

router = APIRouter(prefix="/api/categories", tags=["Categories"])


# ── GET all ───────────────────────────────────────────────────
@router.get(
    "",
    summary="List all categories",
    status_code=status.HTTP_200_OK,
    responses={200: {"description": "Array of category objects"}},
)
async def get_all_categories(request: Request) -> Response:
    """Returns all categories. Publicly accessible."""
    return await proxy(request, "/api/categories")


# ── GET by ID ─────────────────────────────────────────────────
@router.get(
    "/{category_id}",
    summary="Get a single category by ID",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Category object"},
        404: {"description": "Category not found"},
    },
)
async def get_category_by_id(
    request: Request,
    category_id: Annotated[int, Path(ge=1, description="Category ID")],
) -> Response:
    """Fetch a single category by its ID. Publicly accessible."""
    return await proxy(request, f"/api/categories/{category_id}")


# ── GET item count ────────────────────────────────────────────
@router.get(
    "/{category_id}/item-count",
    summary="Count items in a category",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Item count for the category"},
        404: {"description": "Category not found"},
    },
)
async def get_item_count(
    request: Request,
    category_id: Annotated[int, Path(ge=1, description="Category ID")],
) -> Response:
    """Returns how many items belong to this category. Publicly accessible."""
    return await proxy(request, f"/api/categories/{category_id}/item-count")


# ── POST create ───────────────────────────────────────────────
@router.post(
    "",
    summary="Create a new category (Admin only)",
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Category created"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "ADMIN role required"},
        409: {"description": "Category name already exists"},
        422: {"description": "Validation error — see details"},
    },
)
async def create_category(
    body: CategoryCreateRequest,
    request: Request,
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """
    Add a new category. **Requires ADMIN token.**

    - **name** — required, unique, 1–100 characters
    - **description** — optional
    """
    return await proxy(request, "/api/categories")


# ── PUT update ────────────────────────────────────────────────
@router.put(
    "/{category_id}",
    summary="Update a category by ID (Admin only)",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Updated category"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "ADMIN role required"},
        404: {"description": "Category not found"},
        409: {"description": "New name already taken"},
        422: {"description": "Validation error — see details"},
    },
)
async def update_category(
    body: CategoryCreateRequest,
    request: Request,
    category_id: Annotated[int, Path(ge=1, description="ID of the category to update")],
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """Update an existing category's name or description. **Requires ADMIN token.**"""
    return await proxy(request, f"/api/categories/{category_id}")


# ── DELETE ────────────────────────────────────────────────────
@router.delete(
    "/{category_id}",
    summary="Delete a category by ID (Admin only)",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Category deleted"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "ADMIN role required"},
        404: {"description": "Category not found"},
    },
)
async def delete_category(
    request: Request,
    category_id: Annotated[int, Path(ge=1, description="ID of the category to delete")],
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """
    Permanently delete a category. Items linked to it will have
    `category_id` set to NULL (FK ON DELETE SET NULL). **Requires ADMIN token.**
    """
    return await proxy(request, f"/api/categories/{category_id}")
