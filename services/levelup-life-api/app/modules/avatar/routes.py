from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from knight_core.functions import select_from, insert_into, update_table

router = APIRouter(prefix="/api/avatar", tags=["Avatar"])


class AvatarConfigRequest(BaseModel):
    user_id: int
    item_key: str


def avatar_category_to_config_key(category: str) -> str:
    category_map = {
        "caps": "cap",
        "shirts": "shirt",
        "legs": "legs",
        "feets": "feets",
        "bags": "bag",
    }

    return category_map.get(category, category)


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


@router.get("/config")
def get_avatar_config(user_id: int = Query(...)):
    result = select_from(
        table_name="""
            user_avatar_items AS uai
            INNER JOIN avatar_items AS ai
                ON ai.avatar_item_id = uai.avatar_item_id
        """,
        columns=[
            "ai.avatar_item_id",
            "ai.item_key",
            "ai.category",
            "ai.name",
            "ai.image_url",
            "ai.thumbnail_url",
            "ai.price_coins",
            "ai.is_locked",
        ],
        where_clause={
            "uai.user_id": user_id,
        },
        options={
            "order_by": "ai.category",
            "order_direction": "ASC",
        },
    )

    avatar_config = {}
    equipped_items = {}

    for item in result["data"]:
        config_key = avatar_category_to_config_key(item["category"])

        avatar_config[config_key] = item["item_key"]
        equipped_items[item["category"]] = item

    return {
        "success": True,
        "message": "Avatar configuration loaded successfully",
        "data": {
            "avatar_config": avatar_config,
            "equipped_items": equipped_items,
        },
        "count": result["count"],
    }


@router.put("/config")
def save_avatar_config(payload: AvatarConfigRequest):
    item_result = select_from(
        table_name="avatar_items",
        columns=[
            "avatar_item_id",
            "item_key",
            "category",
            "name",
            "image_url",
            "thumbnail_url",
            "is_locked",
            "status",
        ],
        where_clause={
            "item_key": payload.item_key,
            "status": "active",
        },
        options={
            "fetch_first": True,
        },
    )

    if not item_result["success"]:
        raise HTTPException(
            status_code=404,
            detail="Avatar item not found",
        )

    item = item_result["data"]

    if item["is_locked"]:
        raise HTTPException(
            status_code=403,
            detail="Avatar item is locked",
        )

    current_item = select_from(
        table_name="user_avatar_items",
        columns=[
            "user_id",
            "category",
            "avatar_item_id",
        ],
        where_clause={
            "user_id": payload.user_id,
            "category": item["category"],
        },
        options={
            "fetch_first": True,
        },
    )

    if current_item["success"]:
        save_result = update_table(
            table_name="user_avatar_items",
            query_data={
                "avatar_item_id": item["avatar_item_id"],
            },
            where_clause={
                "user_id": payload.user_id,
                "category": item["category"],
            },
        )
    else:
        save_result = insert_into(
            table_name="user_avatar_items",
            query_data={
                "user_id": payload.user_id,
                "category": item["category"],
                "avatar_item_id": item["avatar_item_id"],
            },
        )

    if not save_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=save_result["message"],
        )

    config_key = avatar_category_to_config_key(item["category"])

    return {
        "success": True,
        "message": "Avatar configuration saved successfully",
        "data": {
            "config_key": config_key,
            "item_key": item["item_key"],
            "category": item["category"],
            "avatar_item_id": item["avatar_item_id"],
            "image_url": item["image_url"],
            "thumbnail_url": item["thumbnail_url"],
        },
    }