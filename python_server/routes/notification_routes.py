"""
Notification routes for StockVisionPro API
"""

from flask import request, jsonify
import logging

from . import notification_bp
from data.storage import MemStorage
from utils.auth_helper import auth_required

# Initialize logger and storage
logger = logging.getLogger(__name__)
storage = MemStorage()

@notification_bp.route("/<int:user_id>", methods=["GET"])
@auth_required()
def get_user_notifications(current_user_id, user_id):
    """Get a user's notifications"""
    try:
        # Verify authorization
        if current_user_id != user_id:
            return jsonify({"message": "Unauthorized to view these notifications"}), 403
        
        # Parse query parameters
        limit = request.args.get("limit", 50, type=int)
        offset = request.args.get("offset", 0, type=int)
        unread_only = request.args.get("unread", "false").lower() == "true"
        
        # Get notifications
        notifications = storage.get_user_notifications(
            user_id,
            limit=limit,
            offset=offset,
            unread_only=unread_only
        )
        
        # Enrich with related data where needed
        enriched_notifications = []
        for notification in notifications:
            notification_dict = notification.model_dump()
            
            # Add stock data if notification is related to a stock
            if notification.stockId:
                stock = storage.get_stock(notification.stockId)
                if stock:
                    notification_dict["stock"] = stock.model_dump()
            
            enriched_notifications.append(notification_dict)
        
        # Count unread notifications
        unread_count = storage.count_unread_notifications(user_id)
        
        return jsonify({
            "notifications": enriched_notifications,
            "unreadCount": unread_count,
            "totalCount": len(enriched_notifications)
        }), 200
    
    except Exception as e:
        logger.error(f"Error retrieving notifications for user {user_id}: {str(e)}")
        return jsonify({"message": f"Failed to retrieve notifications: {str(e)}"}), 500

@notification_bp.route("/<int:notification_id>/read", methods=["POST"])
@auth_required()
def mark_notification_as_read(current_user_id, notification_id):
    """Mark a notification as read"""
    try:
        # Get notification
        notification = storage.get_notification(notification_id)
        
        if not notification:
            return jsonify({"message": "Notification not found"}), 404
        
        # Verify authorization
        if notification.userId != current_user_id:
            return jsonify({"message": "Unauthorized to modify this notification"}), 403
        
        # Mark notification as read
        updated_notification = storage.mark_notification_as_read(notification_id)
        
        return jsonify(updated_notification.model_dump()), 200
    
    except Exception as e:
        logger.error(f"Error marking notification {notification_id} as read: {str(e)}")
        return jsonify({"message": f"Failed to mark notification as read: {str(e)}"}), 500

@notification_bp.route("/<int:user_id>/read-all", methods=["POST"])
@auth_required()
def mark_all_notifications_as_read(current_user_id, user_id):
    """Mark all notifications as read for a user"""
    try:
        # Verify authorization
        if current_user_id != user_id:
            return jsonify({"message": "Unauthorized to modify these notifications"}), 403
        
        # Mark all notifications as read
        count = storage.mark_all_notifications_as_read(user_id)
        
        return jsonify({
            "message": f"Marked {count} notifications as read",
            "count": count
        }), 200
    
    except Exception as e:
        logger.error(f"Error marking all notifications as read for user {user_id}: {str(e)}")
        return jsonify({"message": f"Failed to mark notifications as read: {str(e)}"}), 500

@notification_bp.route("/<int:notification_id>", methods=["DELETE"])
@auth_required()
def delete_notification(current_user_id, notification_id):
    """Delete a notification"""
    try:
        # Get notification
        notification = storage.get_notification(notification_id)
        
        if not notification:
            return jsonify({"message": "Notification not found"}), 404
        
        # Verify authorization
        if notification.userId != current_user_id:
            return jsonify({"message": "Unauthorized to delete this notification"}), 403
        
        # Delete notification
        success = storage.delete_notification(notification_id)
        
        if not success:
            return jsonify({"message": "Failed to delete notification"}), 500
        
        return jsonify({"message": "Notification deleted successfully"}), 200
    
    except Exception as e:
        logger.error(f"Error deleting notification {notification_id}: {str(e)}")
        return jsonify({"message": f"Failed to delete notification: {str(e)}"}), 500

@notification_bp.route("/<int:user_id>/clear", methods=["DELETE"])
@auth_required()
def clear_all_notifications(current_user_id, user_id):
    """Clear all notifications for a user"""
    try:
        # Verify authorization
        if current_user_id != user_id:
            return jsonify({"message": "Unauthorized to delete these notifications"}), 403
        
        # Delete all notifications
        count = storage.clear_user_notifications(user_id)
        
        return jsonify({
            "message": f"Cleared {count} notifications",
            "count": count
        }), 200
    
    except Exception as e:
        logger.error(f"Error clearing notifications for user {user_id}: {str(e)}")
        return jsonify({"message": f"Failed to clear notifications: {str(e)}"}), 500

@notification_bp.route("/settings/<int:user_id>", methods=["GET"])
@auth_required()
def get_notification_settings(current_user_id, user_id):
    """Get a user's notification settings"""
    try:
        # Verify authorization
        if current_user_id != user_id:
            return jsonify({"message": "Unauthorized to view these settings"}), 403
        
        # Get notification settings
        settings = storage.get_notification_settings(user_id)
        
        if not settings:
            # Return default settings if none exist
            settings = {
                "userId": user_id,
                "emailEnabled": True,
                "pushEnabled": True,
                "priceAlerts": True,
                "tradingSignals": True,
                "newsAlerts": True,
                "portfolioUpdates": True
            }
        
        return jsonify(settings), 200
    
    except Exception as e:
        logger.error(f"Error retrieving notification settings for user {user_id}: {str(e)}")
        return jsonify({"message": f"Failed to retrieve notification settings: {str(e)}"}), 500

@notification_bp.route("/settings/<int:user_id>", methods=["PUT"])
@auth_required()
def update_notification_settings(current_user_id, user_id):
    """Update a user's notification settings"""
    try:
        # Verify authorization
        if current_user_id != user_id:
            return jsonify({"message": "Unauthorized to modify these settings"}), 403
        
        data = request.get_json()
        
        # Update notification settings
        settings = storage.update_notification_settings(user_id, data)
        
        return jsonify(settings), 200
    
    except Exception as e:
        logger.error(f"Error updating notification settings for user {user_id}: {str(e)}")
        return jsonify({"message": f"Failed to update notification settings: {str(e)}"}), 500