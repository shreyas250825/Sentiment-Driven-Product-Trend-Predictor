from fastapi import APIRouter, HTTPException, Depends, Request, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging
import json
import os
from datetime import datetime
from typing import List, Dict
from config import ADMIN_USER_IDS

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)
security = HTTPBearer()

# File path for storing user activity
USER_ACTIVITY_FILE = "user_activity.json"

def load_user_activity() -> List[Dict]:
    """Load user activity data from JSON file"""
    if os.path.exists(USER_ACTIVITY_FILE):
        try:
            with open(USER_ACTIVITY_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
    return []

def save_user_activity(data: List[Dict]):
    """Save user activity data to JSON file"""
    with open(USER_ACTIVITY_FILE, 'w') as f:
        json.dump(data, f, indent=2, default=str)

def log_user_activity(user_id: str, email: str, action: str, request: Request = None):
    """Log user activity"""
    try:
        activities = load_user_activity()

        activity = {
            'user_id': user_id,
            'email': email,
            'action': action,
            'timestamp': datetime.now().isoformat(),
            'ip_address': request.client.host if request and request.client else None,
            'user_agent': request.headers.get('user-agent') if request else None
        }

        activities.append(activity)
        save_user_activity(activities)

        logger.info(f"User activity logged: {email} - {action}")

    except Exception as e:
        logger.error(f"Failed to log user activity: {e}")

@router.get("/verify")
async def verify_user(request: Request, token: str = Depends(security)):
    try:
        decoded_token = auth.verify_id_token(token.credentials)
        user_record = auth.get_user(decoded_token['uid'])

        # Log user login activity
        log_user_activity(
            user_id=user_record.uid,
            email=user_record.email,
            action="login",
            request=request
        )

        return {
            "success": True,
            "user": {
                "uid": user_record.uid,
                "email": user_record.email,
                "email_verified": user_record.email_verified,
                "display_name": user_record.display_name,
                "photo_url": user_record.photo_url,
                "disabled": user_record.disabled
            }
        }
    except Exception as e:
        logger.warning(f"User verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid user token")

@router.post("/signup")
async def log_signup(request: Request):
    """Log user signup activity (called from frontend after Firebase signup)"""
    try:
        # This endpoint expects the frontend to send user data after successful Firebase signup
        # Since Firebase handles the actual signup, we just log the activity
        body = await request.json()
        user_id = body.get('user_id')
        email = body.get('email')

        if not user_id or not email:
            raise HTTPException(status_code=400, detail="Missing user_id or email")

        log_user_activity(
            user_id=user_id,
            email=email,
            action="signup",
            request=request
        )

        return {"success": True, "message": "Signup activity logged"}

    except Exception as e:
        logger.error(f"Failed to log signup: {e}")
        raise HTTPException(status_code=500, detail="Failed to log signup")

def is_admin_user(token: HTTPAuthorizationCredentials = Security(security)):
    try:
        decoded_token = auth.verify_id_token(token.credentials)
        if decoded_token['uid'] in ADMIN_USER_IDS:
            return True
        else:
            raise HTTPException(status_code=403, detail="Not authorized")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

@router.get("/activity")
async def get_user_activity(token: HTTPAuthorizationCredentials = Security(security)):
    """Get all user activity logs - admin only"""
    if not is_admin_user(token):
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        activities = load_user_activity()
        return {
            "success": True,
            "count": len(activities),
            "activities": activities
        }
    except Exception as e:
        logger.error(f"Error retrieving user activity: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user activity")

@router.get("/health")
async def auth_health():
    return {"status": "auth service healthy"}
