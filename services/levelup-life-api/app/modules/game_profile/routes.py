from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from knight_core.functions import select_from

from app.modules.rewards.service import (
    apply_reward,
    required_exp_for_level,
)


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


# Applies a reward using the shared rewards service.
@router.post("/reward")
def add_reward(payload: RewardRequest):
    result = apply_reward(
        user_id=payload.user_id,
        source_type=payload.source_type,
        source_id=payload.source_id,
        exp_earned=payload.exp_earned,
        coins_earned=payload.coins_earned,
        gems_earned=payload.gems_earned,
        reason=payload.reason,
    )

    if not result["success"]:
        status_code = (
            404
            if result["message"] == "Game profile not found"
            else 400
        )

        raise HTTPException(
            status_code=status_code,
            detail=result["message"],
        )

    return result