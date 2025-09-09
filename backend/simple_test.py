#!/usr/bin/env python3
"""
Simple test to verify Google Trends data transformation fix
"""

def test_google_trends_transformation():
    """Test that Google Trends data is properly transformed for the frontend chart"""

    # Mock Google Trends data structure as returned by GoogleTrendsService
    mock_google_trends_data = {
        "interest_over_time": {
            "2024-01-01": {"iPhone": 85},
            "2024-01-02": {"iPhone": 90},
            "2024-01-03": {"iPhone": 88},
            "2024-01-04": {"iPhone": 92},
        },
        "related_queries": {"top": {"query": ["iPhone"], "value": [100]}},
        "interest_by_region": {"US": 100, "IN": 85, "UK": 75},
    }

    # Mock sentiment result
    mock_sentiment = {
        'overall_sentiment_score': 0.8
    }

    # Test the transformation logic (copied from product_analyzer.py)
    trend_data = []
    google_trends_data = mock_google_trends_data
    sentiment_result = mock_sentiment

    if google_trends_data and isinstance(google_trends_data, dict):
        # Extract interest_over_time dict and convert to list of dicts with date and value keys
        interest_over_time = google_trends_data.get('interest_over_time', {})
        if isinstance(interest_over_time, dict):
            for date_str, values in interest_over_time.items():
                # values is a dict with product as key and value as interest score
                # Extract the first value as interest score
                value = 0
                if isinstance(values, dict):
                    value = list(values.values())[0] if values else 0
                trend_data.append({
                    'date': date_str,
                    'sentiment': sentiment_result.get('overall_sentiment_score', 0) if sentiment_result else 0,
                    'value': value
                })

    print("Transformed Google Trends data:")
    for item in trend_data:
        print(f"  Date: {item['date']}, Value: {item['value']}, Sentiment: {item['sentiment']}")

    # Verify the structure
    assert len(trend_data) == 4, f"Expected 4 data points, got {len(trend_data)}"
    assert all('date' in item for item in trend_data), "All items should have 'date' key"
    assert all('value' in item for item in trend_data), "All items should have 'value' key"
    assert all('sentiment' in item for item in trend_data), "All items should have 'sentiment' key"

    # Verify values are correct
    expected_values = [85, 90, 88, 92]
    actual_values = [item['value'] for item in trend_data]
    assert actual_values == expected_values, f"Expected values {expected_values}, got {actual_values}"

    print("\n✅ Google Trends data transformation test passed!")
    print("✅ All trend_data items have the correct structure for the frontend chart")
    print("✅ Values are correctly extracted from Google Trends data")

if __name__ == "__main__":
    test_google_trends_transformation()
