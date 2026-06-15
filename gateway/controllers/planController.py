"""
Items (Listings) routes — validates request bodies with Pydantic,
enforces JWT-based access control at the gateway layer,
then proxies to Spring Boot /api/items/*.

GET    /api/items              — public
GET    /api/items/{id}         — public
GET    /api/items/search       — public (keyword, categoryId, minPrice, maxPrice)
POST   /api/items              — ADMIN only
PUT    /api/items/{id}         — ADMIN only
DELETE /api/items/{id}         — ADMIN only
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Request, status
from fastapi.responses import Response

from schemas.items import ItemCreateRequest
from utils.jwt_guard import optional_auth, require_admin
from utils.proxy import proxy

router = APIRouter(prefix="/api/items", tags=["Items"])


# ── GET all ───────────────────────────────────────────────────
@router.get(
    "",
    summary="List all items",
    status_code=status.HTTP_200_OK,
    responses={200: {"description": "Array of all item objects"}},
)
async def get_all_items(request: Request) -> Response:
    """Returns every item in the catalogue. Publicly accessible."""
    return await proxy(request, "/api/items")


# ── GET search (must be declared BEFORE /{item_id}) ──────────
@router.get(
    "/search",
    summary="Search items by keyword, category, and/or price range",
    status_code=status.HTTP_200_OK,
    responses={200: {"description": "Filtered list of items"}},
)
async def search_items(
    request: Request,
    keyword:    str | None   = Query(default=None, description="Partial title match (case-insensitive)"),
    categoryId: int | None   = Query(default=None, ge=1, description="Filter by category ID"),
    minPrice:   float | None = Query(default=None, ge=0, description="Minimum price (INR)"),
    maxPrice:   float | None = Query(default=None, ge=0, description="Maximum price (INR)"),
    _claims: dict | None = Depends(optional_auth),
) -> Response:
    """
    Search items with optional filters.

    - **keyword** — matches anywhere in the title (case-insensitive)
    - **categoryId** — restricts to one category
    - **minPrice / maxPrice** — price range filter

    All parameters are optional. Omit all to return every item.
    """
    return await proxy(request, "/api/items/search")


# ── GET by ID ─────────────────────────────────────────────────
@router.get(
    "/{item_id}",
    summary="Get a single item by ID",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Item object"},
        404: {"description": "Item not found"},
    },
)
async def get_item_by_id(
    request: Request,
    item_id: Annotated[int, Path(ge=1, description="Item ID")],
) -> Response:
    """Fetch a single item by its ID. Publicly accessible."""
    return await proxy(request, f"/api/items/{item_id}")


# ── POST create ───────────────────────────────────────────────
@router.post(
    "",
    summary="Create a new item listing (Admin only)",
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Item created"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "ADMIN role required"},
        422: {"description": "Validation error — see details"},
    },
)
async def create_item(
    body: ItemCreateRequest,
    request: Request,
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """
    Add a new item to the catalogue. **Requires ADMIN token.**

    - **title** — required, 1–255 characters
    - **price** — optional, must be ≥ 0
    - **categoryId** — optional, must reference an existing category
    """
    return await proxy(request, "/api/items")


# ── PUT update ────────────────────────────────────────────────
@router.put(
    "/{item_id}",
    summary="Update an existing item (Admin only)",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Updated item"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "ADMIN role required"},
        404: {"description": "Item not found"},
        422: {"description": "Validation error — see details"},
    },
)
async def update_item(
    body: ItemCreateRequest,
    request: Request,
    item_id: Annotated[int, Path(ge=1, description="ID of the item to update")],
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """
    Partially or fully update an item by ID. **Requires ADMIN token.**

    Only supplied fields are updated; omitted fields keep their current values.
    """
    return await proxy(request, f"/api/items/{item_id}")


# ── DELETE ────────────────────────────────────────────────────
@router.delete(
    "/{item_id}",
    summary="Delete an item by ID (Admin only)",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Item deleted"},
        401: {"description": "Missing or invalid JWT token"},
        403: {"description": "ADMIN role required"},
        404: {"description": "Item not found"},
    },
)
async def delete_item(
    request: Request,
    item_id: Annotated[int, Path(ge=1, description="ID of the item to delete")],
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """Permanently delete an item by its ID. **Requires ADMIN token.**"""
    return await proxy(request, f"/api/items/{item_id}")
