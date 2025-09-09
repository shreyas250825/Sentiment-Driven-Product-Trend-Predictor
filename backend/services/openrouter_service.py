# services/openrouter_service.py
import os
import json
import aiohttp
import logging
import re
from typing import List, Dict
from collections import defaultdict

logger = logging.getLogger(__name__)

class OpenRouterService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "mistralai/mixtral-8x7b-instruct"
        self.fallback_model = "mistralai/mistral-7b-instruct"
   
      #Analysis Sentiment and remove noise from posts
    
    def _filter_posts(self, posts: List[Dict], product_name: str) -> List[Dict]:
        """
        Filter out irrelevant or noisy posts before analysis.
        - Removes empty/very short posts
        - Removes posts that do not mention the product_name
        - Keeps only meaningful text content
        """
        filtered = []
        product_name_lower = product_name.lower()

        for post in posts:
            text = post.get("text", "").strip()
            if not text or len(text) < 10:
                continue  # skip empty/very short posts

            if product_name_lower not in text.lower():
                continue  # skip if product not even mentioned

            filtered.append(post)

        if not filtered:
            # fallback: if everything was filtered out, keep at least something
            return posts[:5]
        return filtered

    # ---------------------- SENTIMENT ANALYSIS ----------------------

    async def analyze_sentiment(self, posts: List[Dict], product: str) -> Dict:
        """Analyze sentiment of posts using OpenRouter AI."""
        if not posts:
            return self._fallback_sentiment(posts)

        # Apply filtering
        posts = self._filter_posts(posts, product)

        post_contexts = []
        for post in posts[:50]:  # cap at 50 posts
            context = {
                "text": post["text"],
                "source": post.get("source", "unknown"),
                "engagement": post.get("engagement_score", 0),
                "rating": post.get("rating", 0),
                "verified": post.get("verified", False),
            }
            post_contexts.append(context)

        prompt = f"""
        As a senior product analyst, analyze these customer reviews from various platforms.
        Consider engagement metrics, source credibility, and contextual factors.

        REVIEW CONTEXTS:
        {self._safe_json(post_contexts)}

        Provide comprehensive sentiment analysis with this EXACT JSON structure:
        {{
            "overall_sentiment": "positive|negative|neutral",
            "confidence_score": 0.0-1.0,
            "key_positive_aspects": ["aspect1", "aspect2", "aspect3"],
            "key_negative_aspects": ["aspect1", "aspect2", "aspect3"],
            "sample_size": integer,
            "sentiment_breakdown": {{"positive": number, "negative": number, "neutral": number}},
            "common_themes": ["theme1", "theme2", "theme3"]
        }}

        Weight high-engagement content more heavily and identify explicit/implicit sentiment.
        """

        try:
            response = await self._make_ai_request(prompt)
            sentiment_data = self._parse_json_safe(response)
            sentiment_data = self._enhance_with_metrics(sentiment_data, posts)
            return sentiment_data
        except Exception as e:
            logger.error(f"OpenRouter API error: {e}")
            return self._fallback_sentiment(posts)

    # ---------------------- TREND PREDICTION ----------------------

    async def predict_trend(self, sentiment: Dict, historical_data: Dict) -> Dict:
        """Predict product trend using sentiment + historical data."""
        prompt = f"""
        As a market trend analyst, predict product performance based on this data.

        SENTIMENT ANALYSIS:
        {self._safe_json(sentiment)}

        HISTORICAL DATA:
        {self._safe_json(historical_data)}

        Provide trend prediction with this EXACT JSON structure:
        {{
            "predicted_trend": "surge|drop|stable",
            "confidence": 0.0-1.0,
            "reasoning": "comprehensive explanation considering all factors",
            "expected_timeline": "short_term|medium_term|long_term",
            "factors": ["factor1", "factor2", "factor3"]
        }}
        """

        try:
            response = await self._make_ai_request(prompt)
            trend_data = self._parse_json_safe(response)
            trend_data = self._ensure_trend_fields(trend_data)
            return trend_data
        except Exception as e:
            logger.error(f"Trend prediction error: {e}")
            return self._fallback_trend(sentiment)

    # ---------------------- AI REQUEST ----------------------

    async def _make_ai_request(self, prompt: str) -> str:
        """Send a prompt to OpenRouter API and return response text."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Product Trend Predictor",
        }
        messages = [
            {
                "role": "system",
                "content": "You are a senior product analyst specialized in trend prediction and sentiment analysis.",
            },
            {"role": "user", "content": prompt},
        ]
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 1500,
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url, json=payload, headers=headers, timeout=60
                ) as response:
                    response.raise_for_status()
                    result_json = await response.json()
                    if "choices" in result_json and len(result_json["choices"]) > 0:
                        return result_json["choices"][0]["message"]["content"]
                    else:
                        raise ValueError("OpenRouter returned empty response")
        except Exception as primary_error:
            logger.warning(
                f"Primary model failed: {primary_error}, trying fallback model"
            )
            payload["model"] = self.fallback_model
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url, json=payload, headers=headers, timeout=60
                ) as response:
                    response.raise_for_status()
                    result_json = await response.json()
                    if "choices" in result_json and len(result_json["choices"]) > 0:
                        return result_json["choices"][0]["message"]["content"]
                    else:
                        raise ValueError("Fallback model returned empty response")

   # ---------------------- JSON HELPERS ----------------------

    def _safe_json(self, data) -> str:
        """Convert Python data to safe JSON string for prompt injection."""
        try:
            return json.dumps(data, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"[Safe JSON] Serialization failed: {e}")
            return "{}"

    def _parse_json_safe(self, text: str) -> Dict:
        """Extract and parse the first valid JSON object from the response, 
        falling back to default structure if parsing fails."""
        try:
            # Prefer fenced JSON ```json ... ```
            match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
            if match:
                return json.loads(match.group(1))

            # Otherwise, any JSON-like block
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                return json.loads(match.group(0))

            # Fallback: direct parse
            return json.loads(text.strip())
        except Exception as e:
            logger.warning(f"[Safe JSON] Parse failed: {e} | Raw: {text[:200]}")
            return {
                "predicted_trend": "neutral",
                "confidence": 0.0,
                "reasoning": ""
            }

    # ---------------------- DATA ENHANCEMENTS ----------------------

    def _ensure_trend_fields(self, data: Dict) -> Dict:
        """Ensure trend JSON has all required fields."""
        defaults = {
            "predicted_trend": "stable",
            "confidence": 0.7,
            "reasoning": "Fallback reasoning",
            "expected_timeline": "short_term",
            "factors": [],
        }
        for key, value in defaults.items():
            data.setdefault(key, value)
        return data

    def _enhance_with_metrics(self, sentiment_data: Dict, posts: List[Dict]) -> Dict:
        """Adjust sentiment confidence using engagement weights."""
        positive_engagement = sum(
            post["engagement_score"]
            for post in posts
            if self._estimate_post_sentiment(post["text"]) == "positive"
        )
        negative_engagement = sum(
            post["engagement_score"]
            for post in posts
            if self._estimate_post_sentiment(post["text"]) == "negative"
        )
        total_engagement = positive_engagement + negative_engagement

        if total_engagement > 0:
            engagement_ratio = positive_engagement / total_engagement
            adjusted_confidence = (
                sentiment_data.get("confidence_score", 0.7) + engagement_ratio
            ) / 2
            sentiment_data["confidence_score"] = min(adjusted_confidence, 0.95)
        return sentiment_data

    def _estimate_post_sentiment(self, text: str) -> str:
        """Naive sentiment estimator for fallback mode."""
        text_lower = text.lower()
        positive_words = {
            "good", "great", "excellent", "awesome", "love", "best",
            "amazing", "perfect", "recommend", "fantastic", "outstanding", "superb",
        }
        negative_words = {
            "bad", "terrible", "awful", "hate", "worst", "disappointing",
            "poor", "broken", "waste", "rubbish", "garbage", "avoid",
        }
        pos = sum(1 for w in positive_words if w in text_lower)
        neg = sum(1 for w in negative_words if w in text_lower)
        return "positive" if pos > neg else "negative" if neg > pos else "neutral"

    # ---------------------- FALLBACK MODES ----------------------

    def _fallback_sentiment(self, posts: List[Dict]) -> Dict:
        """Basic sentiment analysis if API fails."""
        sentiment_counts = defaultdict(int)
        total_engagement = positive_engagement = negative_engagement = 0
        for post in posts:
            sentiment = self._estimate_post_sentiment(post["text"])
            sentiment_counts[sentiment] += 1
            engagement = post.get("engagement_score", 1)
            total_engagement += engagement
            if sentiment == "positive":
                positive_engagement += engagement
            elif sentiment == "negative":
                negative_engagement += engagement

        total = len(posts)
        confidence = (
            (positive_engagement + negative_engagement) / total_engagement
            if total_engagement > 0 else 0.7
        )
        overall = (
            "positive" if sentiment_counts["positive"] > sentiment_counts["negative"]
            else "negative" if sentiment_counts["negative"] > sentiment_counts["positive"]
            else "neutral"
        )
        return {
            "overall_sentiment": overall,
            "confidence_score": min(confidence, 0.95),
            "key_positive_aspects": ["performance", "quality"] if sentiment_counts["positive"] > 0 else [],
            "key_negative_aspects": ["price", "battery"] if sentiment_counts["negative"] > 0 else [],
            "sample_size": total,
            "sentiment_breakdown": dict(sentiment_counts),
            "common_themes": ["customer feedback", "product experience"],
        }

    def _fallback_trend(self, sentiment: Dict) -> Dict:
        """Basic trend prediction if API fails."""
        if sentiment.get("overall_sentiment") == "positive" and sentiment.get("confidence_score", 0) > 0.6:
            trend, confidence, reasoning = (
                "surge",
                sentiment["confidence_score"],
                "Strong positive sentiment indicates potential growth",
            )
        elif sentiment.get("overall_sentiment") == "negative" and sentiment.get("confidence_score", 0) > 0.6:
            trend, confidence, reasoning = (
                "drop",
                sentiment["confidence_score"],
                "Negative sentiment suggests possible decline",
            )
        else:
            trend, confidence, reasoning = (
                "stable",
                0.7,
                "Mixed or neutral sentiment suggests stability",
            )

        return {
            "predicted_trend": trend,
            "confidence": confidence,
            "reasoning": reasoning,
            "expected_timeline": "short_term",
            "factors": ["sentiment analysis", "market patterns"],
        }

# Keep this file as the base for OpenRouter integration.