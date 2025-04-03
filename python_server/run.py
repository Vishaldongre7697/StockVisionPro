"""
Run script for StockVisionPro API

This is the entry point for running the API server.
"""

import os
import logging
from python_server.app import create_app

# Configure logger
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    app = create_app()
    
    # Get port from environment or use default
    port = int(os.getenv("PORT", 5001))
    
    # Get debug mode from environment or use default
    debug = os.getenv("DEBUG", "True").lower() in ["true", "1", "t", "yes"]
    
    logger.info(f"Starting StockVisionPro API on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    # Run the app
    app.run(host="0.0.0.0", port=port, debug=debug)