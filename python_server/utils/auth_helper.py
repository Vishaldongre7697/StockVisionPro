"""
Authentication helper utilities for StockVisionPro API
"""

import logging
import uuid
from datetime import datetime, timedelta
import bcrypt
from functools import wraps
from typing import Dict, Any, Callable, Optional

from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, jsonify, Response, Request

from python_server.data.storage import MemStorage

# Configure logger
logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    # Generate a salt
    salt = bcrypt.gensalt()
    
    # Hash the password with the salt
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    # Return the hashed password as a string
    return hashed.decode('utf-8')


def check_password(password: str, hashed_password: str) -> bool:
    """Check if a password matches a hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


def generate_id() -> str:
    """Generate a unique ID"""
    return str(uuid.uuid4())


def extract_pagination_params(args: Dict[str, Any]) -> Dict[str, int]:
    """Extract pagination parameters from request arguments"""
    # Default values
    limit = 100
    offset = 0
    
    # Extract from args if provided
    if "limit" in args:
        try:
            limit = int(args["limit"])
            # Constrain limit to reasonable range
            limit = min(limit, 1000)  # Max 1000 items per page
            limit = max(limit, 1)     # Min 1 item per page
        except (ValueError, TypeError):
            # If conversion fails, use default
            pass
    
    if "offset" in args:
        try:
            offset = int(args["offset"])
            # Ensure non-negative offset
            offset = max(offset, 0)
        except (ValueError, TypeError):
            # If conversion fails, use default
            pass
    
    return {
        "limit": limit,
        "offset": offset
    }


def jwt_required_with_storage(storage: MemStorage):
    """JWT required decorator that also validates user exists in storage"""
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            # Get the user ID from the JWT
            jwt_user_id = get_jwt_identity()
            
            # Check if a user_id is in the URL parameters
            url_user_id = kwargs.get('user_id')
            
            # If a user_id is in the URL, verify it matches the JWT
            if url_user_id and url_user_id != jwt_user_id:
                return jsonify({"error": "Unauthorized access to this resource"}), 403
            
            # Verify the user exists in storage
            user = storage.get_user(jwt_user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # User is valid, proceed to the protected route
            return fn(*args, **kwargs)
        
        return wrapper
    
    return decorator