from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.rag import router as rag_router
from app.api.routes.routing import router as routing_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(routing_router)
api_router.include_router(rag_router)
