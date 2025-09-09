import random
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
import asyncio
from firebase_admin import firestore

# Lazy import db to avoid None during import time
def get_db():
    from main import db
    return db
def generate_mock_sales_data(product_name: str, days: int = 30) -> List[Dict]:
    """Generate realistic mock sales data"""
    # Create realistic sales pattern with some randomness
    base_value = random.randint(100, 500)
    trend = random.choice([-1, 0, 1])  # declining, stable, or growing
    
    data = []
    for i in range(days, 0, -1):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        
        # Base value with trend and random noise
        trend_effect = i * trend * random.uniform(0.5, 2.0)
        noise = random.randint(-20, 20)
        value = max(50, base_value + trend_effect + noise)
        
        data.append({'date': date, 'value': int(value)})
    
    return data
async def update_user_analytics(user_id: str):
    """Update user analytics in Firestore"""
    try:
        user_ref = get_db().collection('users').document(user_id)
        user_doc = user_ref.get()
        
        analytics = {
            'total_analyses': 1,
            'last_analysis': datetime.now().isoformat(),
            'premium_features_used': ['sentiment_analysis', 'trend_prediction']
        }
        
        if user_doc.exists:
            current_data = user_doc.to_dict() or {}
            current_analytics = current_data.get('analytics', {})
            analytics['total_analyses'] = current_analytics.get('total_analyses', 0) + 1
            analytics['premium_features_used'] = list(set(
                current_analytics.get('premium_features_used', []) + 
                ['sentiment_analysis', 'trend_prediction']
            ))
        
        user_ref.set({'analytics': analytics}, merge=True)
        
    except Exception as e:
        print(f"Failed to update user analytics: {e}")