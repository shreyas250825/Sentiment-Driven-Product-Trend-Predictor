from pydantic import BaseModel
from typing import List, Dict, Any

class AnalysisRequest(BaseModel):
    product: str
    time_range: str = "7d"
    max_posts: int = 100
    sources: List[str] = ["reddit", "twitter", "youtube", "news", "google_trends", "amazon", "flipkart"]

class SentimentResult(BaseModel):
    overall_sentiment: str
    confidence_score: float
    key_positive_aspects: List[str]
    key_negative_aspects: List[str]
    sample_size: int
    sentiment_breakdown: Dict[str, int] = {}
    common_themes: List[str] = []

class TrendPrediction(BaseModel):
    predicted_trend: str
    confidence: float
    reasoning: str
    expected_timeline: str
    factors: List[str] = []

class AnalysisResponse(BaseModel):
    product: str
    sentiment: SentimentResult
    trend_prediction: TrendPrediction
    raw_data: Dict[str, Any]
    timestamp: str
    analysis_id: str