"""
Chat routes for SuhuAI assistant in StockVisionPro
"""

from flask import request, jsonify
import logging
from datetime import datetime

from . import chat_bp
from data.storage import MemStorage
from utils.auth_helper import auth_required

# Initialize logger and storage
logger = logging.getLogger(__name__)
storage = MemStorage()

@chat_bp.route("/<int:user_id>", methods=["GET"])
@auth_required()
def get_chat_messages(current_user_id, user_id):
    """Get chat history for a user"""
    try:
        # Verify authorization
        if current_user_id != user_id:
            return jsonify({"message": "Unauthorized to view this chat history"}), 403
        
        # Parse query parameters
        limit = request.args.get("limit", 50, type=int)
        offset = request.args.get("offset", 0, type=int)
        
        # Get chat messages
        messages = storage.get_chat_messages(
            user_id,
            limit=limit,
            offset=offset
        )
        
        # Format response
        formatted_messages = [message.model_dump() for message in messages]
        
        return jsonify(formatted_messages), 200
    
    except Exception as e:
        logger.error(f"Error retrieving chat messages for user {user_id}: {str(e)}")
        return jsonify({"message": f"Failed to retrieve chat messages: {str(e)}"}), 500

@chat_bp.route("", methods=["POST"])
@auth_required()
def create_chat_message(current_user_id):
    """Create a new chat message and get AI response"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get("userId") or not data.get("content"):
            return jsonify({"message": "User ID and message content are required"}), 400
        
        # Verify authorization
        if data.get("userId") != current_user_id:
            return jsonify({"message": "Unauthorized to send messages for this user"}), 403
        
        # Get user's portfolio stocks for context
        user_stocks = []
        portfolio = storage.get_user_portfolio(current_user_id)
        
        for item in portfolio:
            stock = storage.get_stock(item.stockId)
            if stock:
                user_stocks.append(stock.symbol)
        
        # Create user message
        user_message = storage.create_chat_message({
            "userId": data.get("userId"),
            "content": data.get("content"),
            "sender": "USER",
            "timestamp": datetime.now().isoformat()
        })
        
        # Generate AI response
        ai_response_content = generate_ai_response(data.get("content"), user_stocks)
        
        # Create AI message
        ai_message = storage.create_chat_message({
            "userId": data.get("userId"),
            "content": ai_response_content,
            "sender": "AI",
            "timestamp": datetime.now().isoformat()
        })
        
        return jsonify({
            "userMessage": user_message.model_dump(),
            "aiResponse": ai_message.model_dump()
        }), 201
    
    except Exception as e:
        logger.error(f"Error creating chat message: {str(e)}")
        return jsonify({"message": f"Failed to create chat message: {str(e)}"}), 500

@chat_bp.route("/<int:user_id>", methods=["DELETE"])
@auth_required()
def clear_chat_history(current_user_id, user_id):
    """Clear chat history for a user"""
    try:
        # Verify authorization
        if current_user_id != user_id:
            return jsonify({"message": "Unauthorized to clear this chat history"}), 403
        
        # Clear chat history
        count = storage.clear_chat_history(user_id)
        
        return jsonify({
            "message": f"Cleared {count} chat messages",
            "count": count
        }), 200
    
    except Exception as e:
        logger.error(f"Error clearing chat history for user {user_id}: {str(e)}")
        return jsonify({"message": f"Failed to clear chat history: {str(e)}"}), 500

# Helper function to generate AI responses
def generate_ai_response(user_message, user_stocks):
    """
    Generate an AI response based on user message and portfolio context
    
    Args:
        user_message (str): The user's message
        user_stocks (list): List of stock symbols in user's portfolio
    
    Returns:
        str: The AI-generated response
    """
    logger.info(f"Generating AI response for: {user_message[:50]}...")
    
    # In a production environment, this would call an actual AI model
    # For demonstration, we'll use a simple rule-based approach
    
    user_message_lower = user_message.lower()
    
    # Portfolio-specific response
    if "portfolio" in user_message_lower or "holdings" in user_message_lower:
        if user_stocks:
            return f"I see you have {len(user_stocks)} stocks in your portfolio including {', '.join(user_stocks[:3])}. Your portfolio appears to be diversified across multiple sectors. Based on current market conditions, I recommend holding your current positions and considering adding defensive stocks as a hedge against potential volatility."
        else:
            return "You don't have any stocks in your portfolio yet. I recommend starting with a mix of blue-chip stocks and ETFs to build a diversified foundation, then gradually adding growth stocks as you become more comfortable with the market."
    
    # Market analysis
    elif "market" in user_message_lower or "trend" in user_message_lower:
        return "Current market analysis indicates a cautiously optimistic outlook. Major indices are showing resilience despite recent economic data. The tech sector continues to outperform, while financial stocks have been consolidating. I recommend watching key economic indicators this week, particularly the upcoming jobs report and Fed announcements."
    
    # Stock recommendations
    elif "recommend" in user_message_lower or "suggestion" in user_message_lower:
        return "Based on current market conditions, I recommend considering these sectors: (1) Semiconductors, which are benefiting from AI and data center growth, (2) Healthcare, which offers defensive positioning with growth potential, and (3) Clean energy, which is seeing increased investment and regulatory support. Always conduct thorough research before making investment decisions."
    
    # AI trading strategies
    elif "strategy" in user_message_lower or "algorithm" in user_message_lower:
        return "For algorithmic trading, I recommend starting with a momentum-based strategy that incorporates technical indicators like RSI and MACD, with proper risk management rules. You can create this in our AlgoTrade section by setting entry conditions based on these indicators and setting strict stop-loss rules. Would you like me to help you set up a specific strategy?"
    
    # Technical analysis
    elif "technical" in user_message_lower or "chart" in user_message_lower:
        return "Technical analysis currently shows several key patterns forming. The S&P 500 is testing a key resistance level with decreasing volume, suggesting potential consolidation. For individual stocks, look for bullish formations like cup-and-handle patterns or golden crosses, particularly in sectors showing relative strength compared to the broader market."
    
    # Risk management
    elif "risk" in user_message_lower or "protect" in user_message_lower:
        return "To manage risk effectively, I recommend: (1) Diversifying across different asset classes and sectors, (2) Using position sizing of no more than 5% of your portfolio in any single stock, (3) Setting stop-loss orders 10-15% below purchase price, and (4) Maintaining a cash reserve of 15-20% to capitalize on market corrections. Would you like more specific risk management advice for your current holdings?"
    
    # Default response
    else:
        return "I'm SuhuAI, your intelligent trading assistant. I can help you with market analysis, stock recommendations, portfolio optimization, and trading strategies. Feel free to ask me specific questions about stocks, market trends, or technical analysis. How can I assist with your investment decisions today?"