from fastapi import APIRouter, HTTPException
from knight_core.functions import select_from

router = APIRouter(
    prefix="/api/shop",
    tags=["Shop"],
)


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