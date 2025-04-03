"""
Stock routes for StockVisionPro API
"""

import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from typing import Any, Dict, List, Optional

from python_server.data.storage import MemStorage
from python_server.utils.auth_helper import extract_pagination_params

# Configure logger
logger = logging.getLogger(__name__)


def register_stock_routes(app: Flask, storage: MemStorage) -> None:
    """Register all stock related routes"""
    
    @app.route("/api/stocks", methods=["GET"])
    def get_stocks():
        """Get all stocks with optional filtering"""
        try:
            # Extract pagination params
            pagination = extract_pagination_params(request.args)
            
            # Extract filter parameters
            sector = request.args.get('sector')
            exchange = request.args.get('exchange')
            
            # Extract price range
            min_price = None
            max_price = None
            
            if 'min_price' in request.args:
                try:
                    min_price = float(request.args.get('min_price'))
                except ValueError:
                    return jsonify({"error": "Invalid min_price parameter"}), 400
            
            if 'max_price' in request.args:
                try:
                    max_price = float(request.args.get('max_price'))
                except ValueError:
                    return jsonify({"error": "Invalid max_price parameter"}), 400
            
            # Get stocks from storage with filtering
            stocks = storage.get_all_stocks(
                limit=pagination['limit'],
                offset=pagination['offset'],
                sector=sector,
                exchange=exchange,
                min_price=min_price,
                max_price=max_price
            )
            
            # Convert to dict for response
            stock_list = [stock.model_dump() for stock in stocks]
            
            return jsonify({
                "stocks": stock_list,
                "count": len(stock_list)
            }), 200
            
        except Exception as e:
            logger.error(f"Error in get_stocks: {str(e)}")
            return jsonify({"error": "Failed to get stocks", "details": str(e)}), 500
    
    @app.route("/api/stocks/top", methods=["GET"])
    def get_top_stocks():
        """Get top performing stocks"""
        try:
            # Extract limit parameter
            limit = int(request.args.get('limit', 5))
            filter_by = request.args.get('filter_by', 'performance')
            
            # Validate limit
            limit = min(limit, 20)  # Cap at 20 to prevent excessive response size
            limit = max(limit, 1)   # Ensure at least 1 result
            
            # Get top stocks from storage
            stocks = storage.get_top_stocks(
                limit=limit,
                filter_by=filter_by
            )
            
            # Convert to dict for response
            stock_list = [stock.model_dump() for stock in stocks]
            
            return jsonify({
                "stocks": stock_list,
                "count": len(stock_list),
                "filter": filter_by
            }), 200
            
        except ValueError as e:
            return jsonify({"error": "Invalid parameter", "details": str(e)}), 400
            
        except Exception as e:
            logger.error(f"Error in get_top_stocks: {str(e)}")
            return jsonify({"error": "Failed to get top stocks", "details": str(e)}), 500
    
    @app.route("/api/stocks/<symbol>", methods=["GET"])
    def get_stock_by_symbol(symbol):
        """Get a stock by symbol"""
        try:
            # Get stock from storage
            stock = storage.get_stock_by_symbol(symbol)
            
            if not stock:
                return jsonify({"error": "Stock not found"}), 404
            
            # Get AI suggestion for this stock
            ai_suggestion = storage.get_stock_ai_suggestion(stock.id)
            
            # Prepare response
            response = stock.model_dump()
            
            # Add AI suggestion if available
            if ai_suggestion:
                response["aiSuggestion"] = {
                    "type": ai_suggestion.type,
                    "confidence": ai_suggestion.confidence,
                    "sentiment": ai_suggestion.sentiment,
                    "priceTarget": ai_suggestion.priceTarget,
                    "timeFrame": ai_suggestion.timeFrame
                }
            
            return jsonify({"stock": response}), 200
            
        except Exception as e:
            logger.error(f"Error in get_stock_by_symbol: {str(e)}")
            return jsonify({"error": "Failed to get stock", "details": str(e)}), 500
    
    @app.route("/api/stocks/search", methods=["GET"])
    def search_stocks():
        """Search stocks by name or symbol"""
        try:
            # Extract query parameter
            query = request.args.get('q', '')
            limit = int(request.args.get('limit', 10))
            
            if not query:
                return jsonify({"error": "Search query is required"}), 400
            
            # Validate limit
            limit = min(limit, 20)  # Cap at 20
            limit = max(limit, 1)   # Ensure at least 1
            
            # Search stocks
            stocks = storage.search_stocks(query, limit)
            
            # Convert to dict for response
            stock_list = [stock.model_dump() for stock in stocks]
            
            return jsonify({
                "stocks": stock_list,
                "count": len(stock_list),
                "query": query
            }), 200
            
        except ValueError as e:
            return jsonify({"error": "Invalid parameter", "details": str(e)}), 400
            
        except Exception as e:
            logger.error(f"Error in search_stocks: {str(e)}")
            return jsonify({"error": "Failed to search stocks", "details": str(e)}), 500
    
    @app.route("/api/sectors", methods=["GET"])
    def get_sectors():
        """Get all unique sectors"""
        try:
            # Get sectors from storage
            sectors = storage.get_unique_sectors()
            
            return jsonify({
                "sectors": sectors,
                "count": len(sectors)
            }), 200
            
        except Exception as e:
            logger.error(f"Error in get_sectors: {str(e)}")
            return jsonify({"error": "Failed to get sectors", "details": str(e)}), 500
    
    @app.route("/api/exchanges", methods=["GET"])
    def get_exchanges():
        """Get all unique exchanges"""
        try:
            # Get exchanges from storage
            exchanges = storage.get_unique_exchanges()
            
            return jsonify({
                "exchanges": exchanges,
                "count": len(exchanges)
            }), 200
            
        except Exception as e:
            logger.error(f"Error in get_exchanges: {str(e)}")
            return jsonify({"error": "Failed to get exchanges", "details": str(e)}), 500
    
    @app.route("/api/stocks/<stock_id>/historical", methods=["GET"])
    def get_stock_historical(stock_id):
        """Get historical data for a stock"""
        try:
            # Validate stock exists
            stock = storage.get_stock(stock_id)
            if not stock:
                return jsonify({"error": "Stock not found"}), 404
            
            # Extract days parameter
            days = int(request.args.get('days', 30))
            days = min(days, 365)  # Cap at 365 days
            days = max(days, 1)    # Ensure at least 1 day
            
            # Get historical data
            historical_data = storage.get_stock_historical_data(stock_id, days)
            
            # Convert to dict for response
            data_list = [
                {
                    "date": item.date.isoformat(),
                    "open": item.open,
                    "high": item.high,
                    "low": item.low,
                    "close": item.close,
                    "volume": item.volume
                }
                for item in historical_data
            ]
            
            return jsonify({
                "symbol": stock.symbol,
                "name": stock.name,
                "stockId": stock_id,
                "data": data_list,
                "count": len(data_list)
            }), 200
            
        except ValueError as e:
            return jsonify({"error": "Invalid parameter", "details": str(e)}), 400
            
        except Exception as e:
            logger.error(f"Error in get_stock_historical: {str(e)}")
            return jsonify({"error": "Failed to get historical data", "details": str(e)}), 500