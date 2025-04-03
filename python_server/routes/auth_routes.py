"""
Authentication routes for StockVisionPro API
"""

import logging
import uuid
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Response
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity
)
from typing import Dict, Any, Optional, Tuple

from python_server.models.schemas import User, LoginRequest, RegisterRequest
from python_server.data.storage import MemStorage
from python_server.utils.auth_helper import hash_password, check_password, generate_id

# Configure logger
logger = logging.getLogger(__name__)


def register_auth_routes(app: Flask, storage: MemStorage) -> None:
    """Register authentication routes"""
    
    @app.route("/api/auth/register", methods=["POST"])
    def register():
        """Register a new user"""
        try:
            # Parse request data
            data = request.get_json()
            
            # Validate required fields
            required_fields = ["username", "email", "password", "fullName"]
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Check if username already exists
            existing_user = storage.get_user_by_username(data["username"])
            if existing_user:
                return jsonify({"error": "Username already exists"}), 409
            
            # Check if email already exists
            existing_email = storage.get_user_by_email(data["email"])
            if existing_email:
                return jsonify({"error": "Email already in use"}), 409
            
            # Hash the password
            hashed_password = hash_password(data["password"])
            
            # Create user data
            user_data = {
                "id": generate_id(),
                "username": data["username"],
                "email": data["email"],
                "password": hashed_password,
                "fullName": data["fullName"],
                "accountBalance": 10000.0,  # Default starting balance
                "isActive": True,
                "preferences": {},
                "createdAt": datetime.now()
            }
            
            # Create the user
            user = storage.create_user(user_data)
            
            # Create JWT tokens
            access_token = create_access_token(identity=user.id)
            refresh_token = create_refresh_token(identity=user.id)
            
            # Return response without password
            user_dict = user.model_dump()
            user_dict.pop("password", None)
            
            return jsonify({
                "message": "User registered successfully",
                "user": user_dict,
                "tokens": {
                    "access": access_token,
                    "refresh": refresh_token
                }
            }), 201
            
        except ValueError as e:
            return jsonify({"error": "Invalid input", "details": str(e)}), 400
            
        except Exception as e:
            logger.error(f"Error in register: {str(e)}")
            return jsonify({"error": "Registration failed", "details": str(e)}), 500
    
    @app.route("/api/auth/login", methods=["POST"])
    def login():
        """Authenticate a user and return JWT tokens"""
        try:
            # Parse request data
            data = request.get_json()
            
            # Validate required fields
            required_fields = ["username", "password"]
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Get user by username
            user = storage.get_user_by_username(data["username"])
            
            # Check if user exists
            if not user:
                return jsonify({"error": "Invalid credentials"}), 401
            
            # Check if password is correct
            if not check_password(data["password"], user.password):
                return jsonify({"error": "Invalid credentials"}), 401
            
            # Update last login time
            storage.update_last_login(user.id)
            
            # Create JWT tokens
            access_token = create_access_token(identity=user.id)
            refresh_token = create_refresh_token(identity=user.id)
            
            # Return response without password
            user_dict = user.model_dump()
            user_dict.pop("password", None)
            
            return jsonify({
                "message": "Login successful",
                "user": user_dict,
                "tokens": {
                    "access": access_token,
                    "refresh": refresh_token
                }
            }), 200
            
        except Exception as e:
            logger.error(f"Error in login: {str(e)}")
            return jsonify({"error": "Login failed", "details": str(e)}), 500
    
    @app.route("/api/auth/refresh", methods=["POST"])
    @jwt_required(refresh=True)
    def refresh_token():
        """Refresh an access token using a refresh token"""
        try:
            # Get user ID from JWT
            user_id = get_jwt_identity()
            
            # Verify user exists
            user = storage.get_user(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Create a new access token
            access_token = create_access_token(identity=user_id)
            
            return jsonify({
                "message": "Token refreshed",
                "token": access_token
            }), 200
            
        except Exception as e:
            logger.error(f"Error in refresh_token: {str(e)}")
            return jsonify({"error": "Token refresh failed", "details": str(e)}), 500
    
    @app.route("/api/auth/me", methods=["GET"])
    @jwt_required()
    def get_current_user():
        """Get the currently authenticated user"""
        try:
            # Get user ID from JWT
            user_id = get_jwt_identity()
            
            # Verify user exists
            user = storage.get_user(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Return user data without password
            user_dict = user.model_dump()
            user_dict.pop("password", None)
            
            return jsonify({
                "user": user_dict
            }), 200
            
        except Exception as e:
            logger.error(f"Error in get_current_user: {str(e)}")
            return jsonify({"error": "Failed to get user", "details": str(e)}), 500
    
    @app.route("/api/auth/update-profile", methods=["PUT"])
    @jwt_required()
    def update_profile():
        """Update user profile information"""
        try:
            # Get user ID from JWT
            user_id = get_jwt_identity()
            
            # Verify user exists
            user = storage.get_user(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Parse request data
            data = request.get_json()
            
            # Prevent updating sensitive fields
            for restricted_field in ["id", "username", "password", "accountBalance", "isActive"]:
                if restricted_field in data:
                    data.pop(restricted_field)
            
            # If email is being updated, check if it's already in use
            if "email" in data and data["email"] != user.email:
                existing_email = storage.get_user_by_email(data["email"])
                if existing_email:
                    return jsonify({"error": "Email already in use"}), 409
            
            # Add update timestamp
            data["updatedAt"] = datetime.now()
            
            # Update user
            updated_user = storage.update_user(user_id, data)
            
            # Return updated user without password
            user_dict = updated_user.model_dump()
            user_dict.pop("password", None)
            
            return jsonify({
                "message": "Profile updated successfully",
                "user": user_dict
            }), 200
            
        except Exception as e:
            logger.error(f"Error in update_profile: {str(e)}")
            return jsonify({"error": "Failed to update profile", "details": str(e)}), 500
    
    @app.route("/api/auth/change-password", methods=["PUT"])
    @jwt_required()
    def change_password():
        """Change user password"""
        try:
            # Get user ID from JWT
            user_id = get_jwt_identity()
            
            # Verify user exists
            user = storage.get_user(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Parse request data
            data = request.get_json()
            
            # Validate required fields
            required_fields = ["currentPassword", "newPassword"]
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Check if current password is correct
            if not check_password(data["currentPassword"], user.password):
                return jsonify({"error": "Current password is incorrect"}), 401
            
            # Hash the new password
            hashed_password = hash_password(data["newPassword"])
            
            # Update user password
            storage.update_user(user_id, {
                "password": hashed_password,
                "updatedAt": datetime.now()
            })
            
            return jsonify({
                "message": "Password changed successfully"
            }), 200
            
        except Exception as e:
            logger.error(f"Error in change_password: {str(e)}")
            return jsonify({"error": "Failed to change password", "details": str(e)}), 500