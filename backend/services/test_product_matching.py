# test_product_matching.py
import asyncio
import json
from services.openrouter_service import OpenRouterService
from services.ecommerce_scraper import EnhancedEcommerceScraper

async def test_product_matching():
    """Test script to debug iPhone 14 vs iPhone 17 matching issues"""
    
    print("=== Testing Product Matching Logic ===\n")
    
    # Initialize services
    openrouter = OpenRouterService()
    
    # Test cases for product matching
    test_cases = [
        {
            "search_product": "iPhone 14",
            "test_texts": [
                "Just bought the iPhone 14 and it's amazing!",  # Should MATCH
                "iPhone 14 Pro is excellent",  # Should MATCH
                "My iPhone 17 is so much better",  # Should NOT MATCH
                "Comparing iPhone 14 vs iPhone 15",  # Should MATCH (mentions iPhone 14)
                "iPhone 13 and iPhone 14 comparison",  # Should MATCH
                "The new iPhone 17 features are incredible",  # Should NOT MATCH
                "Apple iPhone 14 review after 6 months",  # Should MATCH
                "Upgraded from iPhone 14 to iPhone 17",  # Should MATCH (mentions iPhone 14)
            ]
        },
        {
            "search_product": "Samsung Galaxy S24",
            "test_texts": [
                "Samsung Galaxy S24 is fantastic",  # Should MATCH
                "Galaxy S24 Ultra review",  # Should MATCH
                "My Galaxy S23 vs S24 comparison",  # Should MATCH
                "The Galaxy S25 will be better",  # Should NOT MATCH
                "Samsung Galaxy S24 Plus camera test",  # Should MATCH
            ]
        }
    ]
    
    print("Testing exact product matching logic...\n")
    
    for test_case in test_cases:
        search_product = test_case["search_product"]
        print(f"🔍 Testing search for: '{search_product}'")
        print("-" * 50)
        
        for text in test_case["test_texts"]:
            is_match = openrouter._is_exact_product_match(text, search_product)
            status = "✅ MATCH" if is_match else "❌ NO MATCH"
            print(f"{status}: {text}")
        
        print()

    # Test the filtering function with sample posts
    print("=== Testing Post Filtering ===\n")
    
    sample_posts = [
        {
            "text": "iPhone 14 is the best phone I've ever used!",
            "source": "reddit",
            "engagement_score": 8.5
        },
        {
            "text": "Waiting for iPhone 17 to release next year",
            "source": "twitter", 
            "engagement_score": 5.2
        },
        {
            "text": "My iPhone 14 Pro Max has amazing battery life",
            "source": "youtube",
            "engagement_score": 9.1
        },
        {
            "text": "iPhone 17 rumors suggest major camera upgrades",
            "source": "news",
            "engagement_score": 7.3
        },
        {
            "text": "Comparing iPhone 13, iPhone 14, and iPhone 15",
            "source": "blog",
            "engagement_score": 6.8
        }
    ]
    
    search_product = "iPhone 14"
    print(f"Filtering posts for: '{search_product}'")
    print(f"Original posts: {len(sample_posts)}")
    
    filtered_posts = openrouter._filter_posts(sample_posts, search_product)
    print(f"Filtered posts: {len(filtered_posts)}")
    
    print("\nFiltered results:")
    for post in filtered_posts:
        print(f"✅ {post['text'][:60]}... (source: {post['source']})")
    
    print("\nExcluded posts:")
    excluded = [post for post in sample_posts if post not in filtered_posts]
    for post in excluded:
        print(f"❌ {post['text'][:60]}... (source: {post['source']})")

async def test_ecommerce_scraper():
    """Test the enhanced e-commerce scraper"""
    print("\n=== Testing E-commerce Scraper ===\n")
    
    async with EnhancedEcommerceScraper() as scraper:
        # Test search query creation
        test_products = ["iPhone 14", "Samsung Galaxy S24", "MacBook Pro M3", "Sony WH-1000XM5"]
        
        print("Testing search query creation:")
        for product in test_products:
            query = scraper._create_precise_search_query(product)
            print(f"'{product}' → '{query}'")
        
        print("\nTesting product relevance matching:")
        test_matches = [
            ("iPhone 14", "Apple iPhone 14 128GB Blue"),  # Should match
            ("iPhone 14", "Apple iPhone 17 256GB Black"),  # Should NOT match
            ("iPhone 14", "iPhone 14 Pro Max 512GB"),  # Should match
            ("Samsung S24", "Samsung Galaxy S24 Ultra"),  # Should match
            ("Samsung S24", "Samsung Galaxy S23 FE"),  # Should NOT match
        ]
        
        for search_product, found_title in test_matches:
            is_relevant = scraper._is_relevant_product(found_title, search_product)
            status = "✅ RELEVANT" if is_relevant else "❌ NOT RELEVANT"
            print(f"{status}: '{search_product}' vs '{found_title}'")

async def test_full_pipeline():
    """Test the complete analysis pipeline"""
    print("\n=== Testing Full Analysis Pipeline ===\n")
    
    from product_analyzer import ProductAnalyzer
    
    analyzer = ProductAnalyzer()
    
    # Test with a specific product
    test_product = "iPhone 14"
    test_sources = ["amazon", "flipkart"]
    
    print(f"Running full analysis for: '{test_product}'")
    print(f"Sources: {test_sources}")
    
    try:
        result = await analyzer.analyze_product(test_product, test_sources)
        
        print(f"\n📊 Analysis Results:")
        print(f"Product: {result['product']}")
        print(f"Overall Sentiment: {result['sentiment']['overall_sentiment']}")
        print(f"Confidence: {result['sentiment']['confidence_score']:.2f}")
        print(f"Predicted Trend: {result['trend_prediction']['predicted_trend']}")
        print(f"Data Points: {result['data_quality']['total_data_points']}")
        print(f"Successful Sources: {result['data_quality']['successful_sources']}")
        
        # Check if any posts mention wrong models
        sample_posts = result['raw_data']['sample_posts']
        print(f"\nSample posts analysis:")
        for i, post in enumerate(sample_posts[:5]):
            text = post['text'][:100] + "..." if len(post['text']) > 100 else post['text']
            print(f"{i+1}. {text} (source: {post['source']})")
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")

if __name__ == "__main__":
    print("🧪 Product Matching Debug Test Suite")
    print("=" * 50)
    
    async def run_all_tests():
        await test_product_matching()
        await test_ecommerce_scraper() 
        await test_full_pipeline()
    
    asyncio.run(run_all_tests())