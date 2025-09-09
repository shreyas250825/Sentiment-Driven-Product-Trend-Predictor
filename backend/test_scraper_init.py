#!/usr/bin/env python3
"""
Test script to verify that the EnhancedEcommerceScraper can be initialized
without fake_useragent errors.
"""

import logging
import sys
import os

# Add the current directory to the path so we can import the scraper
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.ecommerce_scraper import EnhancedEcommerceScraper

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_scraper_initialization():
    """Test that the scraper can be initialized without errors."""
    try:
        logger.info("Testing EnhancedEcommerceScraper initialization...")
        scraper = EnhancedEcommerceScraper()
        logger.info("✓ Scraper initialized successfully!")

        # Test the _get_random_headers method
        headers = scraper._get_random_headers()
        logger.info(f"✓ Headers generated successfully: User-Agent present = {'User-Agent' in headers}")

        # Check if ua is None (fallback mode) or UserAgent object
        if scraper.ua is None:
            logger.info("✓ Using fallback user agent mode")
        else:
            logger.info("✓ Using real UserAgent")

        return True

    except Exception as e:
        logger.error(f"✗ Scraper initialization failed: {e}")
        return False

if __name__ == "__main__":
    success = test_scraper_initialization()
    sys.exit(0 if success else 1)
