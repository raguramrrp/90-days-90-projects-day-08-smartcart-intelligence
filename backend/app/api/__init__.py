from fastapi import APIRouter
from backend.app.api.auth import router as auth_router
from backend.app.api.products import router as products_router
from backend.app.api.watchlist import router as watchlist_router
from backend.app.api.alerts import router as alerts_router
from backend.app.api.compare import router as compare_router
from backend.app.api.planner import router as planner_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.system import router as system_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(watchlist_router)
api_router.include_router(alerts_router)
api_router.include_router(compare_router)
api_router.include_router(planner_router)
api_router.include_router(analytics_router)
api_router.include_router(system_router)
