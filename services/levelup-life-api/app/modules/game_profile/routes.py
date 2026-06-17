from fastapi import APIRouter, Query, HTTPException

from knight_core.functions import select_from


router = APIRouter(
    prefix="/api/game-profile",
    tags=["Game Profile"]
)


def required_exp_for_level(level: int) -> int:
    return int(1000 * (level ** 1.35))


@router.get("/profile")
def get_game_profile(user_id: int = Query(...)):
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
            "created_at",
            "updated_at",
        ],
        where_clause={
            "user_id": user_id,
        },
        options={
            "fetch_first": True,
        },
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail="Game profile not found",
        )

    profile = result["data"]

    required_exp = required_exp_for_level(profile["level"])
    exp_percent = round((profile["current_exp"] / required_exp) * 100, 2)

    return {
        "success": True,
        "message": "Game profile loaded successfully",
        "data": {
            **profile,
            "required_exp": required_exp,
            "exp_percent": exp_percent,
        },
    }