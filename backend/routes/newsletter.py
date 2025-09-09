from fastapi import APIRouter, HTTPException, Request, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime
import logging
import json
import os
from typing import List, Dict
from firebase_admin import auth
from config import ADMIN_USER_IDS

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

def is_admin_user(token: HTTPAuthorizationCredentials = Security(security)):
    try:
        decoded_token = auth.verify_id_token(token.credentials)
        if decoded_token['uid'] in ADMIN_USER_IDS:
            return True
        else:
            raise HTTPException(status_code=403, detail="Not authorized")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

class SubscriptionRequest(BaseModel):
    email: EmailStr

# File paths for storing data
NEWSLETTER_FILE = "newsletter_subscriptions.json"
USER_ACTIVITY_FILE = "user_activity.json"

def load_json_file(filename: str) -> List[Dict]:
    """Load data from JSON file"""
    if os.path.exists(filename):
        try:
            with open(filename, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
    return []

def save_json_file(filename: str, data: List[Dict]):
    """Save data to JSON file"""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2, default=str)

@router.post("/subscribe")
async def subscribe_newsletter(subscription: SubscriptionRequest, request: Request):
    """
    Subscribe to newsletter with email
    """
    try:
        # Load existing subscriptions
        subscriptions = load_json_file(NEWSLETTER_FILE)

        # Check if email already exists
        for sub in subscriptions:
            if sub['email'] == subscription.email:
                raise HTTPException(status_code=400, detail="Email already subscribed")

        # Add new subscription
        new_subscription = {
            'email': subscription.email,
            'subscribed_at': datetime.now().isoformat(),
            'ip_address': request.client.host if request.client else None,
            'user_agent': request.headers.get('user-agent'),
            'active': True
        }

        subscriptions.append(new_subscription)
        save_json_file(NEWSLETTER_FILE, subscriptions)

        logger.info(f"New newsletter subscription: {subscription.email}")

        return {
            "success": True,
            "message": "Successfully subscribed to newsletter!",
            "email": subscription.email
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Newsletter subscription error: {e}")
        raise HTTPException(status_code=500, detail="Failed to subscribe to newsletter")

@router.get("/subscriptions")
async def get_subscriptions(token: HTTPAuthorizationCredentials = Security(security)):
    """
    Get all newsletter subscriptions - admin only
    """
    if not is_admin_user(token):
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        subscriptions = load_json_file(NEWSLETTER_FILE)
        return {
            "success": True,
            "count": len(subscriptions),
            "subscriptions": subscriptions
        }
    except Exception as e:
        logger.error(f"Error retrieving subscriptions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve subscriptions")
