"""
Pydantic schemas for category endpoints.
"""

from pydantic import BaseModel, Field


class CategoryCreateRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        examples=["Electronics"],
        description="Category name (unique)",
    )
    description: str | None = Field(
        default=None,
        max_length=500,
        examples=["Gadgets and electronic devices"],
        description="Optional category description",
    )

    model_config = {"json_schema_extra": {"example": {
        "name": "Electronics",
        "description": "Gadgets and electronic devices",
    }}}
