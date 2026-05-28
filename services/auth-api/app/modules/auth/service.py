from knight_core.functions import insert_into, select_from
from app.core.security import hash_password, verify_password, create_access_token


def find_user_by_email(email: str) -> dict | None:
    result = select_from(
        "users",
        [
            "user_id",
            "email",
            "password_hash",
            "first_name",
            "last_name",
            "username",
            "status",
            "is_verified",
        ],
        {
            "email": email,
        },
        {
            "fetch_first": True,
        },
    )

    if not result["success"]:
        return None

    return result["data"]


def create_user(data) -> dict:
    password_hash = hash_password(data.password)

    insert_result = insert_into(
        "users",
        {
            "email": str(data.email),
            "password_hash": password_hash,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "username": data.username,
            "status": "active",
            "is_verified": True,
        },
        {
            "id": "user_id",
        },
    )

    if not insert_result["success"]:
        return insert_result

    user_id = insert_result.get("id")

    user_result = select_from(
        "users",
        [
            "user_id",
            "email",
            "first_name",
            "last_name",
            "username",
            "status",
            "is_verified",
        ],
        {
            "user_id": user_id,
        },
        {
            "fetch_first": True,
        },
    )

    return user_result["data"]


def login_user(data) -> dict:
    user = find_user_by_email(data.email)

    if not user:
        return {
            "success": False,
            "message": "Invalid email or password",
        }

    if user["status"] != "active":
        return {
            "success": False,
            "message": "User account is not active",
        }

    if not verify_password(data.password, user["password_hash"]):
        return {
            "success": False,
            "message": "Invalid email or password",
        }

    token = create_access_token(
        {
            "user_id": user["user_id"],
            "email": user["email"],
        }
    )

    user.pop("password_hash", None)

    return {
        "success": True,
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


def get_user_accessible_apps(user_id: int) -> list:
    result = select_from(
        """
        user_app_access uaa
        JOIN ecosystem_apps e ON e.app_id = uaa.app_id
        LEFT JOIN roles r ON r.role_id = uaa.role_id
        """,
        [
            "e.app_id",
            "e.name",
            "e.slug",
            "e.description",
            "e.status",
            "e.portal_color",
            "e.icon",
            "e.route_url",
            "e.sort_order",
            "e.is_locked",
            "r.name AS role_name",
            "uaa.access_status",
        ],
        {
            "uaa.user_id": user_id,
            "uaa.access_status": "active",
        },
        {
            "order_by": "e.sort_order ASC, e.app_id",
            "order_direction": "ASC",
        },
    )

    return result["data"] if result["success"] else []