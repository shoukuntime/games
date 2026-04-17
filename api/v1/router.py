from fastapi import APIRouter

from api.v1.endpoints.auth import router as auth_router
from api.v1.endpoints.rooms import router as rooms_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(rooms_router)
