from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta

from knight_core.functions import select_from, insert_into, update_table

router = APIRouter(
    prefix="/api/shop",
    tags=["Shop"],
)

class PurchaseShopItemRequest(BaseModel):
    user_id: int
    item_key: str


def get_data_or_empty(result):
    if result["success"]:
        return result["data"] or []

    message = str(result.get("message", ""))

    if "No records found" in message:
        return []

    raise HTTPException(
        status_code=400,
        detail=message or "Database query failed.",
    )


def get_first_or_none(result):
    data = get_data_or_empty(result)

    if len(data) == 0:
        return None

    return data[0]


def get_shop_item_by_key(item_key: str):
    item_result = select_from(
        table_name="shop_items",
        columns=[
            "shop_item_id",
            "item_key",
            "name",
            "description",
            "price",
            "old_price",
            "currency",
            "discount_label",
            "image_emoji",
            "image_url",
            "item_type",
            "effect_type",
            "effect_value",
            "duration_minutes",
            "is_active",
        ],
        where_clause={
            "item_key": item_key,
            "is_active": True,
        },
    )

    return get_first_or_none(item_result)


def get_user_game_profile(user_id: int):
    profile_result = select_from(
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
    )

    return get_first_or_none(profile_result)


def get_price_as_number(price):
    try:
        return int(price)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid item price.",
        )


def ensure_user_can_pay(profile: dict, item: dict):
    currency = item["currency"]

    if currency == "real":
        raise HTTPException(
            status_code=400,
            detail="Real money purchases are not available yet.",
        )

    price = get_price_as_number(item["price"])

    if currency == "gem":
        if profile["gems"] < price:
            raise HTTPException(
                status_code=400,
                detail="Not enough gems.",
            )

        return {
            "coins": profile["coins"],
            "gems": profile["gems"] - price,
        }

    if currency == "coin":
        if profile["coins"] < price:
            raise HTTPException(
                status_code=400,
                detail="Not enough coins.",
            )

        return {
            "coins": profile["coins"] - price,
            "gems": profile["gems"],
        }

    raise HTTPException(
        status_code=400,
        detail="Invalid item currency.",
    )


def apply_immediate_life_effect(profile: dict, item: dict, wallet_update: dict):
    effect_type = item["effect_type"]

    current_life = profile["current_life"]
    max_life = profile["max_life"]

    if effect_type == "recover_life":
        if current_life >= max_life:
            raise HTTPException(
                status_code=400,
                detail="Your life is already full.",
            )

        life_to_recover = int(item["effect_value"] or 1)
        new_current_life = min(max_life, current_life + life_to_recover)

        return {
            **wallet_update,
            "current_life": new_current_life,
            "updated_at": datetime.now(timezone.utc),
        }

    if effect_type == "recover_full_life":
        if current_life >= max_life:
            raise HTTPException(
                status_code=400,
                detail="Your life is already full.",
            )

        return {
            **wallet_update,
            "current_life": max_life,
            "updated_at": datetime.now(timezone.utc),
        }

    return {
        **wallet_update,
        "updated_at": datetime.now(timezone.utc),
    }


def create_shop_purchase(user_id: int, item: dict):
    purchase_result = insert_into(
        table_name="shop_purchases",
        query_data={
            "user_id": user_id,
            "shop_item_id": item["shop_item_id"],
            "item_key": item["item_key"],
            "item_name": item["name"],
            "price_paid": item["price"],
            "currency": item["currency"],
            "effect_type": item["effect_type"],
            "effect_value": item["effect_value"],
            "duration_minutes": item["duration_minutes"],
            "purchase_status": "completed",
        },
    )

    if not purchase_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=purchase_result.get("message", "Could not create purchase."),
        )

    return purchase_result


def add_or_update_inventory_item(user_id: int, item: dict):
    inventory_result = select_from(
        table_name="user_inventory_items",
        columns=[
            "user_inventory_item_id",
            "quantity",
        ],
        where_clause={
            "user_id": user_id,
            "item_key": item["item_key"],
        },
    )

    inventory_item = get_first_or_none(inventory_result)

    if inventory_item:
        update_result = update_table(
            table_name="user_inventory_items",
            query_data={
                "quantity": inventory_item["quantity"] + 1,
                "updated_at": datetime.now(timezone.utc),
            },
            where_clause={
                "user_inventory_item_id": inventory_item["user_inventory_item_id"],
            },
        )

        if not update_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=update_result.get("message", "Could not update inventory."),
            )

        return

    insert_result = insert_into(
        table_name="user_inventory_items",
        query_data={
            "user_id": user_id,
            "shop_item_id": item["shop_item_id"],
            "item_key": item["item_key"],
            "item_name": item["name"],
            "quantity": 1,
            "item_type": item["item_type"],
            "effect_type": item["effect_type"],
            "effect_value": item["effect_value"],
            "duration_minutes": item["duration_minutes"],
            "is_used": False,
        },
    )

    if not insert_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=insert_result.get("message", "Could not add item to inventory."),
        )


def create_active_boost(user_id: int, item: dict):
    duration_minutes = item["duration_minutes"] or 30

    insert_result = insert_into(
        table_name="user_active_boosts",
        query_data={
            "user_id": user_id,
            "shop_item_id": item["shop_item_id"],
            "item_key": item["item_key"],
            "item_name": item["name"],
            "boost_type": item["effect_type"],
            "boost_value": item["effect_value"] or 1,
            "starts_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=duration_minutes),
            "is_active": True,
        },
    )

    if not insert_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=insert_result.get("message", "Could not activate boost."),
        )


def create_active_protection(user_id: int, item: dict):
    duration_minutes = item["duration_minutes"]

    expires_at = None

    if duration_minutes:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)

    insert_result = insert_into(
        table_name="user_active_protections",
        query_data={
            "user_id": user_id,
            "shop_item_id": item["shop_item_id"],
            "item_key": item["item_key"],
            "item_name": item["name"],
            "protection_type": item["effect_type"],
            "protection_value": item["effect_value"] or 1,
            "starts_at": datetime.now(timezone.utc),
            "expires_at": expires_at,
            "is_active": True,
            "is_used": False,
        },
    )

    if not insert_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=insert_result.get("message", "Could not activate protection."),
        )


@router.get("/items")
def get_shop_items():
    categories_result = select_from(
        table_name="shop_categories",
        columns=[
            "shop_category_id",
            "category_key",
            "title",
            "description",
            "icon_key",
            "sort_order",
        ],
        where_clause={
            "is_active": True,
        },
    )

    categories = get_data_or_empty(categories_result)

    items_result = select_from(
        table_name="shop_items",
        columns=[
            "shop_item_id",
            "shop_category_id",
            "item_key",
            "name",
            "description",
            "price",
            "old_price",
            "currency",
            "discount_label",
            "image_emoji",
            "image_url",
            "item_type",
            "effect_type",
            "effect_value",
            "duration_minutes",
            "sort_order",
        ],
        where_clause={
            "is_active": True,
        },
    )

    items = get_data_or_empty(items_result)

    categories = sorted(
        categories,
        key=lambda category: category["sort_order"] or 0,
    )

    items = sorted(
        items,
        key=lambda item: item["sort_order"] or 0,
    )

    items_by_category_id = {}

    for item in items:
        category_id = item["shop_category_id"]

        if category_id not in items_by_category_id:
            items_by_category_id[category_id] = []

        items_by_category_id[category_id].append(
            {
                "shop_item_id": item["shop_item_id"],
                "item_key": item["item_key"],
                "name": item["name"],
                "description": item["description"],
                "price": item["price"],
                "old_price": item["old_price"],
                "currency": item["currency"],
                "discount_label": item["discount_label"],
                "image_emoji": item["image_emoji"],
                "image_url": item["image_url"],
                "item_type": item["item_type"],
                "effect_type": item["effect_type"],
                "effect_value": float(item["effect_value"])
                if item["effect_value"] is not None
                else None,
                "duration_minutes": item["duration_minutes"],
                "sort_order": item["sort_order"],
            }
        )

    shop_sections = []

    for category in categories:
        category_id = category["shop_category_id"]

        shop_sections.append(
            {
                "shop_category_id": category_id,
                "key": category["category_key"],
                "title": category["title"],
                "description": category["description"],
                "icon_key": category["icon_key"],
                "sort_order": category["sort_order"],
                "items": items_by_category_id.get(category_id, []),
            }
        )

    return {
        "success": True,
        "message": "Shop items loaded successfully.",
        "data": shop_sections,
    }


@router.post("/purchase")
def purchase_shop_item(request: PurchaseShopItemRequest):
    item = get_shop_item_by_key(request.item_key)

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Shop item not found.",
        )

    profile = get_user_game_profile(request.user_id)

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="User game profile not found.",
        )

    wallet_update = ensure_user_can_pay(profile, item)

    profile_update_data = apply_immediate_life_effect(
        profile=profile,
        item=item,
        wallet_update=wallet_update,
    )

    update_profile_result = update_table(
        table_name="user_game_profiles",
        query_data=profile_update_data,
        where_clause={
            "user_id": request.user_id,
        },
    )

    if not update_profile_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=update_profile_result.get(
                "message",
                "Could not update game profile.",
            ),
        )

    create_shop_purchase(
        user_id=request.user_id,
        item=item,
    )

    if item["item_type"] == "boost":
        create_active_boost(
            user_id=request.user_id,
            item=item,
        )

    if item["item_type"] == "protection":
        create_active_protection(
            user_id=request.user_id,
            item=item,
        )

    if item["item_type"] not in ["consumable", "boost", "protection"]:
        add_or_update_inventory_item(
            user_id=request.user_id,
            item=item,
        )

    updated_profile = get_user_game_profile(request.user_id)

    return {
        "success": True,
        "message": "Item purchased successfully.",
        "data": {
            "item": {
                "shop_item_id": item["shop_item_id"],
                "item_key": item["item_key"],
                "name": item["name"],
                "item_type": item["item_type"],
                "effect_type": item["effect_type"],
            },
            "game_profile": updated_profile,
        },
    }