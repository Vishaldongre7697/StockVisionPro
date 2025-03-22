from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Import model schemas
from models.schemas import User, Stock, StockHistoricalData, Watchlist, TradingStrategy, Transaction
from models.schemas import Portfolio, AiSuggestion, Notification, ChatMessage
from models.schemas import TransactionType, TransactionStatus, SuggestionType, NotificationType, TimeFrame, StockSentiment

# Import storage services
from data.storage import MemStorage

# Initialize application
app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# Configure JWT
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret")  # Change this in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
jwt = JWTManager(app)

# Initialize storage
storage = MemStorage()

# Helper function for data validation
def validate_request_data(schema, data):
    try:
        return schema.model_validate(data)
    except Exception as e:
        return None, {"error": str(e)}

# Authentication Routes
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    
    # Check if username or email already exists
    if storage.get_user_by_username(data.get("username")):
        return jsonify({"message": "Username already exists"}), 400
    
    if storage.get_user_by_email(data.get("email")):
        return jsonify({"message": "Email already exists"}), 400
    
    # Create user
    try:
        user = storage.create_user({
            "username": data.get("username"),
            "password": data.get("password"),  # In production, hash this password
            "email": data.get("email"),
            "fullName": data.get("fullName", None),
            "accountBalance": 1000000  # Default starting balance
        })
        
        # Generate access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "fullName": user.fullName
            },
            "token": access_token
        }), 201
        
    except Exception as e:
        return jsonify({"message": f"Failed to create user: {str(e)}"}), 500

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "")
    password = data.get("password", "")
    
    user = storage.get_user_by_username(username)
    
    if not user or user.password != password:  # In production, verify hashed password
        return jsonify({"message": "Invalid credentials"}), 401
    
    # Update last login
    storage.update_last_login(user.id)
    
    # Generate access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "fullName": user.fullName
        },
        "token": access_token
    }), 200

# Stocks Routes
@app.route("/api/stocks", methods=["GET"])
def get_stocks():
    stocks = storage.get_all_stocks()
    return jsonify([stock.model_dump() for stock in stocks]), 200

@app.route("/api/stocks/top", methods=["GET"])
def get_top_stocks():
    limit = request.args.get("limit", 10, type=int)
    stocks = storage.get_top_stocks(limit)
    return jsonify([stock.model_dump() for stock in stocks]), 200

@app.route("/api/stocks/<symbol>", methods=["GET"])
def get_stock_by_symbol(symbol):
    stock = storage.get_stock_by_symbol(symbol)
    
    if not stock:
        return jsonify({"message": "Stock not found"}), 404
    
    return jsonify(stock.model_dump()), 200

@app.route("/api/stocks/<int:stock_id>/historical", methods=["GET"])
def get_stock_historical_data(stock_id):
    start_date_str = request.args.get("startDate")
    end_date_str = request.args.get("endDate")
    
    start_date = datetime.fromisoformat(start_date_str) if start_date_str else None
    end_date = datetime.fromisoformat(end_date_str) if end_date_str else None
    
    data = storage.get_stock_historical_data(stock_id, start_date, end_date)
    return jsonify([point.model_dump() for point in data]), 200

# AI Suggestions Routes
@app.route("/api/ai-suggestions", methods=["GET"])
def get_ai_suggestions():
    suggestions = storage.get_all_ai_suggestions()
    return jsonify([suggestion.model_dump() for suggestion in suggestions]), 200

@app.route("/api/ai-suggestions/top", methods=["GET"])
def get_top_ai_suggestions():
    limit = request.args.get("limit", 5, type=int)
    suggestions = storage.get_top_ai_suggestions(limit)
    
    # Get corresponding stock for each suggestion
    enriched_suggestions = []
    for suggestion in suggestions:
        stock = storage.get_stock(suggestion.stockId)
        suggestion_dict = suggestion.model_dump()
        suggestion_dict["stock"] = stock.model_dump() if stock else None
        enriched_suggestions.append(suggestion_dict)
    
    return jsonify(enriched_suggestions), 200

@app.route("/api/ai-suggestions/stock/<int:stock_id>", methods=["GET"])
def get_stock_ai_suggestion(stock_id):
    suggestion = storage.get_stock_ai_suggestion(stock_id)
    
    if not suggestion:
        return jsonify({"message": "AI suggestion not found for this stock"}), 404
    
    return jsonify(suggestion.model_dump()), 200

@app.route("/api/ai-suggestions/by-type/<suggestion_type>", methods=["GET"])
def get_suggestions_by_type(suggestion_type):
    limit = request.args.get("limit", 10, type=int)
    
    if suggestion_type not in SuggestionType.__members__:
        return jsonify({"message": "Invalid suggestion type"}), 400
    
    suggestions = storage.get_suggestions_by_type(suggestion_type, limit)
    
    # Enrich with stock data
    enriched_suggestions = []
    for suggestion in suggestions:
        stock = storage.get_stock(suggestion.stockId)
        suggestion_dict = suggestion.model_dump()
        suggestion_dict["stock"] = stock.model_dump() if stock else None
        enriched_suggestions.append(suggestion_dict)
    
    return jsonify(enriched_suggestions), 200

# Authentication middleware helper
def auth_required():
    def decorator(fn):
        @jwt_required()
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            return fn(current_user_id, *args, **kwargs)
        wrapper.__name__ = fn.__name__
        return wrapper
    return decorator

# Watchlist Routes
@app.route("/api/watchlist/<int:user_id>", methods=["GET"])
@auth_required()
def get_user_watchlist(current_user_id, user_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to view this watchlist"}), 403
    
    stocks = storage.get_user_watchlist(user_id)
    return jsonify([stock.model_dump() for stock in stocks]), 200

@app.route("/api/watchlist", methods=["POST"])
@auth_required()
def add_to_watchlist(current_user_id):
    data = request.get_json()
    
    if data.get("userId") != current_user_id:
        return jsonify({"message": "Unauthorized to modify this watchlist"}), 403
    
    # Check if already in watchlist
    if storage.is_stock_in_watchlist(data.get("userId"), data.get("stockId")):
        return jsonify({"message": "Stock already in watchlist"}), 400
    
    watchlist_item = storage.add_to_watchlist({
        "userId": data.get("userId"),
        "stockId": data.get("stockId"),
        "alertPrice": data.get("alertPrice"),
        "alertCondition": data.get("alertCondition")
    })
    
    return jsonify(watchlist_item.model_dump()), 201

@app.route("/api/watchlist/<int:user_id>/<int:stock_id>", methods=["DELETE"])
@auth_required()
def remove_from_watchlist(current_user_id, user_id, stock_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to modify this watchlist"}), 403
    
    success = storage.remove_from_watchlist(user_id, stock_id)
    
    if not success:
        return jsonify({"message": "Stock not found in watchlist"}), 404
    
    return jsonify({"message": "Stock removed from watchlist"}), 200

# Portfolio Routes
@app.route("/api/portfolio/<int:user_id>", methods=["GET"])
@auth_required()
def get_user_portfolio(current_user_id, user_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to view this portfolio"}), 403
    
    portfolio = storage.get_user_portfolio(user_id)
    
    # Enrich with stock data
    enriched_portfolio = []
    for item in portfolio:
        stock = storage.get_stock(item.stockId)
        if stock:
            portfolio_dict = item.model_dump()
            portfolio_dict["stock"] = stock.model_dump()
            portfolio_dict["currentValue"] = stock.currentPrice * item.quantity
            portfolio_dict["investmentValue"] = item.averageBuyPrice * item.quantity
            portfolio_dict["profitLoss"] = (stock.currentPrice - item.averageBuyPrice) * item.quantity
            portfolio_dict["profitLossPercent"] = ((stock.currentPrice - item.averageBuyPrice) / item.averageBuyPrice) * 100
            enriched_portfolio.append(portfolio_dict)
    
    return jsonify(enriched_portfolio), 200

@app.route("/api/portfolio/<int:user_id>/summary", methods=["GET"])
@auth_required()
def get_portfolio_summary(current_user_id, user_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to view this portfolio"}), 403
    
    summary = storage.get_portfolio_value(user_id)
    user = storage.get_user(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    result = summary
    result["accountBalance"] = user.accountBalance or 0
    result["totalAssets"] = (user.accountBalance or 0) + summary["totalValue"]
    
    return jsonify(result), 200

@app.route("/api/portfolio", methods=["POST"])
@auth_required()
def create_portfolio_item(current_user_id):
    data = request.get_json()
    
    if data.get("userId") != current_user_id:
        return jsonify({"message": "Unauthorized to modify this portfolio"}), 403
    
    # Check if user has enough balance
    user = storage.get_user(data.get("userId"))
    stock = storage.get_stock(data.get("stockId"))
    
    if not user or not stock:
        return jsonify({"message": "User or stock not found"}), 404
    
    total_cost = data.get("averageBuyPrice") * data.get("quantity")
    
    if user.accountBalance < total_cost:
        return jsonify({"message": "Insufficient balance"}), 400
    
    # Create portfolio item
    portfolio_item = storage.create_portfolio_item({
        "userId": data.get("userId"),
        "stockId": data.get("stockId"),
        "quantity": data.get("quantity"),
        "averageBuyPrice": data.get("averageBuyPrice")
    })
    
    # Update user balance
    storage.update_account_balance(user.id, user.accountBalance - total_cost)
    
    # Create a transaction record
    storage.create_transaction({
        "userId": user.id,
        "stockId": stock.id,
        "type": TransactionType.BUY,
        "quantity": data.get("quantity"),
        "price": data.get("averageBuyPrice"),
        "totalAmount": total_cost,
        "status": TransactionStatus.COMPLETED
    })
    
    return jsonify(portfolio_item.model_dump()), 201

@app.route("/api/portfolio/<int:user_id>/<int:stock_id>", methods=["PUT"])
@auth_required()
def update_portfolio_item(current_user_id, user_id, stock_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to modify this portfolio"}), 403
    
    data = request.get_json()
    
    result = storage.update_portfolio_item(
        user_id, 
        stock_id, 
        data.get("quantity"), 
        data.get("averageBuyPrice")
    )
    
    if not result:
        return jsonify({"message": "Portfolio item not found"}), 404
    
    return jsonify(result.model_dump()), 200

@app.route("/api/portfolio/<int:user_id>/<int:stock_id>", methods=["DELETE"])
@auth_required()
def delete_portfolio_item(current_user_id, user_id, stock_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to modify this portfolio"}), 403
    
    # Get portfolio item and stock before deletion
    portfolio_item = storage.get_portfolio_item(user_id, stock_id)
    stock = storage.get_stock(stock_id)
    
    if not portfolio_item or not stock:
        return jsonify({"message": "Portfolio item not found"}), 404
    
    # Calculate sale amount at current price
    sale_amount = stock.currentPrice * portfolio_item.quantity
    
    # Delete portfolio item
    success = storage.delete_portfolio_item(user_id, stock_id)
    
    if not success:
        return jsonify({"message": "Failed to delete portfolio item"}), 500
    
    # Update user balance with sale proceeds
    user = storage.get_user(user_id)
    if user:
        storage.update_account_balance(user_id, user.accountBalance + sale_amount)
        
        # Create a transaction record
        storage.create_transaction({
            "userId": user_id,
            "stockId": stock_id,
            "type": TransactionType.SELL,
            "quantity": portfolio_item.quantity,
            "price": stock.currentPrice,
            "totalAmount": sale_amount,
            "status": TransactionStatus.COMPLETED
        })
    
    return jsonify({
        "message": "Portfolio item sold successfully", 
        "saleAmount": sale_amount
    }), 200

# Trading Strategies Routes
@app.route("/api/strategies/<int:user_id>", methods=["GET"])
@auth_required()
def get_user_strategies(current_user_id, user_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to view these strategies"}), 403
    
    strategies = storage.get_user_strategies(user_id)
    return jsonify([strategy.model_dump() for strategy in strategies]), 200

@app.route("/api/strategies", methods=["POST"])
@auth_required()
def create_strategy(current_user_id):
    data = request.get_json()
    
    if data.get("userId") != current_user_id:
        return jsonify({"message": "Unauthorized to create strategy for this user"}), 403
    
    strategy = storage.create_strategy({
        "userId": data.get("userId"),
        "name": data.get("name"),
        "description": data.get("description"),
        "conditions": data.get("conditions"),
        "actions": data.get("actions"),
        "isActive": data.get("isActive", False),
        "backtestResults": data.get("backtestResults", {})
    })
    
    return jsonify(strategy.model_dump()), 201

@app.route("/api/strategies/<int:strategy_id>", methods=["PUT"])
@auth_required()
def update_strategy(current_user_id, strategy_id):
    data = request.get_json()
    
    strategy = storage.get_strategy(strategy_id)
    
    if not strategy:
        return jsonify({"message": "Trading strategy not found"}), 404
    
    if strategy.userId != current_user_id:
        return jsonify({"message": "Unauthorized to update this strategy"}), 403
    
    updated_strategy = storage.update_strategy(strategy_id, {
        "name": data.get("name", strategy.name),
        "description": data.get("description", strategy.description),
        "conditions": data.get("conditions", strategy.conditions),
        "actions": data.get("actions", strategy.actions),
        "isActive": data.get("isActive", strategy.isActive),
        "backtestResults": data.get("backtestResults", strategy.backtestResults)
    })
    
    return jsonify(updated_strategy.model_dump()), 200

@app.route("/api/strategies/<int:strategy_id>", methods=["DELETE"])
@auth_required()
def delete_strategy(current_user_id, strategy_id):
    strategy = storage.get_strategy(strategy_id)
    
    if not strategy:
        return jsonify({"message": "Trading strategy not found"}), 404
    
    if strategy.userId != current_user_id:
        return jsonify({"message": "Unauthorized to delete this strategy"}), 403
    
    success = storage.delete_strategy(strategy_id)
    
    if not success:
        return jsonify({"message": "Failed to delete strategy"}), 500
    
    return jsonify({"message": "Strategy deleted successfully"}), 200

@app.route("/api/strategies/<int:strategy_id>/toggle", methods=["PUT"])
@auth_required()
def toggle_strategy(current_user_id, strategy_id):
    data = request.get_json()
    is_active = data.get("isActive")
    
    if is_active is None:
        return jsonify({"message": "isActive field is required"}), 400
    
    strategy = storage.get_strategy(strategy_id)
    
    if not strategy:
        return jsonify({"message": "Trading strategy not found"}), 404
    
    if strategy.userId != current_user_id:
        return jsonify({"message": "Unauthorized to update this strategy"}), 403
    
    updated_strategy = storage.toggle_strategy_status(strategy_id, is_active)
    
    return jsonify(updated_strategy.model_dump()), 200

# Transactions Routes
@app.route("/api/transactions/<int:user_id>", methods=["GET"])
@auth_required()
def get_user_transactions(current_user_id, user_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to view these transactions"}), 403
    
    limit = request.args.get("limit", type=int)
    
    transactions = storage.get_user_transactions(user_id, limit)
    
    # Enrich with stock data
    enriched_transactions = []
    for transaction in transactions:
        stock = storage.get_stock(transaction.stockId)
        transaction_dict = transaction.model_dump()
        transaction_dict["stock"] = stock.model_dump() if stock else None
        enriched_transactions.append(transaction_dict)
    
    return jsonify(enriched_transactions), 200

# Notifications Routes
@app.route("/api/notifications/<int:user_id>", methods=["GET"])
@auth_required()
def get_user_notifications(current_user_id, user_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to view these notifications"}), 403
    
    limit = request.args.get("limit", type=int)
    only_unread = request.args.get("unread") == "true"
    
    notifications = storage.get_user_notifications(user_id, limit, only_unread)
    return jsonify([notification.model_dump() for notification in notifications]), 200

@app.route("/api/notifications/<int:notification_id>/read", methods=["POST"])
@auth_required()
def mark_notification_as_read(current_user_id, notification_id):
    notification = storage.get_notification(notification_id)
    
    if not notification:
        return jsonify({"message": "Notification not found"}), 404
    
    if notification.userId != current_user_id:
        return jsonify({"message": "Unauthorized to update this notification"}), 403
    
    updated_notification = storage.mark_notification_as_read(notification_id)
    return jsonify(updated_notification.model_dump()), 200

@app.route("/api/notifications/<int:user_id>/read-all", methods=["POST"])
@auth_required()
def mark_all_notifications_as_read(current_user_id, user_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to update these notifications"}), 403
    
    count = storage.mark_all_notifications_as_read(user_id)
    return jsonify({"message": f"{count} notifications marked as read"}), 200

# Chat Messages Routes
@app.route("/api/chat/<int:user_id>", methods=["GET"])
@auth_required()
def get_chat_messages(current_user_id, user_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to view these chat messages"}), 403
    
    limit = request.args.get("limit", type=int)
    
    messages = storage.get_chat_messages(user_id, limit)
    return jsonify([message.model_dump() for message in messages]), 200

@app.route("/api/chat", methods=["POST"])
@auth_required()
def create_chat_message(current_user_id):
    data = request.get_json()
    
    if data.get("userId") != current_user_id:
        return jsonify({"message": "Unauthorized to send messages for this user"}), 403
    
    user_message = storage.save_chat_message({
        "userId": data.get("userId"),
        "sender": data.get("sender"),
        "message": data.get("message"),
        "context": data.get("context", {})
    })
    
    # If it's a user message, generate an AI response
    if data.get("sender") == "USER":
        # Get user's portfolio for context
        portfolio = storage.get_user_portfolio(data.get("userId"))
        user_stocks = []
        for item in portfolio:
            stock = storage.get_stock(item.stockId)
            if stock:
                user_stocks.append(stock.name)
        
        # Generate AI response
        ai_response_text = generate_ai_response(data.get("message"), user_stocks)
        
        ai_message = storage.save_chat_message({
            "userId": data.get("userId"),
            "sender": "AI",
            "message": ai_response_text,
            "context": {}
        })
        
        return jsonify({
            "userMessage": user_message.model_dump(),
            "aiMessage": ai_message.model_dump()
        }), 201
    
    return jsonify({"userMessage": user_message.model_dump()}), 201

@app.route("/api/chat/<int:user_id>", methods=["DELETE"])
@auth_required()
def clear_chat_history(current_user_id, user_id):
    if current_user_id != user_id:
        return jsonify({"message": "Unauthorized to clear chat history for this user"}), 403
    
    success = storage.clear_chat_history(user_id)
    
    if not success:
        return jsonify({"message": "Failed to clear chat history"}), 500
    
    return jsonify({"message": "Chat history cleared successfully"}), 200

# Helper function to generate AI responses
def generate_ai_response(user_message, user_stocks):
    user_message = user_message.lower()
    
    # Check for greetings
    if any(greeting in user_message for greeting in ["hi", "hello", "hey", "greetings"]):
        return "Hello! I'm SuhuAI, your personal trading assistant. How can I help you today?"
    
    # Check for questions about portfolio
    if "portfolio" in user_message or "holdings" in user_message:
        if not user_stocks:
            return "You don't have any stocks in your portfolio yet. Would you like some recommendations on what to buy?"
        else:
            return f"Your portfolio contains {', '.join(user_stocks)}. Would you like me to analyze any specific stock?"
    
    # Check for stock recommendation requests
    if any(term in user_message for term in ["recommend", "suggestion", "what should i buy", "should i buy"]):
        return "Based on current market conditions, I recommend considering stocks in the technology and renewable energy sectors. Some specific stocks worth looking at are Reliance Industries, HDFC Bank, and Infosys based on their strong fundamentals and growth potential."
    
    # Check for market questions
    if any(term in user_message for term in ["market", "nifty", "sensex", "index"]):
        return "The market is showing mixed signals currently. Nifty is up slightly, but there's volatility due to global factors. It's important to maintain a diversified portfolio in the current conditions."
    
    # Default response
    return f"I understand you're asking about \"{user_message}\". As your AI trading assistant, I'm continuously learning to provide better insights. Could you provide more details about what you'd like to know?"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)