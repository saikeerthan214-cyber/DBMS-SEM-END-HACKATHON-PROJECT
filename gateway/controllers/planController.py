"""
Items (Listings) routes — proxies /api/items/* to Spring Boot.
Called "plan" to match gateway import naming.
"""
from fastapi import APIRouter, Request
from utils.proxy import proxy

router = APIRouter(tags=["Items"])

@router.get("/api/items")
async def get_all_items(request: Request):
    return await proxy(request, "/api/items")

@router.get("/api/items/search")
async def search_items(request: Request):
    return await proxy(request, "/api/items/search")

@router.post("/api/items")
async def add_item(request: Request):
    return await proxy(request, "/api/items")

@router.delete("/api/items/{item_id}")
async def delete_item(request: Request, item_id: int):
    return await proxy(request, f"/api/items/{item_id}")
