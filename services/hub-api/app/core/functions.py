import re
from typing import Any

from app.database.connection import get_db_connection


########################## Helper functions / Utility functions ##########################
def format_column(column: str) -> str:
    """
        Formatea columnas simples con comillas dobles.
        Permite funciones SQL, aliases, CAST, columnas con punto y expresiones.
    """

    column = column.strip()

    has_sql_function = re.search(r"\b(COUNT|SUM|AVG|MIN|MAX)\s*\(", column, re.IGNORECASE)
    has_alias = re.search(r"\s+AS\s+", column, re.IGNORECASE)
    has_expression = "(" in column or ")" in column
    has_dot = "." in column

    if has_sql_function or has_alias or has_expression or has_dot:
        return column

    return f'"{column}"'


def format_table(table_name: str) -> str:
    """
        Formatea el nombre de la tabla.
        Si viene con JOIN, espacios o expresiones, lo deja crudo.
        Si es una tabla simple, la envuelve en comillas dobles.
    """

    table_name = table_name.strip()

    has_complex_table = re.search(r"\s|JOIN|\(|\)", table_name, re.IGNORECASE)

    if has_complex_table:
        return table_name

    return f'"{table_name}"'


def build_condition(column: str, value: Any, params: list) -> str:
    """
        Construye una condición SQL y agrega los valores a params.
        Equivalente a parte de tu lógica PHP para WHERE.
    """

    # RAW
    if column == "RAW":
        return str(value)

    # IN
    in_match = re.match(r"^(.+)\s+IN$", column, re.IGNORECASE)
    if in_match and isinstance(value, list):
        field = in_match.group(1).strip()
        field_formatted = format_column(field)

        placeholders = ", ".join(["%s"] * len(value))
        params.extend(value)

        return f"{field_formatted} IN ({placeholders})"

    # BETWEEN
    between_match = re.match(r"^(.+)\s+BETWEEN$", column, re.IGNORECASE)
    if between_match and isinstance(value, list) and len(value) == 2:
        field = between_match.group(1).strip()
        field_formatted = format_column(field)

        params.extend([value[0], value[1]])

        return f"{field_formatted} BETWEEN %s AND %s"

    # LIKE / ILIKE
    like_match = re.match(r"^(.+)\s+(ILIKE|LIKE)$", column, re.IGNORECASE)
    if like_match:
        field = like_match.group(1).strip()
        operator = like_match.group(2).upper()
        field_formatted = format_column(field)

        params.append(f"%{value}%")

        return f"{field_formatted} {operator} %s"

    # condition: IS NULL, IS NOT NULL, >, <, >=, <=, !=, etc.
    if isinstance(value, dict) and "condition" in value:
        col_formatted = format_column(column)
        condition = str(value["condition"]).upper()

        if condition in ["IS NULL", "IS NOT NULL"]:
            return f"{col_formatted} {condition}"

        params.append(value.get("value"))

        return f"{col_formatted} {condition} %s"

    # NULL
    if value is None:
        col_formatted = format_column(column)
        return f"{col_formatted} IS NULL"

    # Normal =
    col_formatted = format_column(column)
    params.append(value)

    return f"{col_formatted} = %s"


########################## Main database functions / Query functions ##########################
def select_from(
    table_name: str,
    columns: list[str] | None = None,
    where_clause: dict | None = None,
    options: dict | None = None,
) -> dict:
    """
        Versión Python de tu función PHP select_from().

        Ejemplo:
            result = select_from(
                "ecosystem_apps",
                ["app_id", "name", "slug"],
                {"status": "active"},
                {"order_by": "sort_order", "order_direction": "ASC"}
            )
    """

    columns = columns or []
    where_clause = where_clause or {}
    options = options or {}

    if not table_name:
        return {
            "success": False,
            "message": "Table name is required",
            "count": 0,
            "data": [],
        }

    # Columns
    if not columns or columns == ["*"]:
        column_names = "*"
    else:
        column_names = ", ".join([format_column(col) for col in columns])

    # Table
    escaped_table = format_table(table_name)

    # WHERE
    params = []
    where_parts = []

    # OR
    or_clause = where_clause.pop("OR", None)
    or_in_clause = where_clause.pop("OR_IN", None)

    for column, value in where_clause.items():
        where_parts.append(build_condition(column, value, params))

    if isinstance(or_clause, dict):
        or_parts = []

        for column, value in or_clause.items():
            or_parts.append(build_condition(column, value, params))

        if or_parts:
            where_parts.append("(" + " OR ".join(or_parts) + ")")

    if isinstance(or_in_clause, dict):
        or_in_parts = []

        for field, values in or_in_clause.items():
            field_formatted = format_column(field)

            if not isinstance(values, list):
                continue

            placeholders = ", ".join(["%s"] * len(values))
            params.extend(values)

            or_in_parts.append(f"{field_formatted} IN ({placeholders})")

        if or_in_parts:
            where_parts.append("(" + " OR ".join(or_in_parts) + ")")

    where_sql = ""

    if where_parts:
        where_sql = " WHERE " + " AND ".join(where_parts)

    # ORDER BY
    order_sql = ""

    if options.get("order_by"):
        order_by = str(options["order_by"])
        order_direction = "DESC" if str(options.get("order_direction", "ASC")).lower() == "desc" else "ASC"

        if re.search(r"\(|\.|\s", order_by):
            order_sql = f" ORDER BY {order_by} {order_direction}"
        else:
            order_sql = f' ORDER BY "{order_by}" {order_direction}'

    # LIMIT
    limit_sql = ""

    if options.get("limit") is not None:
        try:
            limit = int(options["limit"])
            limit_sql = " LIMIT %s"
            params.append(limit)
        except ValueError:
            pass

    query = f"SELECT {column_names} FROM {escaped_table}{where_sql}{order_sql}{limit_sql};"

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)

                if options.get("fetch_first"):
                    row = cursor.fetchone()

                    return {
                        "success": row is not None,
                        "message": "No records found" if row is None else "Record retrieved successfully",
                        "query": query if options.get("echo_query") else None,
                        "count": 1 if row else 0,
                        "data": dict(row) if row else {},
                    }

                rows = cursor.fetchall()
                data = [dict(row) for row in rows]

                return {
                    "success": len(data) > 0,
                    "message": "No records found" if not data else "Records retrieved successfully",
                    "query": query if options.get("echo_query") else None,
                    "count": len(data),
                    "data": data,
                }

    except Exception as error:
        return {
            "success": False,
            "message": f"Error executing query: {str(error)}",
            "query": query if options.get("echo_query") else None,
            "count": 0,
            "data": [],
        }