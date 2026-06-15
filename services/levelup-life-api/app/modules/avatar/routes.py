from fastapi import APIRouter
from knight_core.functions import select_from

router = APIRouter(prefix="/api/avatar", tags=["Avatar"])


@router.get("/items")
def get_avatar_items():
    result = select_from(
        table_name="avatar_items",
        columns=[
            "avatar_item_id",
            "item_key",
            "category",
            "name",
            "image_url",
            "thumbnail_url",
            "price_coins",
            "is_default",
            "is_locked",
            "sort_order",
            "status",
        ],
        where_clause={
            "status": "active",
        },
        options={
            "order_by": "sort_order",
            "order_direction": "ASC",
        },
    )

    if not result["success"]:
        return {
            "success": False,
            "message": result["message"],
            "data": {},
        }

    grouped_items = {}

    for item in result["data"]:
        category = item["category"]

        if category not in grouped_items:
            grouped_items[category] = []

        grouped_items[category].append(item)

    return {
        "success": True,
        "message": "Avatar items loaded successfully",
        "data": grouped_items,
    }