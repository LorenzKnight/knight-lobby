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


def get_user_game_profile(user_id: int):
    result = select_from(
        table_name="user_game_profiles",
        columns=[
            "user_id",
            "level",
            "current_exp",
            "total_exp",
            "coins",
            "gems",
            "current_life",
            "max_life",
        ],
        where_clause={
            "user_id": user_id,
        },
        options={
            "fetch_first": True,
        },
    )

    if not result["success"] or not result["data"]:
        return None

    return result["data"]


def is_avatar_item_unlocked(user_id: int, item_key: str):
    result = select_from(
        table_name="user_avatar_unlocked_items",
        columns=[
            "user_avatar_unlocked_item_id",
            "user_id",
            "item_key",
        ],
        where_clause={
            "user_id": user_id,
            "item_key": item_key,
        },
        options={
            "fetch_first": True,
        },
    )

    return result["success"] and bool(result["data"])


def unlock_avatar_item(user_id: int, item, coins_paid: int):
    result = insert_into(
        table_name="user_avatar_unlocked_items",
        query_data={
            "user_id": user_id,
            "avatar_item_id": item["avatar_item_id"],
            "item_key": item["item_key"],
            "item_type": item["category"],
            "unlocked_by": "coins" if coins_paid > 0 else "free",
            "coins_paid": coins_paid,
        },
    )

    return result


def update_user_coins(user_id: int, new_coins: int):
    result = update_table(
        table_name="user_game_profiles",
        query_data={
            "coins": new_coins,
        },
        where_clause={
            "user_id": user_id,
        },
    )

    return result


def equip_avatar_item(user_id: int, item):
    current_item = select_from(
        table_name="user_avatar_items",
        columns=[
            "user_id",
            "category",
            "avatar_item_id",
        ],
        where_clause={
            "user_id": user_id,
            "category": item["category"],
        },
        options={
            "fetch_first": True,
        },
    )

    if current_item["success"] and current_item["data"]:
        return update_table(
            table_name="user_avatar_items",
            query_data={
                "avatar_item_id": item["avatar_item_id"],
            },
            where_clause={
                "user_id": user_id,
                "category": item["category"],
            },
        )

    return insert_into(
        table_name="user_avatar_items",
        query_data={
            "user_id": user_id,
            "category": item["category"],
            "avatar_item_id": item["avatar_item_id"],
        },
    )


def get_avatar_config_payload(user_id: int):
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

    if not result["success"]:
        return {
            "avatar_config": avatar_config,
            "equipped_items": equipped_items,
        }

    for item in result["data"]:
        config_key = avatar_category_to_config_key(item["category"])

        avatar_config[config_key] = item["item_key"]
        equipped_items[item["category"]] = item

    return {
        "avatar_config": avatar_config,
        "equipped_items": equipped_items,
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
            "price_coins",
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

    if not item_result["success"] or not item_result["data"]:
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

    profile = get_user_game_profile(payload.user_id)

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Game profile not found",
        )

    price_coins = int(item.get("price_coins") or 0)

    was_already_unlocked = is_avatar_item_unlocked(
        user_id=payload.user_id,
        item_key=item["item_key"],
    )

    was_purchased_now = False
    was_unlocked_now = False

    if price_coins > 0 and not was_already_unlocked:
        current_coins = int(profile.get("coins") or 0)

        if current_coins < price_coins:
            raise HTTPException(
                status_code=400,
                detail="Not enough coins",
            )

        new_coins = current_coins - price_coins

        coins_result = update_user_coins(
            user_id=payload.user_id,
            new_coins=new_coins,
        )

        if not coins_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=coins_result["message"],
            )

        unlock_result = unlock_avatar_item(
            user_id=payload.user_id,
            item=item,
            coins_paid=price_coins,
        )

        if not unlock_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=unlock_result["message"],
            )

        was_purchased_now = True
        was_unlocked_now = True

    elif price_coins == 0 and not was_already_unlocked:
        unlock_result = unlock_avatar_item(
            user_id=payload.user_id,
            item=item,
            coins_paid=0,
        )

        if not unlock_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=unlock_result["message"],
            )

        was_unlocked_now = True

    save_result = equip_avatar_item(
        user_id=payload.user_id,
        item=item,
    )

    if not save_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=save_result["message"],
        )

    config_key = avatar_category_to_config_key(item["category"])
    avatar_config_data = get_avatar_config_payload(payload.user_id)
    updated_profile = get_user_game_profile(payload.user_id)

    return {
        "success": True,
        "message": (
            "Avatar item purchased and equipped successfully"
            if was_purchased_now
            else "Avatar configuration saved successfully"
        ),
        "data": {
            "config_key": config_key,
            "item_key": item["item_key"],
            "category": item["category"],
            "avatar_item_id": item["avatar_item_id"],
            "image_url": item["image_url"],
            "thumbnail_url": item["thumbnail_url"],
            "price_coins": price_coins,
            "was_purchased_now": was_purchased_now,
            "was_unlocked_now": was_unlocked_now,
            "was_already_unlocked": was_already_unlocked,
            "avatar_config": avatar_config_data["avatar_config"],
            "equipped_items": avatar_config_data["equipped_items"],
            "game_profile": updated_profile,
        },
    }