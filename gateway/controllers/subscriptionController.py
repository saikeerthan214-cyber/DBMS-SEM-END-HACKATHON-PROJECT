"""
Categories routes — proxies /api/categories/* to Spring Boot.
Called "subscription" to match gateway import naming.
"""
from fastapi import APIRouter, Request
from utils.proxy import proxy

router = APIRouter(tags=["Categories"])

@router.get("/api/categories")
async def get_all_categories(request: Request):
    return await proxy(request, "/api/categories")

@router.post("/api/categories")
async def add_category(request: Request):
    return await proxy(request, "/api/categories")

@router.delete("/api/categories/{category_id}")
async def delete_category(request: Request, category_id: int):
    return await proxy(request, f"/api/categories/{category_id}")
