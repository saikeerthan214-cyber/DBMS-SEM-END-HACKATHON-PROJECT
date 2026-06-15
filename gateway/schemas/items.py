"""
Pydantic schemas for item (listing) endpoints.
"""

from pydantic import BaseModel, Field, field_validator


class ItemCreateRequest(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        examples=["Wireless Keyboard"],
        description="Item title",
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
        examples=["Compact mechanical keyboard with backlight"],
        description="Optional item description",
    )
    price: float | None = Field(
        default=None,
        ge=0,
        examples=[1299.99],
        description="Price in INR (must be ≥ 0)",
    )
    categoryId: int | None = Field(
        default=None,
        ge=1,
        examples=[1],
        description="ID of the category this item belongs to",
    )

    @field_validator("price")
    @classmethod
    def price_precision(cls, v: float | None) -> float | None:
        if v is not None:
            # round to 2 decimal places
            return round(v, 2)
        return v

    model_config = {"json_schema_extra": {"example": {
        "title": "Wireless Keyboard",
        "description": "Compact mechanical keyboard with RGB backlight",
        "price": 1299.99,
        "categoryId": 1,
    }}}


class SearchParams(BaseModel):
    """Query-parameter schema for item search (used for documentation only)."""
    keyword: str | None = Field(default=None, description="Search keyword")
    categoryId: int | None = Field(default=None, ge=1, description="Filter by category ID")
