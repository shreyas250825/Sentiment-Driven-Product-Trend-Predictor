#!/usr/bin/env python3
"""
Test script to verify the analysis endpoint functionality
"""
import asyncio
import logging
import os
from services.product_analyzer import ProductAnalyzer

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_analysis_endpoint():
    """Test the product analyzer directly"""

    logger.info("Checking environment variables...")

    # Check which API keys are available
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    twitter_key = os.getenv("TWITTER_CONSUMER_KEY")
    google_key = os.getenv("GOOGLE_TRENDS_API_KEY")

    logger.info(f"OpenRouter API key: {'Set' if openrouter_key else 'Not set'}")
    logger.info(f"Twitter API key: {'Set' if twitter_key else 'Not set'}")
    logger.info(f"Google Trends API key: {'Set' if google_key else 'Not set'}")

    # Set dummy environment variables to prevent initialization errors
    if not twitter_key:
        os.environ["TWITTER_CONSUMER_KEY"] = "dummy"
        os.environ["TWITTER_CONSUMER_SECRET"] = "dummy"
        os.environ["TWITTER_ACCESS_TOKEN"] = "dummy"
        os.environ["TWITTER_ACCESS_TOKEN_SECRET"] = "dummy"
        logger.info("Set dummy Twitter credentials")

    if not google_key:
        os.environ["GOOGLE_TRENDS_API_KEY"] = "dummy"
        logger.info("Set dummy Google Trends API key")

    logger.info("Initializing ProductAnalyzer...")
    try:
        analyzer = ProductAnalyzer()
        logger.info("✅ ProductAnalyzer initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize ProductAnalyzer: {e}")
        return False

    # Test with a simple product
    product = "iPhone 15"
    sources = ["reddit", "youtube", "news"]  # Using fewer sources to avoid API limits

    logger.info(f"Testing analysis for product: {product}")
    logger.info(f"Using sources: {sources}")

    try:
        result = await analyzer.analyze_product(product, sources)

        logger.info("✅ Analysis completed successfully!")
        logger.info(f"Product: {result.get('product')}")
        logger.info(f"Sentiment: {result.get('sentiment', {}).get('overall_sentiment', 'N/A')}")
        logger.info(f"Trend Prediction: {result.get('trend_prediction', {}).get('predicted_trend', 'N/A')}")
        logger.info(f"Trend Data Points: {len(result.get('trend_data', []))}")
        logger.info(f"Raw Data Sources: {len(result.get('raw_data', {}).get('sample_posts', []))}")

        # Check if we have the expected data structure
        required_keys = ['product', 'sentiment', 'trend_prediction', 'trend_data', 'raw_data']
        missing_keys = [key for key in required_keys if key not in result]
        if missing_keys:
            logger.warning(f"Missing keys in result: {missing_keys}")
        else:
            logger.info("✅ All required keys present in result")

        # Check trend_data structure
        trend_data = result.get('trend_data', [])
        if trend_data:
            sample_point = trend_data[0]
            required_trend_keys = ['date', 'sentiment', 'value']
            missing_trend_keys = [key for key in required_trend_keys if key not in sample_point]
            if missing_trend_keys:
                logger.warning(f"Missing keys in trend_data points: {missing_trend_keys}")
            else:
                logger.info("✅ Trend data structure is correct")

            # Log first few trend data points
            logger.info("Sample trend data points:")
            for i, point in enumerate(trend_data[:3]):
                logger.info(f"  Point {i+1}: {point}")
        else:
            logger.warning("No trend data available")

        # Check sentiment structure
        sentiment = result.get('sentiment', {})
        if sentiment:
            logger.info(f"Sentiment breakdown: {sentiment.get('sentiment_breakdown', {})}")
            logger.info(f"Positive aspects: {sentiment.get('key_positive_aspects', [])}")
            logger.info(f"Negative aspects: {sentiment.get('key_negative_aspects', [])}")

        return True

    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_analysis_endpoint())
    exit(0 if success else 1)
