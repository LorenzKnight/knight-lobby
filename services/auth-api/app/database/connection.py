import os
from typing import Final

import psycopg
from psycopg import Connection
from psycopg.rows import dict_row


DB_HOST: Final[str] = "DB_HOST"
DB_PORT: Final[str] = "DB_PORT"
DB_NAME: Final[str] = "DB_NAME"
DB_USER: Final[str] = "DB_USER"
DB_PASSWORD: Final[str] = "DB_PASSWORD"


def get_required_env(key: str) -> str:
    value = os.getenv(key)

    if not value:
        raise RuntimeError(f"Missing required environment variable: {key}")

    return value


def get_db_connection() -> Connection:
    return psycopg.connect(
        host=get_required_env(DB_HOST),
        port=get_required_env(DB_PORT),
        dbname=get_required_env(DB_NAME),
        user=get_required_env(DB_USER),
        password=get_required_env(DB_PASSWORD),
        row_factory=dict_row,
    )