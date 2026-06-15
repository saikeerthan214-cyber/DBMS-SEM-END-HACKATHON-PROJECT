"""
Pydantic schemas for Node.js backend endpoints (search logs, reviews,
saved items, user activity).
"""

from pydantic import BaseModel, Field


# ── Search Logs ───────────────────────────────────────────────────────────────

class SearchLogCreate(BaseModel):
    keyword: str = Field(
        ...,
        min_length=1,
        max_length=255,
        examples=["laptop"],
        description="Search keyword that was entered",
    )
    username: str | None = Field(
        default="anonymous",
        max_length=100,
        examples=["alice"],
        description="Username performing the search (anonymous if not logged in)",
    )
    results: int | None = Field(
        default=0,
        ge=0,
        examples=[5],
        description="Number of results returned",
    )

    model_config = {"json_schema_extra": {"example": {
        "keyword": "laptop",
        "username": "alice",
        "results": 5,
    }}}


# ── Reviews ───────────────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    itemId: int = Field(..., ge=1, examples=[1], description="ID of the item being reviewed")
    itemTitle: str | None = Field(default=None, max_length=255, examples=["Laptop"])
    username: str = Field(..., min_length=1, max_length=100, examples=["alice"])
    rating: int = Field(..., ge=1, le=5, examples=[4], description="Rating from 1 to 5")
    comment: str | None = Field(default=None, max_length=1000, examples=["Great product!"])

    model_config = {"json_schema_extra": {"example": {
        "itemId": 1,
        "itemTitle": "Laptop",
        "username": "alice",
        "rating": 4,
        "comment": "Great product, fast delivery!",
    }}}


# ── Saved Items ───────────────────────────────────────────────────────────────

class SavedItemCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=100, examples=["alice"])
    itemId: int = Field(..., ge=1, examples=[1])
    itemTitle: str | None = Field(default=None, max_length=255, examples=["Laptop"])
    category: str | None = Field(default=None, max_length=100, examples=["Electronics"])
    price: float | None = Field(default=None, ge=0, examples=[55000.0])

    model_config = {"json_schema_extra": {"example": {
        "username": "alice",
        "itemId": 1,
        "itemTitle": "Laptop",
        "category": "Electronics",
        "price": 55000.0,
    }}}


# ── User Activity ─────────────────────────────────────────────────────────────

class ActivityCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=100, examples=["alice"])
    action: str = Field(
        ...,
        min_length=1,
        max_length=100,
        examples=["search"],
        description="Action performed (e.g. search, view, save)",
    )
    target: str | None = Field(default=None, max_length=255, examples=["laptop"])
    metadata: dict | None = Field(default=None, description="Optional arbitrary metadata")

    model_config = {"json_schema_extra": {"example": {
        "username": "alice",
        "action": "search",
        "target": "laptop",
        "metadata": {"results": 5},
    }}}
