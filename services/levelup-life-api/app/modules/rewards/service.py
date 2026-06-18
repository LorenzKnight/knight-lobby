from datetime import datetime, timezone

from knight_core.functions import select_from, insert_into, update_table


# Calculates the EXP required to pass a specific level.
def required_exp_for_level(level: int) -> int:
    return int(1000 * (level ** 1.35))


# Applies earned EXP and calculates level progression.
def calculate_level_progress(
    level: int,
    current_exp: int,
    exp_earned: int,
):
    new_level = level
    new_current_exp = current_exp + exp_earned
    leveled_up = False

    while new_current_exp >= required_exp_for_level(new_level):
        new_current_exp -= required_exp_for_level(new_level)
        new_level += 1
        leveled_up = True

    return new_level, new_current_exp, leveled_up


# Applies a reward to the user and stores it in the reward history.
def apply_reward(
    user_id: int,
    source_type: str,
    source_id: int | None = None,
    exp_earned: int = 0,
    coins_earned: int = 0,
    gems_earned: int = 0,
    reason: str | None = None,
) -> dict:
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
        options={
            "fetch_first": True,
        },
    )

    if not profile_result["success"]:
        return {
            "success": False,
            "message": "Game profile not found",
        }

    profile = profile_result["data"]

    new_level, new_current_exp, leveled_up = calculate_level_progress(
        profile["level"],
        profile["current_exp"],
        exp_earned,
    )

    new_total_exp = profile["total_exp"] + exp_earned
    new_coins = profile["coins"] + coins_earned
    new_gems = profile["gems"] + gems_earned

    update_result = update_table(
        table_name="user_game_profiles",
        query_data={
            "level": new_level,
            "current_exp": new_current_exp,
            "total_exp": new_total_exp,
            "coins": new_coins,
            "gems": new_gems,
            "updated_at": datetime.now(timezone.utc),
        },
        where_clause={
            "user_id": user_id,
        },
    )

    if not update_result["success"]:
        return {
            "success": False,
            "message": update_result["message"],
        }

    log_result = insert_into(
        table_name="user_rewards_log",
        query_data={
            "user_id": user_id,
            "source_type": source_type,
            "source_id": source_id,
            "exp_earned": exp_earned,
            "coins_earned": coins_earned,
            "gems_earned": gems_earned,
            "reason": reason,
        },
    )

    if not log_result["success"]:
        return {
            "success": False,
            "message": log_result["message"],
        }

    required_exp = required_exp_for_level(new_level)
    exp_percent = round(
        (new_current_exp / required_exp) * 100,
        2,
    )

    return {
        "success": True,
        "message": "Reward applied successfully",
        "data": {
            "user_id": user_id,
            "level": new_level,
            "current_exp": new_current_exp,
            "total_exp": new_total_exp,
            "coins": new_coins,
            "gems": new_gems,
            "current_life": profile["current_life"],
            "max_life": profile["max_life"],
            "required_exp": required_exp,
            "exp_percent": exp_percent,
            "leveled_up": leveled_up,
            "reward": {
                "exp_earned": exp_earned,
                "coins_earned": coins_earned,
                "gems_earned": gems_earned,
            },
        },
    }