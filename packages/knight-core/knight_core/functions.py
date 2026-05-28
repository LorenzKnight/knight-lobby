import re
from typing import Any

from knight_core.database.connection import get_db_connection


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
    

def insert_into(
    table_name: str,
    query_data: dict | None = None,
    options: dict | None = None,
) -> dict:
    """
    Versión Python de tu función PHP insert_into().

    Ejemplo:
        result = insert_into(
            "users",
            {
                "email": "lorenz@example.com",
                "password_hash": "hashed_password",
                "first_name": "Lorenz",
            },
            {
                "id": "user_id"
            }
        )
    """

    query_data = query_data or {}
    options = options or {}

    if not table_name:
        return {
            "success": False,
            "message": "Table name is required",
            "data": {},
        }

    if not query_data:
        return {
            "success": False,
            "message": "There is no data to insert",
            "data": {},
        }

    formatted_table = format_table(table_name)

    column_names = ", ".join(
        [format_column(column) for column in query_data.keys()]
    )

    placeholders = ", ".join(["%s"] * len(query_data))

    params = list(query_data.values())

    returning_sql = ""
    returning_column = options.get("id")

    if returning_column:
        returning_sql = f" RETURNING {format_column(returning_column)}"

    query = (
        f"INSERT INTO {formatted_table} "
        f"({column_names}) "
        f"VALUES ({placeholders})"
        f"{returning_sql};"
    )

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)

                inserted_id = None

                if returning_column:
                    row = cursor.fetchone()

                    if row:
                        inserted_id = row[returning_column]

                conn.commit()

                response = {
                    "success": True,
                    "message": "Record inserted successfully",
                    "query": query if options.get("echo_query") else None,
                }

                if returning_column:
                    response["id"] = inserted_id

                return response

    except Exception as error:
        return {
            "success": False,
            "message": f"Error executing query: {str(error)}",
            "query": query if options.get("echo_query") else None,
            "data": {},
        }
    

def update_table(
    table_name: str,
    query_data: dict | None = None,
    where_clause: dict | None = None,
    options: dict | None = None,
) -> dict:
    """
    Versión Python de tu función PHP update_table().

    Ejemplo:
        result = update_table(
            "users",
            {
                "first_name": "Lorenz",
                "is_verified": True,
            },
            {
                "user_id": 1,
            },
            {
                "echo_query": True,
            }
        )
    """

    query_data = query_data or {}
    where_clause = where_clause or {}
    options = options or {}

    if not table_name:
        return {
            "success": False,
            "message": "Table name is required",
            "count": 0,
        }

    if not query_data:
        return {
            "success": False,
            "message": "No data to update",
            "count": 0,
        }

    if not where_clause:
        return {
            "success": False,
            "message": "Update condition is missing",
            "count": 0,
        }

    formatted_table = format_table(table_name)

    params = []
    set_parts = []

    for column, value in query_data.items():
        formatted_column = format_column(column)

        # Permite expresiones SQL controladas como:
        # quantity + 1
        # stock - 2
        # price * 1.25
        if isinstance(value, str) and re.match(
            r"^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*[\+\-\*\/]\s*\d+(\.\d+)?\s*$",
            value,
        ):
            set_parts.append(f"{formatted_column} = {value}")
            continue

        set_parts.append(f"{formatted_column} = %s")
        params.append(value)

    set_sql = ", ".join(set_parts)

    where_parts = []

    # Igual que en select_from, soportamos OR y OR_IN
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
            if not isinstance(values, list):
                continue

            field_formatted = format_column(field)
            placeholders = ", ".join(["%s"] * len(values))
            params.extend(values)

            or_in_parts.append(f"{field_formatted} IN ({placeholders})")

        if or_in_parts:
            where_parts.append("(" + " OR ".join(or_in_parts) + ")")

    where_sql = " WHERE " + " AND ".join(where_parts)

    query = f"UPDATE {formatted_table} SET {set_sql}{where_sql};"

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)

                affected_rows = cursor.rowcount

                conn.commit()

                return {
                    "success": affected_rows > 0,
                    "message": (
                        "Row(s) updated successfully"
                        if affected_rows > 0
                        else "No rows were updated"
                    ),
                    "count": affected_rows,
                    "query": query if options.get("echo_query") else None,
                }

    except Exception as error:
        return {
            "success": False,
            "message": f"Error executing update query: {str(error)}",
            "count": 0,
            "query": query if options.get("echo_query") else None,
        }
    

def delete_from(
    table_name: str,
    where_clause: dict | None = None,
    options: dict | None = None,
) -> dict:
    """
    Versión Python de tu función PHP delete_from().

    Ejemplo:
        result = delete_from(
            "users",
            {
                "user_id": 1,
            },
            {
                "echo_query": True,
            }
        )
    """

    where_clause = where_clause or {}
    options = options or {}

    if not table_name:
        return {
            "success": False,
            "message": "Table name is required.",
            "count": 0,
        }

    if not where_clause:
        return {
            "success": False,
            "message": "Delete condition missing.",
            "count": 0,
        }

    formatted_table = format_table(table_name)

    params = []
    where_parts = []

    # Soporte para OR y OR_IN igual que select_from/update_table
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
            if not isinstance(values, list):
                continue

            field_formatted = format_column(field)
            placeholders = ", ".join(["%s"] * len(values))
            params.extend(values)

            or_in_parts.append(f"{field_formatted} IN ({placeholders})")

        if or_in_parts:
            where_parts.append("(" + " OR ".join(or_in_parts) + ")")

    where_sql = " WHERE " + " AND ".join(where_parts)

    query = f"DELETE FROM {formatted_table}{where_sql};"

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)

                affected_rows = cursor.rowcount

                conn.commit()

                return {
                    "success": True,
                    "message": (
                        "Deleted successfully."
                        if affected_rows > 0
                        else "No record deleted."
                    ),
                    "count": affected_rows,
                    "query": query if options.get("echo_query") else None,
                }

    except Exception as error:
        return {
            "success": False,
            "message": f"Query execution failed: {str(error)}",
            "count": 0,
            "query": query if options.get("echo_query") else None,
        }