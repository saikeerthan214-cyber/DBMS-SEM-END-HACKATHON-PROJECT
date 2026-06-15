"""
Pydantic schemas for authentication endpoints.
These are validated at the gateway before the request reaches Spring Boot,
giving fast, readable errors without a round-trip to the backend.
"""

import re

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        examples=["alice"],
        description="Unique username (3–50 characters, alphanumeric + underscores)",
    )
    email: EmailStr = Field(
        ...,
        examples=["alice@example.com"],
        description="Valid e-mail address",
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        examples=["Secret@123"],
        description="Password (min 6 characters)",
    )
    role: str | None = Field(
        default=None,
        examples=["USER"],
        description="Optional role override — defaults to USER",
    )

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not re.fullmatch(r"[A-Za-z0-9_]+", v):
            raise ValueError("username may only contain letters, numbers, and underscores")
        return v

    @field_validator("role")
    @classmethod
    def role_valid(cls, v: str | None) -> str | None:
        if v is not None and v.upper() not in {"USER", "ADMIN"}:
            raise ValueError("role must be USER or ADMIN")
        return v.upper() if v else v

    model_config = {"json_schema_extra": {"example": {
        "username": "alice",
        "email": "alice@example.com",
        "password": "Secret@123",
        "role": "USER",
    }}}


class LoginRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=1,
        max_length=50,
        examples=["alice"],
        description="Registered username",
    )
    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
        examples=["Secret@123"],
        description="Account password",
    )

    model_config = {"json_schema_extra": {"example": {
        "username": "alice",
        "password": "Secret@123",
    }}}


class AuthResponse(BaseModel):
    token: str = Field(description="JWT Bearer token")
    role: str = Field(description="User role: USER or ADMIN")
    username: str = Field(description="Authenticated username")
