"""
Transaction routes for StockVisionPro API
"""

from flask import request, jsonify
import logging
from datetime import datetime

from . import transaction_bp
from data.storage import MemStorage
from utils.auth_helper import auth_required

# Initialize logger and storage
logger = logging.getLogger(__name__)
storage = MemStorage()

@transaction_bp.route("/<int:user_id>", methods=["GET"])
@auth_required()
def get_user_transactions(current_user_id, user_id):
    """Get a user's transaction history"""
    try:
        # Verify authorization
        if current_user_id != user_id:
            return jsonify({"message": "Unauthorized to view these transactions"}), 403
        
        # Parse query parameters
        limit = request.args.get("limit", 50, type=int)
        offset = request.args.get("offset", 0, type=int)
        transaction_type = request.args.get("type")  # BUY, SELL
        start_date_str = request.args.get("startDate")
        end_date_str = request.args.get("endDate")
        
        # Convert date strings to datetime objects if provided
        start_date = datetime.fromisoformat(start_date_str) if start_date_str else None
        end_date = datetime.fromisoformat(end_date_str) if end_date_str else None
        
        # Get transactions
        transactions = storage.get_user_transactions(
            user_id,
            limit=limit,
            offset=offset,
            transaction_type=transaction_type,
            start_date=start_date,
            end_date=end_date
        )
        
        # Enrich with stock data
        enriched_transactions = []
        for transaction in transactions:
            stock = storage.get_stock(transaction.stockId)
            transaction_dict = transaction.model_dump()
            transaction_dict["stock"] = stock.model_dump() if stock else None
            enriched_transactions.append(transaction_dict)
        
        return jsonify(enriched_transactions), 200
    
    except Exception as e:
        logger.error(f"Error retrieving transactions for user {user_id}: {str(e)}")
        return jsonify({"message": f"Failed to retrieve transactions: {str(e)}"}), 500

@transaction_bp.route("/<int:user_id>/summary", methods=["GET"])
@auth_required()
def get_transaction_summary(current_user_id, user_id):
    """Get a summary of a user's transactions"""
    try:
        # Verify authorization
        if current_user_id != user_id:
            return jsonify({"message": "Unauthorized to view these transactions"}), 403
        
        # Parse date range parameters
        start_date_str = request.args.get("startDate")
        end_date_str = request.args.get("endDate")
        
        # Convert date strings to datetime objects if provided
        start_date = datetime.fromisoformat(start_date_str) if start_date_str else None
        end_date = datetime.fromisoformat(end_date_str) if end_date_str else None
        
        # Get all transactions within date range
        transactions = storage.get_user_transactions(
            user_id,
            limit=1000,  # High limit to get all transactions
            offset=0,
            start_date=start_date,
            end_date=end_date
        )
        
        # Calculate summary statistics
        buy_count = 0
        sell_count = 0
        total_buy_amount = 0
        total_sell_amount = 0
        
        for transaction in transactions:
            if transaction.type == "BUY":
                buy_count += 1
                total_buy_amount += transaction.totalAmount
            elif transaction.type == "SELL":
                sell_count += 1
                total_sell_amount += transaction.totalAmount
        
        # Calculate net profit/loss
        net_profit_loss = total_sell_amount - total_buy_amount
        
        # Get transactions by stock
        stock_transactions = {}
        
        for transaction in transactions:
            stock_id = transaction.stockId
            
            if stock_id not in stock_transactions:
                stock = storage.get_stock(stock_id)
                stock_name = stock.name if stock else f"Stock {stock_id}"
                stock_symbol = stock.symbol if stock else f"ID{stock_id}"
                
                stock_transactions[stock_id] = {
                    "stockId": stock_id,
                    "stockName": stock_name,
                    "stockSymbol": stock_symbol,
                    "buyCount": 0,
                    "sellCount": 0,
                    "totalBuyAmount": 0,
                    "totalSellAmount": 0,
                    "profitLoss": 0
                }
            
            if transaction.type == "BUY":
                stock_transactions[stock_id]["buyCount"] += 1
                stock_transactions[stock_id]["totalBuyAmount"] += transaction.totalAmount
            elif transaction.type == "SELL":
                stock_transactions[stock_id]["sellCount"] += 1
                stock_transactions[stock_id]["totalSellAmount"] += transaction.totalAmount
            
            stock_transactions[stock_id]["profitLoss"] = (
                stock_transactions[stock_id]["totalSellAmount"] - 
                stock_transactions[stock_id]["totalBuyAmount"]
            )
        
        # Create response
        response = {
            "summary": {
                "totalTransactions": len(transactions),
                "buyCount": buy_count,
                "sellCount": sell_count,
                "totalBuyAmount": total_buy_amount,
                "totalSellAmount": total_sell_amount,
                "netProfitLoss": net_profit_loss
            },
            "byStock": list(stock_transactions.values())
        }
        
        if start_date:
            response["startDate"] = start_date_str
        
        if end_date:
            response["endDate"] = end_date_str
        
        return jsonify(response), 200
    
    except Exception as e:
        logger.error(f"Error retrieving transaction summary for user {user_id}: {str(e)}")
        return jsonify({"message": f"Failed to retrieve transaction summary: {str(e)}"}), 500

@transaction_bp.route("/<int:transaction_id>", methods=["GET"])
@auth_required()
def get_transaction(current_user_id, transaction_id):
    """Get details of a specific transaction"""
    try:
        # Get transaction
        transaction = storage.get_transaction(transaction_id)
        
        if not transaction:
            return jsonify({"message": "Transaction not found"}), 404
        
        # Verify authorization
        if transaction.userId != current_user_id:
            return jsonify({"message": "Unauthorized to view this transaction"}), 403
        
        # Get stock data
        stock = storage.get_stock(transaction.stockId)
        
        # Create response
        transaction_dict = transaction.model_dump()
        transaction_dict["stock"] = stock.model_dump() if stock else None
        
        return jsonify(transaction_dict), 200
    
    except Exception as e:
        logger.error(f"Error retrieving transaction {transaction_id}: {str(e)}")
        return jsonify({"message": f"Failed to retrieve transaction: {str(e)}"}), 500