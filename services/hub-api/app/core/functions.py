from datetime import datetime, timezone
from typing import Any


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def success_response(
    message: str = "Success",
    data: Any = None,
    meta: dict | None = None,
) -> dict:
    response = {
        "success": True,
        "message": message,
        "data": data,
    }

    if meta is not None:
        response["meta"] = meta

    return response


def error_response(
    message: str = "Something went wrong",
    errors: Any = None,
    status_code: int | None = None,
) -> dict:
    response = {
        "success": False,
        "message": message,
    }

    if errors is not None:
        response["errors"] = errors

    if status_code is not None:
        response["status_code"] = status_code

    return response


def clean_string(value: str | None) -> str:
    if value is None:
        return ""

    return value.strip()


def is_empty(value: Any) -> bool:
    return value is None or value == "" or value == [] or value == {}