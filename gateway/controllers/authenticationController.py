"""
Authentication routes — proxies /api/auth/* to Spring Boot.
"""
from fastapi import APIRouter, Request
from utils.proxy import proxy

router = APIRouter(tags=["Authentication"])

@router.post("/api/auth/register")
async def register(request: Request):
    return await proxy(request, "/api/auth/register")

@router.post("/api/auth/login")
async def login(request: Request):
    return await proxy(request, "/api/auth/login")
