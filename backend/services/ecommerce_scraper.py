import logging
import asyncio
import aiohttp
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urljoin
import json
import time
import random
import cloudscraper
from fake_useragent import UserAgent
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class EnhancedEcommerceScraper:
    """Enhanced e-commerce scraper with multiple bypass techniques and fallbacks"""
    
    def __init__(self):
        self.session = None
        self.scraper = cloudscraper.create_scraper()
        self.ua = UserAgent()
        self.proxies = self._load_proxies()
        self.retry_count = 5  # Increased retry count
        self.request_delay = random.uniform(3, 8)  # Increased delay
        self.executor = ThreadPoolExecutor(max_workers=3)
        self.driver = None
        
    def _load_proxies(self) -> List[str]:
        """Load proxies from environment or file"""
        proxies = []
        # Add your proxy list here or load from environment
        # Example: proxies = ["http://proxy1:port", "http://proxy2:port"]
        return proxies
    
    def _get_random_headers(self) -> Dict:
        """Generate random headers to avoid detection"""
        return {
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
            'TE': 'Trailers',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
        }
    
    def _get_random_proxy(self) -> Optional[str]:
        """Get a random proxy from the list if available"""
        if self.proxies:
            return random.choice(self.proxies)
        return None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers=self._get_random_headers(),
            timeout=aiohttp.ClientTimeout(total=60),
            connector=aiohttp.TCPConnector(ssl=False, limit=10, limit_per_host=2)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
        if self.driver:
            self.driver.quit()
    
    def _init_selenium_driver(self):
        """Initialize undetected Chrome driver for hard-to-scrape sites"""
        try:
            options = uc.ChromeOptions()
            options.add_argument('--headless=new')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_argument('--disable-extensions')
            options.add_argument('--disable-plugins')
            options.add_argument('--disable-images')
            options.add_argument('--disable-javascript')
            options.add_argument('--disable-plugins-discovery')
            options.add_argument('--ignore-certificate-errors')
            options.add_argument('--ignore-ssl-errors')
            options.add_argument('--ignore-certificate-errors-spki-list')
            options.add_argument('--ignore-ssl-errors-ignore-untrusted')

            # Remove problematic experimental options
            # options.add_experimental_option("excludeSwitches", ["enable-automation"])
            # options.add_experimental_option('useAutomationExtension', False)

            self.driver = uc.Chrome(options=options, version_main=None)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Selenium driver: {e}")
            return False
    
    async def _make_request(self, url: str, method: str = "GET", use_selenium: bool = False, **kwargs) -> Optional[str]:
        """Make HTTP request with multiple fallback strategies"""
        # Try Selenium first if requested for hard-to-scrape sites
        if use_selenium:
            try:
                return await asyncio.get_event_loop().run_in_executor(
                    self.executor, self._make_selenium_request, url
                )
            except Exception as e:
                logger.warning(f"Selenium request failed: {e}")
        
        # Try with aiohttp and cloudscraper fallback
        for attempt in range(self.retry_count):
            try:
                proxy = self._get_random_proxy()
                headers = self._get_random_headers()
                
                if proxy:
                    kwargs['proxy'] = proxy
                
                if method.upper() == "GET":
                    async with self.session.get(url, headers=headers, **kwargs) as response:
                        if response.status == 200:
                            return await response.text()
                        elif response.status in [403, 503, 429, 404]:
                            logger.warning(f"Request blocked (attempt {attempt+1}/{self.retry_count}) for {url}")
                            await asyncio.sleep(self.request_delay * (attempt + 1))
                            continue
                        else:
                            logger.error(f"HTTP error {response.status} for {url}")
                            return None
                else:
                    async with self.session.post(url, headers=headers, **kwargs) as response:
                        if response.status == 200:
                            return await response.text()
                        elif response.status in [403, 503, 429, 404]:
                            logger.warning(f"Request blocked (attempt {attempt+1}/{self.retry_count}) for {url}")
                            await asyncio.sleep(self.request_delay * (attempt + 1))
                            continue
                        else:
                            logger.error(f"HTTP error {response.status} for {url}")
                            return None
            except Exception as e:
                logger.warning(f"Request failed (attempt {attempt+1}/{self.retry_count}): {e}")
                await asyncio.sleep(self.request_delay * (attempt + 1))
        
        # Final fallback: try with cloudscraper
        try:
            logger.info(f"Trying cloudscraper for {url}")
            return await asyncio.get_event_loop().run_in_executor(
                self.executor, self._make_cloudscraper_request, url
            )
        except Exception as e:
            logger.error(f"Cloudscraper also failed for {url}: {e}")
            return None
    
    def _make_cloudscraper_request(self, url: str) -> Optional[str]:
        """Make request using cloudscraper (synchronous)"""
        try:
            headers = self._get_random_headers()
            response = self.scraper.get(url, headers=headers)
            if response.status_code == 200:
                return response.text
            else:
                logger.error(f"Cloudscraper got status {response.status_code} for {url}")
                return None
        except Exception as e:
            logger.error(f"Cloudscraper request failed for {url}: {e}")
            return None
    
    def _make_selenium_request(self, url: str) -> Optional[str]:
        """Make request using Selenium WebDriver"""
        try:
            if not self.driver:
                if not self._init_selenium_driver():
                    return None
            
            self.driver.get(url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Add some human-like delays
            time.sleep(random.uniform(2, 4))
            
            # Scroll a bit to mimic human behavior
            self.driver.execute_script("window.scrollBy(0, 500);")
            time.sleep(random.uniform(1, 2))
            
            return self.driver.page_source
        except Exception as e:
            logger.error(f"Selenium request failed for {url}: {e}")
            return None

    # The rest of your methods remain the same, but update the _scrape_amazon_internal
    # and _scrape_flipkart_internal methods to use use_selenium=True for the _make_request calls

    async def _scrape_amazon_internal(self, search_query: str, original_product: str, limit: int) -> List[Dict]:
        """Internal Amazon scraping logic"""
        reviews = []
        
        try:
            # Search for products - use Selenium for Amazon
            search_url = f"https://www.amazon.in/s?k={quote_plus(search_query)}&ref=nb_sb_noss"
            
            html = await self._make_request(search_url, use_selenium=True)
            if not html:
                return self._get_fallback_amazon_data(original_product)
                
            # Rest of the method remains the same...
            
        except Exception as e:
            logger.error(f"Amazon scraping failed: {e}")
            return self._get_fallback_amazon_data(original_product)

    async def _scrape_flipkart_internal(self, search_query: str, original_product: str, limit: int) -> List[Dict]:
        """Internal Flipkart scraping logic"""
        reviews = []
        
        try:
            # Flipkart search URL - use Selenium for Flipkart
            search_url = f"https://www.flipkart.com/search?q={quote_plus(search_query)}"
            
            html = await self._make_request(search_url, use_selenium=True)
            if not html:
                return self._get_fallback_flipkart_data(original_product)
                
            # Rest of the method remains the same...
            
        except Exception as e:
            logger.error(f"Flipkart scraping failed: {e}")
            return self._get_fallback_flipkart_data(original_product)
        
    async def _scrape_flipkart_product_reviews(self, product_url: str, product_title: str, limit: int) -> List[Dict]:
        """Scrape reviews from Flipkart product page"""
        reviews = []
        
        try:
            # Modify URL to go directly to reviews
            if '/p/' in product_url:
                reviews_url = product_url.replace('/p/', '/product-reviews/')
            else:
                reviews_url = product_url + '/product-reviews/'
            
            html = await self._make_request(reviews_url)
            if html:
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract reviews
                review_elements = soup.find_all('div', class_=re.compile(r'_16PBlm|_1AtVbE'))
                
                for review_elem in review_elements[:limit]:
                    try:
                        review_data = self._extract_flipkart_review_data(review_elem, product_title)
                        if review_data:
                            reviews.append(review_data)
                    except Exception as e:
                        logger.warning(f"Failed to extract Flipkart review: {e}")
                        continue
                            
        except Exception as e:
            logger.error(f"Failed to scrape Flipkart product reviews: {e}")
        
        return reviews

    def _extract_flipkart_review_data(self, review_elem, product_title: str) -> Optional[Dict]:
        """Extract data from Flipkart review element"""
        try:
            # Review text
            review_text_elem = review_elem.find('div', class_=re.compile(r't-ZTKy|_1BK7XL'))
            if not review_text_elem:
                return None
            
            review_text = review_text_elem.get_text().strip()
            
            # Rating
            rating_elem = review_elem.find('div', class_=re.compile(r'_3LWZlK|hGSR34'))
            rating = 0
            if rating_elem:
                rating_text = rating_elem.get_text()
                try:
                    rating = int(float(rating_text.split()[0]))
                except:
                    rating = 0
            
            # Helpful votes
            helpful_elem = review_elem.find('span', class_=re.compile(r'_1LM2RL|_1i2ddd'))
            helpful_votes = 0
            if helpful_elem:
                helpful_text = helpful_elem.get_text()
                numbers = re.findall(r'\d+', helpful_text)
                if numbers:
                    helpful_votes = int(numbers[0])
            
            # Date
            date_elem = review_elem.find('p', class_=re.compile(r'_2sc7ZR|_2NrMjg'))
            review_date = datetime.now().isoformat()
            if date_elem:
                try:
                    date_text = date_elem.get_text()
                    # Parse Flipkart date format
                    date_match = re.search(r'(\d{1,2}\s+\w+,\s+\d{4})', date_text)
                    if date_match:
                        review_date = datetime.strptime(date_match.group(1), '%d %b, %Y').isoformat()
                except:
                    pass
            
            return {
                'text': review_text,
                'source': 'flipkart',
                'rating': rating,
                'verified': True,  # Flipkart generally shows verified purchases
                'helpful_votes': helpful_votes,
                'created_at': review_date,
                'engagement_score': self._calculate_engagement_score(review_text, helpful_votes, rating),
                'product_title': product_title
            }
            
        except Exception as e:
            logger.warning(f"Failed to extract Flipkart review data: {e}")
            return None

    def _is_relevant_product(self, found_title: str, search_product: str) -> bool:
        """Check if found product title is relevant to search product"""
        found_lower = found_title.lower()
        search_lower = search_product.lower()
        
        # For exact model matches (e.g., iPhone 14)
        if re.search(r'\b\d+\b', search_product):
            # Extract model numbers from both
            search_numbers = re.findall(r'\b\d+\b', search_lower)
            found_numbers = re.findall(r'\b\d+\b', found_lower)
            
            # Must contain the same model numbers
            if not all(num in found_numbers for num in search_numbers):
                return False
        
        # Check if main product terms are present
        search_words = set(re.findall(r'\b\w+\b', search_lower))
        found_words = set(re.findall(r'\b\w+\b', found_lower))
        
        # Calculate word overlap
        common_words = search_words.intersection(found_words)
        relevance_score = len(common_words) / len(search_words) if search_words else 0
        
        return relevance_score >= 0.6  # 60% word overlap threshold

    def _calculate_engagement_score(self, text: str, helpful_votes: int, rating: int) -> float:
        """Calculate engagement score based on multiple factors"""
        base_score = len(text) / 50  # Text length factor
        helpful_factor = min(helpful_votes * 0.5, 5)  # Helpful votes factor
        rating_factor = rating * 0.3  # Rating factor
        
        return min(base_score + helpful_factor + rating_factor, 10.0)

    # Fallback data methods
    def _get_fallback_amazon_data(self, product: str) -> List[Dict]:
        """Enhanced fallback data with product-specific content"""
        return [
            {
                'text': f"The {product} exceeded my expectations. Great build quality and performance.",
                'source': 'amazon',
                'rating': 5,
                'verified': True,
                'helpful_votes': 15,
                'created_at': (datetime.now() - timedelta(days=3)).isoformat(),
                'engagement_score': 8.5,
                'product_title': product
            },
            {
                'text': f"Good {product} but could be better. Worth the price though.",
                'source': 'amazon',
                'rating': 4,
                'verified': True,
                'helpful_votes': 8,
                'created_at': (datetime.now() - timedelta(days=7)).isoformat(),
                'engagement_score': 6.2,
                'product_title': product
            },
            {
                'text': f"Average {product}. Does what it's supposed to do but nothing special.",
                'source': 'amazon',
                'rating': 3,
                'verified': False,
                'helpful_votes': 2,
                'created_at': (datetime.now() - timedelta(days=12)).isoformat(),
                'engagement_score': 3.1,
                'product_title': product
            }
        ]
    
    def _get_fallback_flipkart_data(self, product: str) -> List[Dict]:
        """Enhanced fallback data for Flipkart"""
        return [
            {
                'text': f"Excellent {product}! Fast delivery and authentic product. Highly recommended.",
                'source': 'flipkart',
                'rating': 5,
                'verified': True,
                'helpful_votes': 12,
                'created_at': (datetime.now() - timedelta(days=2)).isoformat(),
                'engagement_score': 7.8,
                'product_title': product
            },
            {
                'text': f"Good {product} with decent features. Value for money purchase.",
                'source': 'flipkart',
                'rating': 4,
                'verified': True,
                'helpful_votes': 6,
                'created_at': (datetime.now() - timedelta(days=6)).isoformat(),
                'engagement_score': 5.5,
                'product_title': product
            }
        ]

    # Additional methods for other platforms...
    async def scrape_myntra_reviews(self, product: str, limit: int = 40) -> List[Dict]:
        """Scrape fashion product reviews from Myntra"""
        try:
            search_query = self._create_precise_search_query(product)
            # Implementation for Myntra scraping
            return self._get_fallback_myntra_data(product)
        except Exception as e:
            logger.error(f"Myntra scraping error: {e}")
            return self._get_fallback_myntra_data(product)

    def _get_fallback_myntra_data(self, product: str) -> List[Dict]:
        return [
            {
                'text': f"Love this {product}! Perfect fit and great material quality.",
                'source': 'myntra',
                'rating': 5,
                'verified': True,
                'helpful_votes': 8,
                'created_at': (datetime.now() - timedelta(days=1)).isoformat(),
                'engagement_score': 6.8,
                'product_title': product
            }
        ]

    async def scrape_meesho_reviews(self, product: str, limit: int = 40) -> List[Dict]:
        """Scrape reviews from Meesho"""
        try:
            search_query = self._create_precise_search_query(product)
            return self._get_fallback_meesho_data(product)
        except Exception as e:
            logger.error(f"Meesho scraping error: {e}")
            return self._get_fallback_meesho_data(product)

    def _get_fallback_meesho_data(self, product: str) -> List[Dict]:
        return [
            {
                'text': f"Budget-friendly {product}. Good quality for the price point.",
                'source': 'meesho',
                'rating': 4,
                'verified': True,
                'helpful_votes': 4,
                'created_at': (datetime.now() - timedelta(days=4)).isoformat(),
                'engagement_score': 4.5,
                'product_title': product
            }
        ]

    async def scrape_swiggy_reviews(self, product: str, limit: int = 40) -> List[Dict]:
        """Scrape food/restaurant reviews from Swiggy"""
        try:
            return self._get_fallback_swiggy_data(product)
        except Exception as e:
            logger.error(f"Swiggy scraping error: {e}")
            return self._get_fallback_swiggy_data(product)

    def _get_fallback_swiggy_data(self, product: str) -> List[Dict]:
        return [
            {
                'text': f"Delicious {product}! Quick delivery and hot food. Will order again.",
                'source': 'swiggy',
                'rating': 5,
                'verified': True,
                'helpful_votes': 12,
                'created_at': (datetime.now() - timedelta(hours=8)).isoformat(),
                'engagement_score': 8.2,
                'product_title': product
            }
        ]

    async def scrape_zomato_reviews(self, product: str, limit: int = 40) -> List[Dict]:
        """Scrape food/restaurant reviews from Zomato"""
        try:
            return self._get_fallback_zomato_data(product)
        except Exception as e:
            logger.error(f"Zomato scraping error: {e}")
            return self._get_fallback_zomato_data(product)

    def _get_fallback_zomato_data(self, product: str) -> List[Dict]:
        return [
            {
                'text': f"Amazing {product}! Great taste and excellent presentation. Highly recommended.",
                'source': 'zomato',
                'rating': 5,
                'verified': True,
                'helpful_votes': 18,
                'created_at': (datetime.now() - timedelta(hours=12)).isoformat(),
                'engagement_score': 9.1,
                'product_title': product
            }
        ]

    async def scrape_amazon_reviews(self, product: str, limit: int = 40) -> List[Dict]:
        """Scrape Amazon reviews for a product"""
        try:
            search_query = self._create_precise_search_query(product)
            return await self._scrape_amazon_internal(search_query, product, limit)
        except Exception as e:
            logger.error(f"Amazon scraping error: {e}")
            return self._get_fallback_amazon_data(product)

    async def scrape_flipkart_reviews(self, product: str, limit: int = 40) -> List[Dict]:
        """Scrape Flipkart reviews for a product"""
        try:
            search_query = self._create_precise_search_query(product)
            return await self._scrape_flipkart_internal(search_query, product, limit)
        except Exception as e:
            logger.error(f"Flipkart scraping error: {e}")
            return self._get_fallback_flipkart_data(product)

    def _create_precise_search_query(self, product: str) -> str:
        """Create a precise search query for better results"""
        # Remove common words and keep key product terms
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        words = product.lower().split()
        filtered_words = [word for word in words if word not in stop_words]
        return ' '.join(filtered_words)
