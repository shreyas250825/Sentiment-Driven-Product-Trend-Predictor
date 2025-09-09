from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from typing import List, Dict
import logging
from firebase_admin import firestore

import dependencies

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profile", tags=["profile"])

# Lazy import db to avoid None during import time
def get_db():
    from main import db
    return db

@router.get("/")
async def get_user_profile(user: dict = Depends(dependencies.verify_token)):
    """Get user profile data including stats, recent activity, and achievements"""
    try:
        user_id = user['uid']
        db = get_db()

        # Get user analytics
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()

        analytics = {}
        if user_doc.exists:
            user_data = user_doc.to_dict()
            analytics = user_data.get('analytics', {})

        # Get recent analyses
        analyses_ref = db.collection('users').document(user_id).collection('analyses')
        recent_analyses = analyses_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(5).stream()

        recent_activity = []
        total_analyses = 0
        products_tracked = set()
        reports_generated = 0

        for doc in recent_analyses:
            data = doc.to_dict()
            total_analyses += 1
            products_tracked.add(data.get('product', 'Unknown'))
            reports_generated += 1

            # Format recent activity
            recent_activity.append({
                'action': f"Analyzed sentiment for '{data.get('product', 'Unknown Product')}'",
                'time': format_time_ago(data.get('timestamp')),
                'accuracy': f"{data.get('overall_sentiment', {}).get('confidence', 85)}%"
            })

        # Calculate stats
        stats = {
            'analyses': analytics.get('total_analyses', total_analyses),
            'products': len(products_tracked),
            'reports': analytics.get('total_analyses', reports_generated),
            'accuracy': calculate_average_accuracy(user_id)
        }

        # Generate achievements based on real data
        achievements = generate_achievements(stats, analytics)

        # Mock usage data (could be enhanced with real usage tracking)
        usage_data = {
            'api_calls': min(1000, stats['analyses'] * 10 + 247),
            'storage_used': min(10.0, stats['analyses'] * 0.1 + 1.2)
        }

        profile_data = {
            'user': {
                'email': user.get('email', ''),
                'name': user.get('display_name', user.get('email', '').split('@')[0] if user.get('email') else 'User'),
                'join_date': format_join_date(user.get('metadata', {}).get('creationTime')),
                'plan': 'Premium',  # Could be dynamic based on user data
                'status': 'Active'
            },
            'stats': stats,
            'achievements': achievements,
            'recent_activity': recent_activity,
            'usage': usage_data
        }

        return {"success": True, "data": profile_data}

    except Exception as e:
        logger.error(f"Failed to get user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

def format_time_ago(timestamp):
    """Format timestamp to relative time"""
    if not timestamp:
        return "Recently"

    if isinstance(timestamp, str):
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except:
            return "Recently"
    else:
        dt = timestamp

    now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()
    diff = now - dt

    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds >= 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds >= 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "Just now"

def format_join_date(creation_time):
    """Format Firebase creation time to readable date"""
    if not creation_time:
        return "October 2023"  # fallback

    try:
        # Firebase timestamp format: "2023-10-15T10:30:00Z"
        dt = datetime.fromisoformat(creation_time.replace('Z', '+00:00'))
        return dt.strftime("%B %Y")
    except:
        return "October 2023"

def calculate_average_accuracy(user_id):
    """Calculate average accuracy from user's analyses"""
    try:
        db = get_db()
        analyses_ref = db.collection('users').document(user_id).collection('analyses')
        analyses = analyses_ref.stream()

        accuracies = []
        for doc in analyses:
            data = doc.to_dict()
            confidence = data.get('overall_sentiment', {}).get('confidence')
            if confidence:
                accuracies.append(confidence)

        if accuracies:
            return round(sum(accuracies) / len(accuracies))
        return 84  # default
    except:
        return 84

def generate_achievements(stats, analytics):
    """Generate achievements based on real user data"""
    achievements = []

    # Trend Predictor
    if stats['analyses'] >= 10:
        achievements.append({
            'title': 'Trend Predictor',
            'description': f'Made {stats["analyses"]}+ accurate predictions',
            'icon': 'TrendingUp',
            'color': 'from-emerald-500 to-teal-600',
            'earned': True
        })
    else:
        achievements.append({
            'title': 'Trend Predictor',
            'description': 'Make 10+ accurate predictions',
            'icon': 'TrendingUp',
            'color': 'from-emerald-500 to-teal-600',
            'earned': False
        })

    # Data Analyst
    if stats['analyses'] >= 50:
        achievements.append({
            'title': 'Data Analyst',
            'description': f'Performed {stats["analyses"]}+ analyses',
            'icon': 'BarChart3',
            'color': 'from-blue-500 to-indigo-600',
            'earned': True
        })
    else:
        achievements.append({
            'title': 'Data Analyst',
            'description': 'Perform 50+ analyses',
            'icon': 'BarChart3',
            'color': 'from-blue-500 to-indigo-600',
            'earned': False
        })

    # Accuracy Expert
    avg_accuracy = stats.get('accuracy', 84)
    if avg_accuracy >= 90:
        achievements.append({
            'title': 'Accuracy Expert',
            'description': f'Achieved {avg_accuracy}%+ accuracy rate',
            'icon': 'Target',
            'color': 'from-purple-500 to-violet-600',
            'earned': True
        })
    else:
        achievements.append({
            'title': 'Accuracy Expert',
            'description': 'Achieve 90%+ accuracy rate',
            'icon': 'Target',
            'color': 'from-purple-500 to-violet-600',
            'earned': False
        })

    # Premium User
    premium_features = analytics.get('premium_features_used', [])
    if len(premium_features) > 0:
        achievements.append({
            'title': 'Premium User',
            'description': f'Used {len(premium_features)}+ premium features',
            'icon': 'Crown',
            'color': 'from-amber-500 to-orange-600',
            'earned': True
        })
    else:
        achievements.append({
            'title': 'Premium User',
            'description': 'Use premium features',
            'icon': 'Crown',
            'color': 'from-amber-500 to-orange-600',
            'earned': False
        })

    return achievements
