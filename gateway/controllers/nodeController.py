"""
Node.js backend routes — validates request bodies with Pydantic,
then proxies to the Node.js backend on port 3001.

PostgreSQL routes: search logs, trending keywords, analytics
MongoDB routes:    reviews, saved items, user activity
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Request, status
from fastapi.responses import Response

from schemas.node import (
    ActivityCreate,
    ReviewCreate,
    SavedItemCreate,
    SearchLogCreate,
)
from utils.jwt_guard import require_admin, require_auth
from utils.proxy import proxy_node

router = APIRouter(prefix="/node", tags=["Node.js — Analytics & Social"])


# ── Health ────────────────────────────────────────────────────────────────────

@router.get(
    "/health",
    summary="Node.js backend health check",
    status_code=status.HTTP_200_OK,
)
async def node_health(request: Request) -> Response:
    """
    Returns connectivity status for the Node.js service, PostgreSQL, and MongoDB Atlas.
    """
    return await proxy_node(request, "/node/health")


# ── Search Logs (PostgreSQL) ──────────────────────────────────────────────────

@router.get(
    "/search-logs",
    summary="Retrieve recent search logs (Admin only)",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "List of the 100 most recent search logs"},
        401: {"description": "Authentication required"},
        403: {"description": "Admin role required"},
    },
)
async def get_search_logs(
    request: Request,
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """Returns the 100 most recent search log entries. **Admin only.**"""
    return await proxy_node(request, "/node/search-logs")


@router.post(
    "/search-logs",
    summary="Log a search event",
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Log entry created"},
        422: {"description": "Validation error"},
    },
)
async def create_search_log(body: SearchLogCreate, request: Request) -> Response:
    """
    Record a search event.  Called automatically by the frontend after every search.

    - **keyword** — the search term (required)
    - **username** — defaults to `anonymous` for unauthenticated users
    - **results** — number of results returned
    """
    return await proxy_node(request, "/node/search-logs")


@router.delete(
    "/search-logs/{log_id}",
    summary="Delete a search log entry (Admin only)",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Deleted"},
        401: {"description": "Authentication required"},
        403: {"description": "Admin role required"},
    },
)
async def delete_search_log(
    request: Request,
    log_id: Annotated[int, Path(ge=1, description="ID of the log entry to delete")],
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """Delete a specific search log entry by ID. **Admin only.**"""
    return await proxy_node(request, f"/node/search-logs/{log_id}")


# ── Trending & Analytics (PostgreSQL) ────────────────────────────────────────

@router.get(
    "/trending",
    summary="Top 10 trending search keywords",
    status_code=status.HTTP_200_OK,
)
async def get_trending(request: Request) -> Response:
    """
    Returns the 10 most frequently searched keywords across all users.
    No authentication required.
    """
    return await proxy_node(request, "/node/trending")


@router.get(
    "/analytics",
    summary="Platform-wide statistics (Admin only)",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Aggregated counts for searches, items, users, reviews, etc."},
        401: {"description": "Authentication required"},
        403: {"description": "Admin role required"},
    },
)
async def get_analytics(
    request: Request,
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """
    Returns aggregated platform statistics:
    total searches, listings, categories, users, reviews, and saved items.

    **Admin only.**
    """
    return await proxy_node(request, "/node/analytics")


# ── Reviews (MongoDB) ─────────────────────────────────────────────────────────

@router.get(
    "/reviews",
    summary="Get reviews (optionally filtered by itemId)",
    status_code=status.HTTP_200_OK,
)
async def get_reviews(
    request: Request,
    itemId: int | None = Query(default=None, ge=1, description="Filter reviews by item ID"),
) -> Response:
    """
    Returns all reviews, or reviews for a specific item when `itemId` is provided.
    No authentication required.
    """
    return await proxy_node(request, "/node/reviews")


@router.post(
    "/reviews",
    summary="Submit a review for an item",
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Review created"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"},
    },
)
async def create_review(
    body: ReviewCreate,
    request: Request,
    _claims: Annotated[dict, Depends(require_auth)],
) -> Response:
    """
    Submit a star rating and optional comment for an item.
    **Requires authentication.**

    - **rating** — 1 to 5 stars
    - **comment** — optional text review
    """
    return await proxy_node(request, "/node/reviews")


@router.delete(
    "/reviews/{review_id}",
    summary="Delete a review (Admin only)",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Deleted"},
        401: {"description": "Authentication required"},
        403: {"description": "Admin role required"},
    },
)
async def delete_review(
    request: Request,
    review_id: Annotated[str, Path(description="MongoDB ObjectId of the review")],
    _claims: Annotated[dict, Depends(require_admin)],
) -> Response:
    """Delete a specific review by its MongoDB ObjectId. **Admin only.**"""
    return await proxy_node(request, f"/node/reviews/{review_id}")


# ── Saved Items (MongoDB) ─────────────────────────────────────────────────────

@router.get(
    "/saved-items/{username}",
    summary="Get saved items for a user",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "List of saved items"},
        401: {"description": "Authentication required"},
    },
)
async def get_saved_items(
    request: Request,
    username: Annotated[str, Path(description="Username to fetch saved items for")],
    _claims: Annotated[dict, Depends(require_auth)],
) -> Response:
    """
    Returns all items saved/bookmarked by the specified user.
    **Requires authentication.**
    """
    return await proxy_node(request, f"/node/saved-items/{username}")


@router.post(
    "/saved-items",
    summary="Save / bookmark an item",
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Item saved"},
        401: {"description": "Authentication required"},
        409: {"description": "Item already saved by this user"},
        422: {"description": "Validation error"},
    },
)
async def save_item(
    body: SavedItemCreate,
    request: Request,
    _claims: Annotated[dict, Depends(require_auth)],
) -> Response:
    """
    Bookmark an item for the authenticated user.
    Returns HTTP 409 if the item is already saved.
    **Requires authentication.**
    """
    return await proxy_node(request, "/node/saved-items")


@router.delete(
    "/saved-items/{saved_id}",
    summary="Remove a saved item",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Removed"},
        401: {"description": "Authentication required"},
    },
)
async def delete_saved_item(
    request: Request,
    saved_id: Annotated[str, Path(description="MongoDB ObjectId of the saved-item document")],
    _claims: Annotated[dict, Depends(require_auth)],
) -> Response:
    """Remove a saved item document by its MongoDB ObjectId. **Requires authentication.**"""
    return await proxy_node(request, f"/node/saved-items/{saved_id}")


# ── User Activity (MongoDB) ───────────────────────────────────────────────────

@router.get(
    "/activity/{username}",
    summary="Get recent activity for a user",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Up to 50 most recent activity events"},
        401: {"description": "Authentication required"},
    },
)
async def get_activity(
    request: Request,
    username: Annotated[str, Path(description="Username to fetch activity for")],
    _claims: Annotated[dict, Depends(require_auth)],
) -> Response:
    """
    Returns the 50 most recent activity events (searches, views, saves, etc.)
    for the specified user.  **Requires authentication.**
    """
    return await proxy_node(request, f"/node/activity/{username}")


@router.post(
    "/activity",
    summary="Record a user activity event",
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Activity event recorded"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error"},
    },
)
async def record_activity(
    body: ActivityCreate,
    request: Request,
    _claims: Annotated[dict, Depends(require_auth)],
) -> Response:
    """
    Append an activity event for a user.  Called by the frontend on key interactions.
    **Requires authentication.**

    - **action** — e.g. `search`, `view`, `save`, `delete`
    - **target** — item title, category name, or search keyword
    - **metadata** — any extra key/value data as a JSON object
    """
    return await proxy_node(request, "/node/activity")
