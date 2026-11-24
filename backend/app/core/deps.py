from datetime import datetime, timezone
from uuid import UUID

import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import unauthorized
from app.core.security import decode_access_token
from app.database import get_db
from app.models.identity import Role, User, UserRole

bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise unauthorized("Missing bearer token.")
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise unauthorized("Invalid or expired token.", code="INVALID_TOKEN") from exc

    result = await db.execute(
        select(User)
        .where(User.id == user_id, User.status == "active")
        .options(selectinload(User.roles).selectinload(UserRole.role))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise unauthorized("User not found or inactive.", code="USER_INACTIVE")

    request.state.user = user
    return user


async def get_optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Like get_current_user but returns None for anonymous/invalid callers."""
    if credentials is None:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
    result = await db.execute(
        select(User)
        .where(User.id == user_id, User.status == "active")
        .options(selectinload(User.roles).selectinload(UserRole.role))
    )
    user = result.scalar_one_or_none()
    if user is None:
        return None
    request.state.user = user
    return user


def user_role_codes(user: User) -> list[str]:
    return [ur.role.code for ur in user.roles]


async def get_user_role_codes(db: AsyncSession, user_id: UUID) -> list[str]:
    result = await db.execute(
        select(Role.code)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id)
    )
    return list(result.scalars().all())


def require_roles(*allowed: str):
    async def checker(user: User = Depends(get_current_user)) -> User:
        codes = user_role_codes(user)
        if not any(code in allowed for code in codes):
            from app.core.errors import forbidden

            raise forbidden("You do not have permission to perform this action.", code="INSUFFICIENT_ROLE")
        return user

    return checker


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
