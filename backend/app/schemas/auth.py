from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=160)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class VerifyEmailRequest(BaseModel):
    token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    status: str
    email_verified: bool
    roles: list[str]

    model_config = {"from_attributes": True}


class ProfileOut(BaseModel):
    user_id: str
    phone: str | None = None
    programming_level: str | None = None
    career_goal: str | None = None
    timezone: str

    model_config = {"from_attributes": True}
