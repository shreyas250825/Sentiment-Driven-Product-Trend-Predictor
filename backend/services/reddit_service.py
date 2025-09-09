import os
import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import List, Dict
from collections import defaultdict

logger = logging.getLogger(__name__)

class RedditService:
    def __init__(self):
        self.access_token = None
        self.token_expiry = None
    
    async def get_access_token(self):
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
        
        auth = aiohttp.BasicAuth(os.getenv("REDDIT_CLIENT_ID"), os.getenv("REDDIT_CLIENT_SECRET"))
        data = {'grant_type': 'client_credentials'}
        headers = {'User-Agent': os.getenv("REDDIT_USER_AGENT", "ProductTrendPredictor/1.0")}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://www.reddit.com/api/v1/access_token',
                auth=auth,
                data=data,
                headers=headers
            ) as response:
                if response.status == 200:
                    token_data = await response.json()
                    self.access_token = token_data['access_token']
                    self.token_expiry = datetime.now() + timedelta(seconds=token_data['expires_in'] - 60)
                    return self.access_token
                else:
                    logger.error(f"Reddit auth failed: {response.status}")
                    return None
    
    async def search_posts(self, product: str, limit: int = 50) -> List[Dict]:
        try:
            token = await self.get_access_token()
            if not token:
                raise Exception("Failed to obtain Reddit access token")
            
            headers = {
                'Authorization': f'Bearer {token}',
                'User-Agent': os.getenv("REDDIT_USER_AGENT", "ProductTrendPredictor/1.0")
            }
            
            # Search across multiple subreddits
            subreddits = ['technology', 'gadgets', 'productreviews', 'buyitforlife']
            all_posts = []
            
            for subreddit in subreddits:
                url = f'https://oauth.reddit.com/r/{subreddit}/search'
                params = {
                    'q': product,
                    'limit': min(limit, 25),
                    'sort': 'relevance',
                    't': 'month'
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=headers, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            posts = data.get('data', {}).get('children', [])
                            for post in posts:
                                post_data = post.get('data', {})
                                all_posts.append({
                                    'text': f"{post_data.get('title', '')} {post_data.get('selftext', '')}",
                                    'source': 'reddit',
                                    'subreddit': subreddit,
                                    'upvotes': post_data.get('ups', 0),
                                    'comments': post_data.get('num_comments', 0),
                                    'created_at': datetime.fromtimestamp(post_data.get('created_utc', 0)).isoformat(),
                                    'url': f"https://reddit.com{post_data.get('permalink', '')}",
                                    'engagement_score': self._calculate_engagement_score(post_data)
                                })
                        await asyncio.sleep(1)  # Rate limiting
            
            logger.info(f"Found {len(all_posts)} Reddit posts for {product}")
            return all_posts
            
        except Exception as e:
            logger.error(f"Reddit API error: {e}")
            raise Exception(f"Failed to fetch Reddit data: {str(e)}")
    
    def _calculate_engagement_score(self, post_data: Dict) -> float:
        upvotes = post_data.get('ups', 0)
        comments = post_data.get('num_comments', 0)
        return (upvotes * 0.6) + (comments * 0.4)
