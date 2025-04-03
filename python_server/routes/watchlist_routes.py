"""
Watchlist routes for StockVisionPro API
"""

import logging
from flask import Flask, request, jsonify
from typing import Any, Dict, List, Optional

from python_server.data.storage import MemStorage
from python_server.utils.auth_helper import jwt_required_with_storage

# Configure logger
logger = logging.getLogger(__name__)

def register_watchlist_routes(app: Flask, storage: MemStorage) -> None:
    """Register all watchlist related routes"""
    
    @app.route("/api/watchlist/<user_id>", methods=["GET"])
    @jwt_required_with_storage(storage)
    def get_user_watchlist(user_id):
        """Get a user's watchlist"""
        try:
            # Verify the JWT token matches the requested user_id
            # This is already done in the jwt_required_with_storage decorator
            
            # Get watchlist from storage
            watchlist_items = storage.get_user_watchlist(user_id)
            
            # Convert to dict for response and include stock information
            watchlist_data = []
            
            for item in watchlist_items:
                stock = storage.get_stock(item.stockId)
                
                # Skip if stock doesn't exist (shouldn't happen but just in case)
                if not stock:
                    continue
                
                watchlist_data.append({
                    "id": item.id,
                    "userId": item.userId,
                    "stockId": item.stockId,
                    "alertPrice": item.alertPrice,
                    "alertCondition": item.alertCondition,
                    "notes": item.notes,
                    "createdAt": item.createdAt.isoformat(),
                    "stock": {
                        "symbol": stock.symbol,
                        "name": stock.name,
                        "currentPrice": stock.currentPrice,
                        "dailyChange": stock.dailyChange,
                        "dailyChangePercent": stock.dailyChangePercent,
                        "exchange": stock.exchange,
                        "sector": stock.sector
                    }
                })
            
            return jsonify({
                "watchlist": watchlist_data,
                "count": len(watchlist_data)
            }), 200
            
        except Exception as e:
            logger.error(f"Error in get_user_watchlist: {str(e)}")
            return jsonify({"error": "Failed to get watchlist", "details": str(e)}), 500
    
    @app.route("/api/watchlist", methods=["POST"])
    @jwt_required_with_storage(storage)
    def add_to_watchlist():
        """Add a stock to a user's watchlist"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ["userId", "stockId"]
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Check if stock exists
            stock = storage.get_stock(data["stockId"])
            if not stock:
                return jsonify({"error": "Stock not found"}), 404
            
            # Check if already in watchlist
            if storage.is_stock_in_watchlist(data["userId"], data["stockId"]):
                return jsonify({"error": "Stock already in watchlist"}), 409
            
            # Process alert price if provided
            if "alertPrice" in data and data["alertPrice"] is not None:
                try:
                    data["alertPrice"] = float(data["alertPrice"])
                except ValueError:
                    return jsonify({"error": "Invalid alert price"}), 400
            
            # Add to watchlist
            watchlist_item = storage.add_to_watchlist(data)
            
            # Prepare response
            response_data = {
                "id": watchlist_item.id,
                "userId": watchlist_item.userId,
                "stockId": watchlist_item.stockId,
                "alertPrice": watchlist_item.alertPrice,
                "alertCondition": watchlist_item.alertCondition,
                "notes": watchlist_item.notes,
                "createdAt": watchlist_item.createdAt.isoformat(),
                "stock": {
                    "symbol": stock.symbol,
                    "name": stock.name,
                    "currentPrice": stock.currentPrice,
                    "dailyChangePercent": stock.dailyChangePercent
                }
            }
            
            return jsonify({
                "message": "Stock added to watchlist",
                "watchlistItem": response_data
            }), 201
            
        except Exception as e:
            logger.error(f"Error in add_to_watchlist: {str(e)}")
            return jsonify({"error": "Failed to add to watchlist", "details": str(e)}), 500
    
    @app.route("/api/watchlist/<user_id>/<stock_id>", methods=["PUT"])
    @jwt_required_with_storage(storage)
    def update_watchlist_item(user_id, stock_id):
        """Update a watchlist item"""
        try:
            data = request.get_json()
            
            # Process alert price
            if "alertPrice" not in data or data["alertPrice"] is None:
                return jsonify({"error": "Alert price is required"}), 400
            
            try:
                alert_price = float(data["alertPrice"])
            except ValueError:
                return jsonify({"error": "Invalid alert price"}), 400
            
            # Process alert condition
            alert_condition = data.get("alertCondition")
            
            # Update watchlist item
            updated_item = storage.update_watchlist_item(
                user_id, 
                stock_id, 
                alert_price, 
                alert_condition
            )
            
            if not updated_item:
                return jsonify({"error": "Watchlist item not found"}), 404
            
            # Get stock for response
            stock = storage.get_stock(stock_id)
            
            # Prepare response
            response_data = {
                "id": updated_item.id,
                "userId": updated_item.userId,
                "stockId": updated_item.stockId,
                "alertPrice": updated_item.alertPrice,
                "alertCondition": updated_item.alertCondition,
                "notes": updated_item.notes,
                "updatedAt": updated_item.updatedAt.isoformat() if updated_item.updatedAt else None,
                "stock": {
                    "symbol": stock.symbol,
                    "name": stock.name,
                    "currentPrice": stock.currentPrice,
                    "dailyChangePercent": stock.dailyChangePercent
                } if stock else None
            }
            
            return jsonify({
                "message": "Watchlist item updated",
                "watchlistItem": response_data
            }), 200
            
        except Exception as e:
            logger.error(f"Error in update_watchlist_item: {str(e)}")
            return jsonify({"error": "Failed to update watchlist item", "details": str(e)}), 500
    
    @app.route("/api/watchlist/<user_id>/<stock_id>", methods=["DELETE"])
    @jwt_required_with_storage(storage)
    def remove_from_watchlist(user_id, stock_id):
        """Remove a stock from a user's watchlist"""
        try:
            # Check if item exists
            if not storage.is_stock_in_watchlist(user_id, stock_id):
                return jsonify({"error": "Stock not in watchlist"}), 404
            
            # Remove from watchlist
            success = storage.remove_from_watchlist(user_id, stock_id)
            
            if not success:
                return jsonify({"error": "Failed to remove from watchlist"}), 500
            
            return jsonify({
                "message": "Stock removed from watchlist",
                "userId": user_id,
                "stockId": stock_id
            }), 200
            
        except Exception as e:
            logger.error(f"Error in remove_from_watchlist: {str(e)}")
            return jsonify({"error": "Failed to remove from watchlist", "details": str(e)}), 500