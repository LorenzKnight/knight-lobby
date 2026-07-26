import json

from knight_core.functions import insert_into


def create_audit_log(
    user_id: int,
    event_type: str,
    source: str,
    source_id=None,
    event_date=None,
    level_before=None,
    life_before=None,
    max_life_before=None,
    level_after=None,
    life_after=None,
    exp_before=None,
    exp_after=None,
    coins_before=None,
    coins_after=None,
    gems_before=None,
    gems_after=None,
    metadata=None,
    message=None,
):
    """
    Generic audit logger for LevelUp Life.

    This should not break the main action if logging fails.
    It is used only for investigation, debugging and historical tracking.
    """

    safe_metadata = None

    if metadata is not None:
        safe_metadata = json.dumps(
            metadata,
            default=str,
        )

    result = insert_into(
        table_name="user_audit_logs",
        query_data={
            "user_id": user_id,
            "event_type": event_type,
            "source": source,
            "source_id": source_id,
            "event_date": event_date,

            "level_before": level_before,
            "life_before": life_before,
            "max_life_before": max_life_before,

            "level_after": level_after,
            "life_after": life_after,

            "exp_before": exp_before,
            "exp_after": exp_after,

            "coins_before": coins_before,
            "coins_after": coins_after,

            "gems_before": gems_before,
            "gems_after": gems_after,

            "metadata": safe_metadata,
            "message": message,
        },
    )

    if not result["success"]:
        print(
            "[AUDIT_LOG_ERROR]",
            "user_id=", user_id,
            "event_type=", event_type,
            "source=", source,
            "message=", result.get("message"),
        )

    return result