#!/usr/bin/env python3
"""
Test script to verify OpenRouter service functionality
"""
import os
import asyncio
import logging
from services.openrouter_service import OpenRouterService

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_openrouter_service():
    """Test the OpenRouter service with sample data"""

    # Check if API key is set
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("OPENROUTER_API_KEY environment variable is not set!")
        return False

    logger.info(f"OpenRouter API key is set: {api_key[:10]}...")

    # Initialize service
    service = OpenRouterService()
    logger.info(f"Service initialized with model: {service.model}")

    # Test data
    sample_posts = [
        {
            "text": "I love the new iPhone 16! The camera is amazing and battery life is great.",
            "source": "twitter",
            "engagement_score": 150,
            "rating": 5
        },
        {
            "text": "The iPhone 16 is overpriced and the design hasn't changed much.",
            "source": "reddit",
            "engagement_score": 89,
            "rating": 2
        },
        {
            "text": "Great phone, fast delivery and excellent customer service.",
            "source": "amazon",
            "engagement_score": 45,
            "rating": 4
        }
    ]

    try:
        # Test sentiment analysis
        logger.info("Testing sentiment analysis...")
        sentiment_result = await service.analyze_sentiment(sample_posts, "iPhone 16")
        logger.info(f"Sentiment analysis result: {sentiment_result}")

        # Test trend prediction
        logger.info("Testing trend prediction...")
        historical_data = {
            "mentions": len(sample_posts),
            "engagement": sum(post.get('engagement_score', 0) for post in sample_posts),
            "time_period": "7d",
            "google_trends": None
        }

        trend_result = await service.predict_trend(sentiment_result, historical_data)
        logger.info(f"Trend prediction result: {trend_result}")

        logger.info("✅ OpenRouter service test completed successfully!")
        return True

    except Exception as e:
        logger.error(f"❌ OpenRouter service test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_openrouter_service())
    exit(0 if success else 1)
