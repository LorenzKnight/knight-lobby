from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from knight_core.functions import select_from, insert_into

router = APIRouter(prefix="/api/life-areas", tags=["Life Areas"])

class LifeAreaCreateRequest(BaseModel):
    user_id: int
    name: str
    slug: str
    icon: str = "✨"
    description: str | None = None
    color: str = "#7a58b4"
    sort_order: int = 0


@router.get("")
def get_life_areas(user_id: int = Query(...)):
    result = select_from(
        table_name="life_areas",
        columns=[
            "life_area_id",
            "user_id",
            "name",
            "slug",
            "icon",
            "description",
            "color",
            "sort_order",
            "status",
            "created_at",
        ],
        where_clause={
            "user_id": user_id,
            "status": "active",
        },
        options={
            "order_by": "sort_order",
            "order_direction": "ASC",
        },
    )

    return {
        "success": result["success"],
        "message": "Life areas loaded successfully" if result["success"] else result["message"],
        "data": result["data"],
        "count": result["count"],
    }


@router.post("")
def create_life_area(payload: LifeAreaCreateRequest):
    insert_result = insert_into(
        table_name="life_areas",
        query_data={
            "user_id": payload.user_id,
            "name": payload.name,
            "slug": payload.slug,
            "icon": payload.icon,
            "description": payload.description,
            "color": payload.color,
            "sort_order": payload.sort_order,
            "status": "active",
        },
        options={
            "id": "life_area_id",
        },
    )

    if not insert_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=insert_result["message"],
        )

    created_area = select_from(
        table_name="life_areas",
        columns=[
            "life_area_id",
            "user_id",
            "name",
            "slug",
            "icon",
            "description",
            "color",
            "sort_order",
            "status",
            "created_at",
        ],
        where_clause={
            "life_area_id": insert_result["id"],
        },
        options={
            "fetch_first": True,
        },
    )

    return {
        "success": True,
        "message": "Life area created successfully",
        "data": created_area["data"],
    }