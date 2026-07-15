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

class UseInventoryItemRequest(BaseModel):
    user_id: int
    inventory_item_id: int


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
            "discount_percent",
            "image_emoji",
            "image_url",
            "item_type",
            "effect_type",
            "effect_value",
            "duration_minutes",
            "rarity",
            "preview_type",
            "delivery_type",
            "is_consumable",
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
    if item["delivery_type"] != "instant":
        return {
            **wallet_update,
            "updated_at": datetime.now(timezone.utc),
        }

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
    

def get_now():
    return datetime.now(timezone.utc)


def format_remaining_time(expires_at):
    if not expires_at:
        return "Ready"

    now = get_now()
    remaining_seconds = int((expires_at - now).total_seconds())

    if remaining_seconds <= 0:
        return "Expired"

    minutes = remaining_seconds // 60
    hours = minutes // 60
    days = hours // 24

    if days > 0:
        return f"{days}d"

    if hours > 0:
        return f"{hours}h"

    return f"{max(1, minutes)}m"


def get_boost_icon(boost_type):
    if boost_type == "exp_multiplier":
        return "⚡"

    if boost_type == "coins_multiplier":
        return "🪙"

    if boost_type == "focus_bonus":
        return "🔥"

    return "✨"


def get_boost_label(boost_type, boost_value):
    boost_value = float(boost_value or 0)

    if boost_type == "exp_multiplier":
        return f"EXP x{boost_value:g}"

    if boost_type == "coins_multiplier":
        return f"Coins x{boost_value:g}"

    if boost_type == "focus_bonus":
        return "Focus boost"

    return "Boost"


def get_protection_icon(protection_type):
    if protection_type == "daily_life_shield":
        return "🛡️"

    if protection_type == "second_chance":
        return "🔁"

    if protection_type == "avoid_level_drop":
        return "🔮"

    return "🛡️"


def get_protection_label(protection_type):
    if protection_type == "daily_life_shield":
        return "Shield"

    if protection_type == "second_chance":
        return "Second chance"

    if protection_type == "avoid_level_drop":
        return "Anti-drop"

    return "Protection"


def get_inventory_section_key(item_type: str, effect_type: str | None = None):
    if item_type == "boost":
        return "boosts"

    if item_type == "protection":
        return "protections"

    if item_type == "avatar_item" or item_type == "cosmetic":
        return "avatar"

    if item_type == "consumable":
        return "consumables"

    return "others"


def get_inventory_action_label(item_type: str, effect_type: str | None = None):
    if item_type == "protection":
        return "Usar"

    if item_type == "boost":
        return "Activar"

    if item_type == "avatar_item" or item_type == "cosmetic":
        return "Equipar"

    if item_type == "consumable":
        return "Usar"

    return "Ver"


def get_inventory_item_icon(item_key: str, item_type: str, effect_type: str | None = None):
    if item_key == "anti_drop_charm":
        return "🔮"

    if effect_type == "avoid_level_drop":
        return "🔮"

    if effect_type == "second_chance":
        return "🔁"

    if effect_type == "daily_life_shield":
        return "🛡️"

    if item_type == "boost":
        return "⚡"

    if item_type == "protection":
        return "🛡️"

    if item_type == "avatar_item" or item_type == "cosmetic":
        return "👕"

    if item_type == "consumable":
        return "🎒"

    return "📦"


def get_inventory_item_description(item):
    effect_type = item.get("effect_type")

    if effect_type == "avoid_level_drop":
        return "Evita perder un nivel una vez."

    if effect_type == "second_chance":
        return "Te permite salvar un día fallido."

    if effect_type == "daily_life_shield":
        return "Protege tu vida contra una penalización."

    return f"{item.get('item_name')} guardado en tu mochila."


def consume_inventory_item(item):
    current_quantity = int(item["quantity"] or 0)
    now = get_now()

    if current_quantity <= 1:
        return update_table(
            table_name="user_inventory_items",
            where_clause={
                "user_inventory_item_id": item["user_inventory_item_id"],
                "user_id": item["user_id"],
            },
            query_data={
                "quantity": 0,
                "is_used": True,
                "used_at": now,
                "updated_at": now,
            },
        )

    return update_table(
        table_name="user_inventory_items",
        where_clause={
            "user_inventory_item_id": item["user_inventory_item_id"],
            "user_id": item["user_id"],
        },
        query_data={
            "quantity": current_quantity - 1,
            "updated_at": now,
        },
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
            "discount_percent",
            "image_emoji",
            "image_url",
            "item_type",
            "effect_type",
            "effect_value",
            "duration_minutes",
            "rarity",
            "preview_type",
            "delivery_type",
            "is_consumable",
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
                "discount_percent": item["discount_percent"],
                "image_emoji": item["image_emoji"],
                "image_url": item["image_url"],
                "item_type": item["item_type"],
                "effect_type": item["effect_type"],
                "effect_value": (
                    float(item["effect_value"])
                    if item["effect_value"] is not None
                    else None
                ),
                "duration_minutes": item["duration_minutes"],
                "rarity": item["rarity"],
                "preview_type": item["preview_type"],
                "delivery_type": item["delivery_type"],
                "is_consumable": item["is_consumable"],
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

    delivery_type = item["delivery_type"]

    if delivery_type == "activation":
        if item["item_type"] == "boost":
            create_active_boost(
                user_id=request.user_id,
                item=item,
            )

        elif item["item_type"] == "protection":
            create_active_protection(
                user_id=request.user_id,
                item=item,
            )

        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported activation item type.",
            )

    elif delivery_type == "inventory":
        add_or_update_inventory_item(
            user_id=request.user_id,
            item=item,
        )

    elif delivery_type == "instant":
        pass

    elif delivery_type == "external_payment":
        raise HTTPException(
            status_code=400,
            detail="External payment purchases are not available yet.",
        )

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid item delivery type.",
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
                "preview_type": item["preview_type"],
                "delivery_type": item["delivery_type"],
                "rarity": item["rarity"],
            },
            "game_profile": updated_profile,
        },
    }


@router.get("/active-effects")
def get_active_effects(user_id: int):
    now = get_now()
    active_effects = []

    active_boosts_result = select_from(
        table_name="user_active_boosts",
        columns=[
            "user_active_boost_id",
            "user_id",
            "shop_item_id",
            "item_key",
            "item_name",
            "boost_type",
            "boost_value",
            "starts_at",
            "expires_at",
            "is_active",
        ],
        where_clause={
            "user_id": user_id,
            "is_active": True,
        },
    )

    if active_boosts_result["success"]:
        active_boosts = active_boosts_result["data"]

        for boost in active_boosts:
            expires_at = boost["expires_at"]

            if expires_at <= now:
                update_table(
                    table_name="user_active_boosts",
                    query_data={
                        "is_active": False,
                    },
                    where_clause={
                        "user_active_boost_id": boost["user_active_boost_id"],
                    },
                )

                continue

            active_effects.append({
                "effect_key": boost["item_key"],
                "effect_id": boost["user_active_boost_id"],
                "type": "boost",
                "icon": get_boost_icon(boost["boost_type"]),
                "short_label": get_boost_label(
                    boost["boost_type"],
                    boost["boost_value"],
                ),
                "description": boost["item_name"],
                "remaining_text": format_remaining_time(expires_at),
                "starts_at": boost["starts_at"],
                "expires_at": expires_at,
                "is_temporary": True,
            })

    active_protections_result = select_from(
        table_name="user_active_protections",
        columns=[
            "user_active_protection_id",
            "user_id",
            "shop_item_id",
            "item_key",
            "item_name",
            "protection_type",
            "protection_value",
            "starts_at",
            "expires_at",
            "is_active",
            "is_used",
        ],
        where_clause={
            "user_id": user_id,
            "is_active": True,
            "is_used": False,
        },
    )

    if active_protections_result["success"]:
        active_protections = active_protections_result["data"]

        for protection in active_protections:
            expires_at = protection["expires_at"]

            if expires_at and expires_at <= now:
                update_table(
                    table_name="user_active_protections",
                    query_data={
                        "is_active": False,
                    },
                    where_clause={
                        "user_active_protection_id": protection["user_active_protection_id"],
                    },
                )

                continue

            active_effects.append({
                "effect_key": protection["item_key"],
                "effect_id": protection["user_active_protection_id"],
                "type": "protection",
                "icon": get_protection_icon(protection["protection_type"]),
                "short_label": get_protection_label(protection["protection_type"]),
                "description": protection["item_name"],
                "remaining_text": (
                    format_remaining_time(expires_at)
                    if expires_at
                    else "Ready"
                ),
                "starts_at": protection["starts_at"],
                "expires_at": expires_at,
                "is_temporary": expires_at is not None,
            })

    return {
        "success": True,
        "message": "Active effects loaded successfully.",
        "data": active_effects,
    }


@router.get("/inventory")
def get_inventory(user_id: int):
    inventory_result = select_from(
        table_name="user_inventory_items",
        columns=[
            "user_inventory_item_id",
            "user_id",
            "shop_item_id",
            "item_key",
            "item_name",
            "quantity",
            "item_type",
            "effect_type",
            "effect_value",
            "duration_minutes",
            "is_used",
            "used_at",
            "created_at",
            "updated_at",
        ],
        where_clause={
            "user_id": user_id,
            "is_used": False,
        },
    )

    inventory_items = []

    if inventory_result["success"]:
        inventory_items = inventory_result["data"] or []

    sections_map = {
        "boosts": {
            "key": "boosts",
            "title": "Boosts",
            "description": "Efectos temporales para mejorar tus recompensas.",
            "icon": "⚡",
            "items": [],
        },
        "protections": {
            "key": "protections",
            "title": "Protecciones",
            "description": "Objetos que protegen tu progreso.",
            "icon": "🛡️",
            "items": [],
        },
        "consumables": {
            "key": "consumables",
            "title": "Consumibles",
            "description": "Objetos que puedes usar cuando los necesites.",
            "icon": "🎒",
            "items": [],
        },
        "avatar": {
            "key": "avatar",
            "title": "Avatar",
            "description": "Ropa, accesorios y cosméticos desbloqueados.",
            "icon": "👕",
            "items": [],
        },
        "others": {
            "key": "others",
            "title": "Otros",
            "description": "Objetos especiales guardados en tu mochila.",
            "icon": "📦",
            "items": [],
        },
    }

    for item in inventory_items:
        section_key = get_inventory_section_key(
            item["item_type"],
            item.get("effect_type"),
        )

        inventory_item = {
            "inventory_item_id": item["user_inventory_item_id"],
            "shop_item_id": item["shop_item_id"],
            "item_key": item["item_key"],
            "name": item["item_name"],
            "description": get_inventory_item_description(item),
            "image_emoji": get_inventory_item_icon(
                item["item_key"],
                item["item_type"],
                item.get("effect_type"),
            ),
            "quantity": item["quantity"],
            "item_type": item["item_type"],
            "effect_type": item.get("effect_type"),
            "effect_value": float(item["effect_value"]) if item.get("effect_value") is not None else None,
            "duration_minutes": item.get("duration_minutes"),
            "can_use": item["item_type"] in ["boost", "protection", "consumable"],
            "can_equip": item["item_type"] in ["avatar_item", "cosmetic"],
            "action_label": get_inventory_action_label(
                item["item_type"],
                item.get("effect_type"),
            ),
            "created_at": item["created_at"],
            "updated_at": item["updated_at"],
        }

        sections_map[section_key]["items"].append(inventory_item)

    sections = [
        section
        for section in sections_map.values()
        if section["items"]
    ]

    return {
        "success": True,
        "message": "Inventory loaded successfully.",
        "data": sections,
    }


# Use Inventory Item
@router.post("/inventory/use")
def use_inventory_item(payload: UseInventoryItemRequest):
    inventory_result = select_from(
        table_name="user_inventory_items",
        columns=[
            "user_inventory_item_id",
            "user_id",
            "shop_item_id",
            "item_key",
            "item_name",
            "quantity",
            "item_type",
            "effect_type",
            "effect_value",
            "duration_minutes",
            "is_used",
        ],
        where_clause={
            "user_inventory_item_id": payload.inventory_item_id,
            "user_id": payload.user_id,
            "is_used": False,
        },
        options={
            "fetch_first": True,
        },
    )

    if not inventory_result["success"] or not inventory_result["data"]:
        raise HTTPException(
            status_code=404,
            detail="Inventory item not found.",
        )

    item = inventory_result["data"]

    if int(item["quantity"] or 0) <= 0:
        raise HTTPException(
            status_code=400,
            detail="This inventory item has no quantity available.",
        )

    now = get_now()

    if item["item_type"] == "protection":
        expires_at = None

        if item.get("duration_minutes"):
            expires_at = now + timedelta(minutes=int(item["duration_minutes"]))

        protection_result = insert_into(
            table_name="user_active_protections",
            query_data={
                "user_id": payload.user_id,
                "shop_item_id": item["shop_item_id"],
                "item_key": item["item_key"],
                "item_name": item["item_name"],
                "protection_type": item["effect_type"],
                "protection_value": item["effect_value"],
                "starts_at": now,
                "expires_at": expires_at,
                "is_active": True,
                "is_used": False,
                "used_at": None,
                "created_at": now,
            },
        )

        if not protection_result["success"]:
            raise HTTPException(
                status_code=500,
                detail="Could not activate protection.",
            )

        consume_result = consume_inventory_item(item)

        if not consume_result["success"]:
            raise HTTPException(
                status_code=500,
                detail="Could not consume inventory item.",
            )

        return {
            "success": True,
            "message": "Inventory item used successfully.",
            "data": {
                "used_item": {
                    "inventory_item_id": item["user_inventory_item_id"],
                    "item_key": item["item_key"],
                    "name": item["item_name"],
                    "item_type": item["item_type"],
                    "effect_type": item["effect_type"],
                    "icon": get_inventory_item_icon(
                        item["item_key"],
                        item["item_type"],
                        item.get("effect_type"),
                    ),
                },
                "activated_effect": {
                    "type": "protection",
                    "effect_type": item["effect_type"],
                    "name": item["item_name"],
                    "is_temporary": expires_at is not None,
                    "expires_at": expires_at,
                },
            },
        }

    if item["item_type"] == "boost":
        if not item.get("duration_minutes"):
            raise HTTPException(
                status_code=400,
                detail="This boost has no duration configured.",
            )

        expires_at = now + timedelta(minutes=int(item["duration_minutes"]))

        boost_result = insert_into(
            table_name="user_active_boosts",
            query_data={
                "user_id": payload.user_id,
                "shop_item_id": item["shop_item_id"],
                "item_key": item["item_key"],
                "item_name": item["item_name"],
                "boost_type": item["effect_type"],
                "boost_value": item["effect_value"],
                "starts_at": now,
                "expires_at": expires_at,
                "is_active": True,
                "created_at": now,
            },
        )

        if not boost_result["success"]:
            raise HTTPException(
                status_code=500,
                detail="Could not activate boost.",
            )

        consume_result = consume_inventory_item(item)

        if not consume_result["success"]:
            raise HTTPException(
                status_code=500,
                detail="Could not consume inventory item.",
            )

        return {
            "success": True,
            "message": "Inventory item used successfully.",
            "data": {
                "used_item": {
                    "inventory_item_id": item["user_inventory_item_id"],
                    "item_key": item["item_key"],
                    "name": item["item_name"],
                    "item_type": item["item_type"],
                    "effect_type": item["effect_type"],
                    "icon": get_inventory_item_icon(
                        item["item_key"],
                        item["item_type"],
                        item.get("effect_type"),
                    ),
                },
                "activated_effect": {
                    "type": "boost",
                    "effect_type": item["effect_type"],
                    "name": item["item_name"],
                    "is_temporary": True,
                    "expires_at": expires_at,
                },
            },
        }

    raise HTTPException(
        status_code=400,
        detail="This inventory item cannot be used yet.",
    )