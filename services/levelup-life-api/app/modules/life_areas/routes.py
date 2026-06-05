from fastapi import APIRouter, Query
from knight_core.functions import select_from

router = APIRouter(prefix="/api/life-areas", tags=["Life Areas"])


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