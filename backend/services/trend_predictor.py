import logging
from typing import Dict
logger = logging.getLogger(__name__)
class TrendPredictor:
    """Combine sentiment and sales forecast for trend prediction"""
    
    def predict_trend(self, sentiment_result: Dict, 
                     sales_forecast: Dict, market_data: Dict) -> Dict:
        """Predict overall product trend"""
        
        # Calculate sentiment score (0-1 scale)
        sentiment_score = self._calculate_sentiment_score(sentiment_result)
        
        # Calculate forecast score based on trend
        forecast_score = self._calculate_forecast_score(sales_forecast)
        
        # Combine scores with weights
        final_score = (sentiment_score * 0.6) + (forecast_score * 0.4)
        
        # Determine trend category
        if final_score > 0.7:
            trend = "surge"
            confidence = final_score
            timeline = "short_term"
            reasoning = "Strong positive sentiment combined with upward sales forecast indicates potential surge"
        elif final_score < 0.4:
            trend = "drop"
            confidence = 1 - final_score
            timeline = "medium_term"
            reasoning = "Negative sentiment and declining forecast suggest potential drop"
        else:
            trend = "stable"
            confidence = 0.7
            timeline = "short_term"
            reasoning = "Mixed signals with moderate sentiment and stable forecast"
        
        factors = [
            f"Sentiment: {sentiment_result['overall_sentiment']} (confidence: {sentiment_result['confidence_score']:.2f})",
            f"Sales forecast: {sales_forecast.get('trend', 'stable')}",
            f"Sample size: {sentiment_result['sample_size']} sources"
        ]
        
        return {
            'predicted_trend': trend,
            'confidence': confidence,
            'reasoning': reasoning,
            'expected_timeline': timeline,
            'factors': factors
        }
    
    def _calculate_sentiment_score(self, sentiment: Dict) -> float:
        """Convert sentiment result to numerical score"""
        if sentiment['overall_sentiment'] == "positive":
            base_score = 0.8
        elif sentiment['overall_sentiment'] == "negative":
            base_score = 0.2
        else:
            base_score = 0.5
        
        # Adjust based on confidence and sample size
        sample_factor = min(sentiment['sample_size'] / 50, 1.0)  # Normalize sample size
        return base_score * sentiment['confidence_score'] * (0.7 + 0.3 * sample_factor)
    
    def _calculate_forecast_score(self, forecast: Dict) -> float:
        """Convert forecast trend to numerical score"""
        trend = forecast.get('trend', 'stable')
        
        if trend == "growing":
            return 0.8
        elif trend == "declining":
            return 0.2
        else:
            return 0.5