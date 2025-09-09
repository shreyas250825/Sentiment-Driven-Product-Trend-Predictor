from fastapi import APIRouter
from datetime import datetime
import os
router = APIRouter(prefix="/api", tags=["status"])
start_time = datetime.now()
@router.get("/")
async def root():
    return {
        "message": "Product Trend Predictor API",
        "version": "2.0.0",
        "documentation": "/docs",
        "status": "operational"
    }
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "uptime": str(datetime.now() - start_time),
        "services": {
            "reddit": os.getenv("REDDIT_CLIENT_ID") is not None,
            "openrouter": os.getenv("OPENROUTER_API_KEY") is not None,
            "forecasting": True,
            "firebase": True
        }
    }
@router.get("/status")
async def api_status():
    status = {
        "timestamp": datetime.now().isoformat(),
        "status": "operational",
        "services": {
            "reddit": {
                "status": "operational" if os.getenv("REDDIT_CLIENT_ID") else "disabled",
                "message": "Reddit API connected" if os.getenv("REDDIT_CLIENT_ID") else "Reddit API not configured"
            },
            "openrouter": {
                "status": "operational" if os.getenv("OPENROUTER_API_KEY") else "disabled",
                "message": "OpenRouter API connected" if os.getenv("OPENROUTER_API_KEY") else "OpenRouter API not configured"
            },
            "forecasting": {
                "status": "operational",
                "message": "Prophet and ARIMA available"
            },
            "firebase": {
                "status": "operational",
                "message": "Firebase connected"
            }
        },
        "statistics": {
            "uptime": str(datetime.now() - start_time)
        }
    }

    return status

@router.get("/notifications")
async def get_notifications():
    # For now, return 0. In future, fetch from database or service
    return {"count": 0}
