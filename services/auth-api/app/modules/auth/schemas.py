from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)