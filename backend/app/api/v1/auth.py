from datetime import timedelta

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.deps import get_current_user, get_user_role_codes, utcnow, user_role_codes
from app.core.errors import bad_request, conflict, unauthorized
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.database import get_db
from app.models.identity import AuthSession, AuthToken, Role, User, UserPreference, UserProfile, UserRole
from app.schemas.auth import LoginRequest, ProfileOut, RefreshRequest, RegisterRequest, TokenResponse, UserOut, VerifyEmailRequest
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


async def _issue_tokens(db: AsyncSession, user: User, request: Request) -> TokenResponse:
    raw_refresh, refresh_hash = generate_refresh_token()
    session = AuthSession(
        user_id=user.id,
        refresh_token_hash=refresh_hash,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=utcnow() + timedelta(days=settings.refresh_token_ttl_days),
    )
    db.add(session)
    await db.flush()

    roles = await get_user_role_codes(db, user.id)
    access = create_access_token(str(user.id), roles)
    return TokenResponse(access_token=access, refresh_token=raw_refresh)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower()
    exists = await db.execute(select(User.id).where(func.lower(User.email) == email))
    if exists.scalar_one_or_none() is not None:
        raise conflict("An account with this email already exists.", code="EMAIL_TAKEN")

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        status="pending_verification",
    )
    db.add(user)
    await db.flush()

    db.add(UserProfile(user_id=user.id))
    db.add(UserPreference(user_id=user.id))

    student_role = await db.execute(select(Role).where(Role.code == "student"))
    role = student_role.scalar_one_or_none()
    if role is not None:
        db.add(UserRole(user_id=user.id, role_id=role.id))

    # Email delivery provider is not wired yet; in development the raw token is
    # returned so the flow can be exercised. Never return it in production.
    raw_token = None
    if settings.environment == "development":
        import secrets

        raw_token = secrets.token_urlsafe(32)
        db.add(
            AuthToken(
                user_id=user.id,
                token_hash=hash_token(raw_token),
                purpose="email_verification",
                expires_at=utcnow() + timedelta(hours=settings.email_verification_ttl_hours),
            )
        )
    else:
        # TODO: send verification email via provider; token generation belongs there.
        pass

    await db.commit()

    response: dict = {"message": "Registration successful. Check your email to verify your account."}
    if raw_token is not None:
        response["dev_verification_token"] = raw_token
    return response


@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(payload: VerifyEmailRequest, request: Request, db: AsyncSession = Depends(get_db)):
    token_hash = hash_token(payload.token)
    result = await db.execute(
        select(AuthToken).where(
            AuthToken.token_hash == token_hash,
            AuthToken.purpose == "email_verification",
            AuthToken.used_at.is_(None),
            AuthToken.expires_at > utcnow(),
        )
    )
    auth_token = result.scalar_one_or_none()
    if auth_token is None:
        raise bad_request("Invalid or expired verification token.", code="INVALID_TOKEN")

    user = await db.get(User, auth_token.user_id)
    if user is None:
        raise bad_request("User not found.", code="USER_NOT_FOUND")

    auth_token.used_at = utcnow()
    user.email_verified_at = utcnow()
    if user.status == "pending_verification":
        user.status = "active"

    await db.flush()
    tokens = await _issue_tokens(db, user, request)
    await db.commit()
    return tokens


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower()
    result = await db.execute(
        select(User).where(func.lower(User.email) == email).options()
    )
    user = result.scalar_one_or_none()
    if user is None or user.password_hash is None or not verify_password(payload.password, user.password_hash):
        raise unauthorized("Invalid email or password.", code="INVALID_CREDENTIALS")

    if user.status == "pending_verification":
        raise unauthorized("Please verify your email before logging in.", code="EMAIL_NOT_VERIFIED")
    if user.status != "active":
        raise unauthorized("This account is not active.", code="ACCOUNT_INACTIVE")

    user.last_login_at = utcnow()
    await db.flush()
    tokens = await _issue_tokens(db, user, request)
    await db.commit()
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, request: Request, db: AsyncSession = Depends(get_db)):
    token_hash = hash_token(payload.refresh_token)
    result = await db.execute(
        select(AuthSession).where(
            AuthSession.refresh_token_hash == token_hash,
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > utcnow(),
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise unauthorized("Invalid or expired refresh token.", code="INVALID_REFRESH_TOKEN")

    user = await db.get(User, session.user_id)
    if user is None or user.status != "active":
        raise unauthorized("User not found or inactive.", code="USER_INACTIVE")

    # Rotate: revoke the old session, issue a new pair.
    session.revoked_at = utcnow()
    await db.flush()
    tokens = await _issue_tokens(db, user, request)
    await db.commit()
    return tokens


@router.post("/logout", response_model=MessageResponse)
async def logout(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hash_token(payload.refresh_token)
    result = await db.execute(select(AuthSession).where(AuthSession.refresh_token_hash == token_hash))
    session = result.scalar_one_or_none()
    if session is not None and session.revoked_at is None:
        session.revoked_at = utcnow()
        await db.commit()
    return MessageResponse(message="Logged out.")


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return UserOut(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        status=user.status,
        email_verified=user.email_verified_at is not None,
        roles=user_role_codes(user),
    )


@router.get("/me/profile", response_model=ProfileOut)
async def my_profile(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    profile = await db.get(UserProfile, user.id)
    if profile is None:
        raise bad_request("Profile not found.", code="PROFILE_NOT_FOUND")
    return ProfileOut(
        user_id=str(profile.user_id),
        phone=profile.phone,
        programming_level=profile.programming_level,
        career_goal=profile.career_goal,
        timezone=profile.timezone,
    )
