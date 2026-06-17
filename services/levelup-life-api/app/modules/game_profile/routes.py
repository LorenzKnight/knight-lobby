from datetime import datetime, timezone

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from knight_core.functions import select_from, insert_into, update_table


router = APIRouter(
    prefix="/api/game-profile",
    tags=["Game Profile"]
)

# Request body used when the user earns a reward.
class RewardRequest(BaseModel):
    user_id: int
    source_type: str
    source_id: int | None = None
    exp_earned: int = 0
    coins_earned: int = 0
    gems_earned: int = 0
    reason: str | None = None


# Calculates how much EXP is required to pass the current level.
def required_exp_for_level(level: int) -> int:
    return int(1000 * (level ** 1.35))


# Applies earned EXP and calculates if the user levels up.
def calculate_level_progress(level: int, current_exp: int, exp_earned: int):
    new_level = level
    new_current_exp = current_exp + exp_earned
    leveled_up = False

    while new_current_exp >= required_exp_for_level(new_level):
        new_current_exp -= required_exp_for_level(new_level)
        new_level += 1
        leveled_up = True

    return new_level, new_current_exp, leveled_up


# Loads the current RPG profile for one user.
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


# Loads the reward history for one user.
@router.get("/rewards")
def get_user_rewards(user_id: int = Query(...)):
    result = select_from(
        table_name="user_rewards_log",
        columns=[
            "reward_log_id",
            "user_id",
            "source_type",
            "source_id",
            "exp_earned",
            "coins_earned",
            "gems_earned",
            "reason",
            "created_at",
        ],
        where_clause={
            "user_id": user_id,
        },
        options={
            "order_by": "created_at",
            "order_direction": "DESC",
        },
    )

    if not result["success"]:
        return {
            "success": True,
            "message": "No rewards found",
            "data": [],
            "count": 0,
        }

    return {
        "success": True,
        "message": "Rewards loaded successfully",
        "data": result["data"],
        "count": result["count"],
    }


# Applies a reward to the user and stores it in the rewards history.
@router.post("/reward")
def add_reward(payload: RewardRequest):
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
            "user_id": payload.user_id,
        },
        options={
            "fetch_first": True,
        },
    )

    if not profile_result["success"]:
        raise HTTPException(
            status_code=404,
            detail="Game profile not found",
        )

    profile = profile_result["data"]

    new_level, new_current_exp, leveled_up = calculate_level_progress(
        profile["level"],
        profile["current_exp"],
        payload.exp_earned,
    )

    update_result = update_table(
        table_name="user_game_profiles",
        query_data={
            "level": new_level,
            "current_exp": new_current_exp,
            "total_exp": profile["total_exp"] + payload.exp_earned,
            "coins": profile["coins"] + payload.coins_earned,
            "gems": profile["gems"] + payload.gems_earned,
            "updated_at": datetime.now(timezone.utc),
        },
        where_clause={
            "user_id": payload.user_id,
        },
    )

    if not update_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=update_result["message"],
        )

    log_result = insert_into(
        table_name="user_rewards_log",
        query_data={
            "user_id": payload.user_id,
            "source_type": payload.source_type,
            "source_id": payload.source_id,
            "exp_earned": payload.exp_earned,
            "coins_earned": payload.coins_earned,
            "gems_earned": payload.gems_earned,
            "reason": payload.reason,
        },
    )

    if not log_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=log_result["message"],
        )

    required_exp = required_exp_for_level(new_level)
    exp_percent = round((new_current_exp / required_exp) * 100, 2)

    return {
        "success": True,
        "message": "Reward applied successfully",
        "data": {
            "user_id": payload.user_id,
            "level": new_level,
            "current_exp": new_current_exp,
            "total_exp": profile["total_exp"] + payload.exp_earned,
            "coins": profile["coins"] + payload.coins_earned,
            "gems": profile["gems"] + payload.gems_earned,
            "current_life": profile["current_life"],
            "max_life": profile["max_life"],
            "required_exp": required_exp,
            "exp_percent": exp_percent,
            "leveled_up": leveled_up,
        },
    }