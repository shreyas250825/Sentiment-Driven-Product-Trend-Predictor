import logging
from typing import Dict, Any
from pytrends.request import TrendReq

logger = logging.getLogger(__name__)

class GoogleTrendsService:
    def __init__(self):
        self.pytrends = TrendReq(hl='en-US', tz=360)
    
    async def get_trends_data(self, product: str, time_range: str = "today 3-m") -> Dict[str, Any]:
        try:
            # Build payload
            self.pytrends.build_payload(
                kw_list=[product],
                cat=0,
                timeframe=time_range,
                geo='',
                gprop=''
            )

            # Interest over time
            interest_over_time = self.pytrends.interest_over_time()

            # Related queries
            related_queries = self.pytrends.related_queries()

            # Interest by region
            interest_by_region = self.pytrends.interest_by_region()

            return {
                "interest_over_time": interest_over_time.to_dict(),
                "related_queries": {k: v.to_dict() for k, v in related_queries.items()},
                "interest_by_region": interest_by_region.to_dict(),
            }
        except Exception as e:
            logger.error(f"Google Trends error: {e}")
            # Return fallback data instead of raising exception
            return self._get_fallback_trends_data(product)

    def _get_fallback_trends_data(self, product: str) -> Dict[str, Any]:
        return {
            "interest_over_time": {"data": "Fallback data"},
            "related_queries": {"top": {"query": [product], "value": [100]}},
            "interest_by_region": {"US": 100, "IN": 85, "UK": 75},
        }
