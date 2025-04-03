"""
Route registration for StockVisionPro API
"""

import logging
from typing import Dict, Any
from flask import Flask

from python_server.data.storage import MemStorage
from python_server.routes.auth_routes import register_auth_routes
from python_server.routes.stock_routes import register_stock_routes
from python_server.routes.ai_routes import register_ai_routes
from python_server.routes.watchlist_routes import register_watchlist_routes
from python_server.routes.portfolio_routes import register_portfolio_routes

# Configure logger
logger = logging.getLogger(__name__)

def register_all_routes(app: Flask, storage: MemStorage) -> None:
    """Register all API routes"""
    register_auth_routes(app, storage)
    register_stock_routes(app, storage)
    register_ai_routes(app, storage)
    register_watchlist_routes(app, storage)
    register_portfolio_routes(app, storage)
    
    # Core API routes
    @app.route("/api/health", methods=["GET"])
    def health_check():
        """Health check endpoint"""
        return {"status": "healthy", "message": "API is running"}