"""
AI routes for StockVisionPro API
"""

import logging
from flask import Flask, request, jsonify
from typing import Any, Dict, List

from python_server.data.storage import MemStorage
from python_server.utils.auth_helper import extract_pagination_params, jwt_required_with_storage

# Configure logger
logger = logging.getLogger(__name__)

def register_ai_routes(app: Flask, storage: MemStorage) -> None:
    """Register all AI related routes"""
    
    @app.route("/api/ai-suggestions", methods=["GET"])
    def get_ai_suggestions():
        """Get all AI suggestions with optional filtering"""
        try:
            # Extract pagination params
            pagination = extract_pagination_params(request.args)
            
            # Extract filter parameters
            suggestion_type = request.args.get('type')
            sentiment = request.args.get('sentiment')
            
            # Get suggestions from storage
            suggestions = storage.get_all_ai_suggestions(
                limit=pagination['limit'],
                offset=pagination['offset'],
                suggestion_type=suggestion_type,
                sentiment=sentiment
            )
            
            # Convert to dict for response
            suggestion_list = [
                {
                    "id": suggestion.id,
                    "stockId": suggestion.stockId,
                    "type": suggestion.type,
                    "confidence": suggestion.confidence,
                    "sentiment": suggestion.sentiment,
                    "priceTarget": suggestion.priceTarget,
                    "timeFrame": suggestion.timeFrame,
                    "analysis": suggestion.analysis,
                    "createdAt": suggestion.createdAt.isoformat()
                }
                for suggestion in suggestions
            ]
            
            # Add stock information
            for suggestion in suggestion_list:
                stock = storage.get_stock(suggestion["stockId"])
                if stock:
                    suggestion["stock"] = {
                        "symbol": stock.symbol,
                        "name": stock.name,
                        "currentPrice": stock.currentPrice,
                        "dailyChangePercent": stock.dailyChangePercent
                    }
            
            return jsonify({
                "suggestions": suggestion_list,
                "count": len(suggestion_list)
            }), 200
            
        except Exception as e:
            logger.error(f"Error in get_ai_suggestions: {str(e)}")
            return jsonify({"error": "Failed to get AI suggestions", "details": str(e)}), 500
    
    @app.route("/api/ai-suggestions/top", methods=["GET"])
    def get_top_ai_suggestions():
        """Get top AI suggestions based on confidence score"""
        try:
            # Extract query parameters
            limit = int(request.args.get('limit', 5))
            suggestion_type = request.args.get('type')
            
            # Validate limit
            limit = min(limit, 20)  # Cap at 20 to prevent excessive response size
            limit = max(limit, 1)   # Ensure at least 1 result
            
            # Get top suggestions
            suggestions = storage.get_top_ai_suggestions(
                limit=limit,
                suggestion_type=suggestion_type
            )
            
            # Convert to dict for response
            suggestion_list = [
                {
                    "id": suggestion.id,
                    "stockId": suggestion.stockId,
                    "type": suggestion.type,
                    "confidence": suggestion.confidence,
                    "sentiment": suggestion.sentiment,
                    "priceTarget": suggestion.priceTarget,
                    "timeFrame": suggestion.timeFrame,
                    "createdAt": suggestion.createdAt.isoformat()
                }
                for suggestion in suggestions
            ]
            
            # Add stock information
            for suggestion in suggestion_list:
                stock = storage.get_stock(suggestion["stockId"])
                if stock:
                    suggestion["stock"] = {
                        "symbol": stock.symbol,
                        "name": stock.name,
                        "currentPrice": stock.currentPrice,
                        "dailyChangePercent": stock.dailyChangePercent
                    }
            
            return jsonify({
                "suggestions": suggestion_list,
                "count": len(suggestion_list)
            }), 200
            
        except ValueError as e:
            return jsonify({"error": "Invalid parameter", "details": str(e)}), 400
            
        except Exception as e:
            logger.error(f"Error in get_top_ai_suggestions: {str(e)}")
            return jsonify({"error": "Failed to get top AI suggestions", "details": str(e)}), 500
    
    @app.route("/api/ai-suggestions/stock/<stock_id>", methods=["GET"])
    def get_stock_ai_suggestion(stock_id):
        """Get AI suggestion for a specific stock"""
        try:
            # Check if stock exists
            stock = storage.get_stock(stock_id)
            
            if not stock:
                return jsonify({"error": "Stock not found"}), 404
            
            # Get AI suggestion
            suggestion = storage.get_stock_ai_suggestion(stock_id)
            
            if not suggestion:
                return jsonify({"error": "No AI suggestion available for this stock"}), 404
            
            # Convert to dict for response
            suggestion_data = {
                "id": suggestion.id,
                "stockId": suggestion.stockId,
                "type": suggestion.type,
                "confidence": suggestion.confidence,
                "sentiment": suggestion.sentiment,
                "priceTarget": suggestion.priceTarget,
                "timeFrame": suggestion.timeFrame,
                "analysis": suggestion.analysis,
                "createdAt": suggestion.createdAt.isoformat(),
                "stock": {
                    "symbol": stock.symbol,
                    "name": stock.name,
                    "currentPrice": stock.currentPrice,
                    "dailyChangePercent": stock.dailyChangePercent
                }
            }
            
            return jsonify({"suggestion": suggestion_data}), 200
            
        except Exception as e:
            logger.error(f"Error in get_stock_ai_suggestion: {str(e)}")
            return jsonify({"error": "Failed to get AI suggestion", "details": str(e)}), 500
    
    @app.route("/api/ai-suggestions/by-type/<type>", methods=["GET"])
    def get_suggestions_by_type(type):
        """Get AI suggestions by type"""
        try:
            # Validate type
            valid_types = ["BUY", "SELL", "HOLD"]
            if type.upper() not in valid_types:
                return jsonify({"error": f"Invalid type. Must be one of: {', '.join(valid_types)}"}), 400
            
            # Extract limit parameter
            limit = int(request.args.get('limit', 10))
            limit = min(limit, 50)  # Cap at 50
            limit = max(limit, 1)   # Ensure at least 1
            
            # Get suggestions
            suggestions = storage.get_suggestions_by_type(type.upper(), limit)
            
            # Convert to dict for response
            suggestion_list = [
                {
                    "id": suggestion.id,
                    "stockId": suggestion.stockId,
                    "type": suggestion.type,
                    "confidence": suggestion.confidence,
                    "sentiment": suggestion.sentiment,
                    "priceTarget": suggestion.priceTarget,
                    "timeFrame": suggestion.timeFrame,
                    "createdAt": suggestion.createdAt.isoformat()
                }
                for suggestion in suggestions
            ]
            
            # Add stock information
            for suggestion in suggestion_list:
                stock = storage.get_stock(suggestion["stockId"])
                if stock:
                    suggestion["stock"] = {
                        "symbol": stock.symbol,
                        "name": stock.name,
                        "currentPrice": stock.currentPrice,
                        "dailyChangePercent": stock.dailyChangePercent
                    }
            
            return jsonify({
                "type": type.upper(),
                "suggestions": suggestion_list,
                "count": len(suggestion_list)
            }), 200
            
        except ValueError as e:
            return jsonify({"error": "Invalid parameter", "details": str(e)}), 400
            
        except Exception as e:
            logger.error(f"Error in get_suggestions_by_type: {str(e)}")
            return jsonify({"error": "Failed to get AI suggestions by type", "details": str(e)}), 500