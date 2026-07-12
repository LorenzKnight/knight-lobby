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


# Retrieves the active reward boosts for a user.
def get_active_reward_boosts(user_id: int):
    now = datetime.now(timezone.utc)

    boosts_result = select_from(
        table_name="user_active_boosts",
        columns=[
            "user_active_boost_id",
            "user_id",
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

    if not boosts_result["success"]:
        message = str(boosts_result.get("message", ""))

        if "No records found" in message:
            return []

        return []

    active_boosts = []

    for boost in boosts_result["data"] or []:
        expires_at = boost["expires_at"]

        if expires_at and expires_at <= now:
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

        active_boosts.append(boost)

    return active_boosts


# Applies active boosts to the earned EXP and coins, returning the final values and applied boosts.
def apply_boosts_to_reward(user_id: int, exp_earned: int, coins_earned: int):
    active_boosts = get_active_reward_boosts(user_id)

    final_exp = exp_earned
    final_coins = coins_earned

    applied_boosts = []

    for boost in active_boosts:
        boost_type = boost["boost_type"]
        boost_value = float(boost["boost_value"] or 1)

        if boost_type == "exp_multiplier":
            final_exp = int(round(final_exp * boost_value))

            applied_boosts.append(
                {
                    "item_key": boost["item_key"],
                    "name": boost["item_name"],
                    "boost_type": boost_type,
                    "boost_value": boost_value,
                }
            )

        if boost_type == "coins_multiplier":
            final_coins = int(round(final_coins * boost_value))

            applied_boosts.append(
                {
                    "item_key": boost["item_key"],
                    "name": boost["item_name"],
                    "boost_type": boost_type,
                    "boost_value": boost_value,
                }
            )

    return {
        "exp_earned": final_exp,
        "coins_earned": final_coins,
        "applied_boosts": applied_boosts,
    }


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

    boosted_reward = apply_boosts_to_reward(
        user_id=user_id,
        exp_earned=exp_earned,
        coins_earned=coins_earned,
    )

    exp_earned = boosted_reward["exp_earned"]
    coins_earned = boosted_reward["coins_earned"]
    applied_boosts = boosted_reward["applied_boosts"]

    new_level, new_current_exp, leveled_up = calculate_level_progress(
        profile["level"],
        profile["current_exp"],
        exp_earned,
    )

    new_total_exp = profile["total_exp"] + exp_earned
    new_coins = profile["coins"] + coins_earned
    new_gems = profile["gems"] + gems_earned

    current_life = profile["current_life"]
    max_life = profile["max_life"]

    new_current_life = current_life

    if leveled_up:
        new_current_life = max_life

    profile_update_data = {
        "level": new_level,
        "current_exp": new_current_exp,
        "total_exp": new_total_exp,
        "coins": new_coins,
        "gems": new_gems,
        "current_life": new_current_life,
        "updated_at": datetime.now(timezone.utc),
    }

    update_result = update_table(
        table_name="user_game_profiles",
        query_data=profile_update_data,
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
            "current_life": new_current_life,
            "max_life": max_life,
            "required_exp": required_exp,
            "exp_percent": exp_percent,
            "leveled_up": leveled_up,
            "applied_boosts": applied_boosts,
            "reward": {
                "exp_earned": exp_earned,
                "coins_earned": coins_earned,
                "gems_earned": gems_earned,
                "applied_boosts": applied_boosts,
            },
        },
    }