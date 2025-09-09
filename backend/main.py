import os
import logging
from datetime import datetime
from contextlib import asynccontextmanager

# --- Load environment variables ---
from dotenv import load_dotenv
load_dotenv()

# --- Logging setup ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('app.log'), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# --- Global Firebase client ---
db = None

# --- FastAPI import ---
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer

# --- Firebase imports ---
import firebase_admin
from firebase_admin import credentials, firestore

# --- Lifespan context for startup/shutdown ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    global db
    try:
        if not firebase_admin._apps:
            firebase_cred = credentials.Certificate({
                "type": os.getenv("FIREBASE_TYPE"),
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
                "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
                "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"),
                "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL")
            })
            firebase_admin.initialize_app(firebase_cred)
        db = firestore.client()
        logger.info("Firebase initialized successfully")
    except Exception as e:
        logger.error(f"Firebase initialization failed: {e}")
        raise
    yield
    logger.info("Shutting down application")

# --- Set NLTK data path BEFORE importing nltk ---
# Use committed folder relative to this file
NLTK_DATA_DIR = os.path.join(os.path.dirname(__file__), "nltk_data")
os.environ['NLTK_DATA'] = NLTK_DATA_DIR

import nltk
# Now you can safely import modules using WordNet
from nltk.stem.wordnet import WordNetLemmatizer

# --- FastAPI App ---
app = FastAPI(
    title="Product Trend Predictor API",
    description="AI-powered sentiment analysis and trend prediction for products",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sentiment-driven-product-trend-predictor-gw8eb1lb3.vercel.app",
        "https://sentiment-driven-product-trend-predictor-833d3hte4.vercel.app",
        "https://sentiment-driven-product-trend-pred.vercel.app",
        "https://sentiment-driven-product-trend-predictor.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security ---
security = HTTPBearer()

# --- Track uptime ---
start_time = datetime.now()

# --- Import services, models, routes AFTER NLTK & Firebase ---
import models, dependencies, utils
from services import (
    reddit_service, twitter_service, youtube_service,
    news_service, google_trends_service, ecommerce_scraper,
    openrouter_service, sales_forecaster, trend_predictor
)
import numpy as np
np.float_ = np.float64

from routes import analysis, status, auth, profile, newsletter

# --- Include routers ---
app.include_router(analysis.router)
app.include_router(status.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(newsletter.router)

# --- Exception handlers ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP error {exc.status_code}: {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={"success": False, "error": exc.detail})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"success": False, "error": "Internal server error"})

# --- Health check ---
@app.get("/health")
async def root_health_check():
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

# --- Run Uvicorn ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        log_level="info",
        reload=False
    )
