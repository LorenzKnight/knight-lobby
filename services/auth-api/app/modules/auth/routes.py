from fastapi import APIRouter, Header, HTTPException

from app.core.security import decode_access_token
from app.modules.auth.schemas import LoginRequest, RegisterRequest
from app.modules.auth.service import (
    create_user,
    find_user_by_email,
    get_user_accessible_apps,
    login_user,
)


router = APIRouter(prefix="/api/auth", tags=["Auth"])


def get_current_user_from_token(authorization: str | None):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header",
        )

    token = authorization.replace("Bearer ", "")

    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    return payload


@router.post("/register")
def register(data: RegisterRequest):
    existing_user = find_user_by_email(str(data.email))

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    user = create_user(data)

    if not user:
        raise HTTPException(
            status_code=500,
            detail="User could not be created",
        )

    if isinstance(user, dict) and user.get("success") is False:
        raise HTTPException(
            status_code=500,
            detail=user.get("message", "User could not be created"),
        )

    return {
        "success": True,
        "message": "User registered successfully",
        "data": user,
    }


@router.post("/login")
def login(data: LoginRequest):
    result = login_user(data)

    if not result["success"]:
        raise HTTPException(
            status_code=401,
            detail=result["message"],
        )

    return result


@router.get("/me")
def me(authorization: str | None = Header(default=None)):
    payload = get_current_user_from_token(authorization)

    user = find_user_by_email(payload["email"])

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    user.pop("password_hash", None)

    return {
        "success": True,
        "message": "Authenticated user loaded successfully",
        "data": user,
    }


@router.get("/me/apps")
def my_apps(authorization: str | None = Header(default=None)):
    payload = get_current_user_from_token(authorization)

    apps = get_user_accessible_apps(payload["user_id"])

    return {
        "success": True,
        "message": "User apps loaded successfully",
        "data": apps,
    }