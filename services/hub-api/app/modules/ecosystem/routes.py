from fastapi import APIRouter, HTTPException
from knight_core.functions import select_from


router = APIRouter(
    prefix="/api/ecosystem",
    tags=["Ecosystem"]
)


@router.get("/apps")
def get_ecosystem_apps():
    try:
        result = select_from(
            table_name="ecosystem_apps",
            columns=[
                "app_id",
                "name",
                "slug",
                "description",
                "status",
                "portal_color",
                "icon",
                "route_url",
                "sort_order",
                "is_locked",
                "created_at",
            ],
            where_clause={},
            options={
                "order_by": "sort_order",
                "order_direction": "ASC",
            }
        )

        return {
            "success": result["success"],
            "message": "Ecosystem apps loaded successfully" if result["success"] else result["message"],
            "data": result["data"],
            "count": result["count"],
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(error)}"
        )