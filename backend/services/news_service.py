import os
import logging
from datetime import datetime
from typing import List, Dict
from newsapi import NewsApiClient
from nltk.sentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)

class NewsAPIService:
    def __init__(self):
        self.newsapi = NewsApiClient(api_key=os.getenv("NEWS_API_KEY"))
        self.sia = SentimentIntensityAnalyzer()
    
    async def search_news(self, product: str, language: str = 'en', page_size: int = 20) -> List[Dict]:
        try:
            news = self.newsapi.get_everything(
                q=product,
                language=language,
                sort_by='relevancy',
                page_size=page_size
            )
            
            articles = []
            for article in news.get('articles', []):
                text_content = " ".join(
                    filter(None, [article.get('title'), article.get('description'), article.get('content')])
                )
                articles.append({
                    'title': article.get('title'),
                    'description': article.get('description'),
                    'content': article.get('content'),
                    'text': text_content,  # <-- Add this so sentiment analyzer works
                    'published_at': article.get('publishedAt'),
                    'source': article['source'].get('name'),
                    'url': article.get('url'),
                    'engagement_score': self._calculate_engagement_score(article)
                })
            
            return articles
        except Exception as e:
            logger.error(f"News API error for product '{product}': {e}")
            raise Exception(f"Failed to fetch news data: {str(e)}")

    def _calculate_engagement_score(self, article: Dict) -> float:
        content = (article.get('title', '') + ' ' + (article.get('description') or '') + ' ' + (article.get('content') or ''))
        return min(len(content) / 100, 10.0)

    def _get_fallback_news_data(self, product: str) -> List[Dict]:
        text_content = f"{product} is changing how we think about technology."
        return [
            {
                'title': f"{product} Revolutionizes the Market",
                'description': f"The new {product} is changing how we think about technology",
                'content': f"Detailed article about {product} and its impact on the market...",
                'text': text_content,
                'published_at': datetime.now().isoformat(),
                'source': 'Tech News',
                'url': 'https://example.com/article',
                'engagement_score': 8.5
            }
        ]