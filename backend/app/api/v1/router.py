from fastapi import APIRouter

from app.api.v1 import academics, auth, career, coding, learning

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(academics.router)
api_router.include_router(learning.router)
api_router.include_router(coding.router)
api_router.include_router(career.router)
