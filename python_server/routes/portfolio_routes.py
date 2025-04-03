"""
Portfolio routes for StockVisionPro API
"""

import logging
from flask import Flask, request, jsonify
from typing import Any, Dict, List, Optional

from python_server.data.storage import MemStorage
from python_server.utils.auth_helper import jwt_required_with_storage, extract_pagination_params

# Configure logger
logger = logging.getLogger(__name__)

def register_portfolio_routes(app: Flask, storage: MemStorage) -> None:
    """Register all portfolio related routes"""
    
    @app.route("/api/portfolio/<user_id>", methods=["GET"])
    @jwt_required_with_storage(storage)
    def get_user_portfolio(user_id):
        """Get a user's portfolio"""
        try:
            # Get portfolio from storage
            portfolio_items = storage.get_user_portfolio(user_id)
            
            # Convert to dict for response and include stock information
            portfolio_data = []
            total_value = 0.0
            total_profit_loss = 0.0
            
            for item in portfolio_items:
                stock = storage.get_stock(item.stockId)
                
                # Skip if stock doesn't exist (shouldn't happen but just in case)
                if not stock:
                    continue
                
                # Calculate values
                current_value = stock.currentPrice * item.quantity
                investment_value = item.averageBuyPrice * item.quantity
                profit_loss = current_value - investment_value
                profit_loss_percent = (profit_loss / investment_value) * 100 if investment_value > 0 else 0
                
                # Update totals
                total_value += current_value
                total_profit_loss += profit_loss
                
                portfolio_data.append({
                    "id": item.id,
                    "userId": item.userId,
                    "stockId": item.stockId,
                    "quantity": item.quantity,
                    "averageBuyPrice": item.averageBuyPrice,
                    "notes": item.notes,
                    "createdAt": item.createdAt.isoformat(),
                    "updatedAt": item.updatedAt.isoformat() if item.updatedAt else None,
                    "currentValue": current_value,
                    "investmentValue": investment_value,
                    "profitLoss": profit_loss,
                    "profitLossPercent": profit_loss_percent,
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
            
            # Calculate total profit loss percent
            total_investment = sum(item["investmentValue"] for item in portfolio_data)
            total_profit_loss_percent = (total_profit_loss / total_investment) * 100 if total_investment > 0 else 0
            
            # Get user for additional info
            user = storage.get_user(user_id)
            account_balance = user.accountBalance if user else 0
            
            return jsonify({
                "portfolio": portfolio_data,
                "count": len(portfolio_data),
                "summary": {
                    "totalValue": total_value,
                    "totalInvestment": total_investment,
                    "totalProfitLoss": total_profit_loss,
                    "totalProfitLossPercent": total_profit_loss_percent,
                    "accountBalance": account_balance,
                    "totalAssets": total_value + account_balance
                }
            }), 200
            
        except Exception as e:
            logger.error(f"Error in get_user_portfolio: {str(e)}")
            return jsonify({"error": "Failed to get portfolio", "details": str(e)}), 500
    
    @app.route("/api/portfolio/<user_id>/summary", methods=["GET"])
    @jwt_required_with_storage(storage)
    def get_portfolio_summary(user_id):
        """Get a summary of a user's portfolio"""
        try:
            # Get portfolio summary from storage
            summary = storage.get_portfolio_value(user_id)
            
            # Get user for additional info
            user = storage.get_user(user_id)
            account_balance = user.accountBalance if user else 0
            
            # Add account balance to summary
            summary["accountBalance"] = account_balance
            summary["totalAssets"] = summary["totalValue"] + account_balance
            
            # Get portfolio count
            portfolio_items = storage.get_user_portfolio(user_id)
            
            return jsonify({
                "summary": summary,
                "itemCount": len(portfolio_items)
            }), 200
            
        except Exception as e:
            logger.error(f"Error in get_portfolio_summary: {str(e)}")
            return jsonify({"error": "Failed to get portfolio summary", "details": str(e)}), 500
    
    @app.route("/api/portfolio", methods=["POST"])
    @jwt_required_with_storage(storage)
    def create_portfolio_item():
        """Create a portfolio item"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ["userId", "stockId", "quantity", "averageBuyPrice"]
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Check if stock exists
            stock = storage.get_stock(data["stockId"])
            if not stock:
                return jsonify({"error": "Stock not found"}), 404
            
            # Validate numeric fields
            try:
                data["quantity"] = float(data["quantity"])
                data["averageBuyPrice"] = float(data["averageBuyPrice"])
            except ValueError:
                return jsonify({"error": "Invalid quantity or average buy price"}), 400
            
            # Additional validations
            if data["quantity"] <= 0:
                return jsonify({"error": "Quantity must be greater than zero"}), 400
            
            if data["averageBuyPrice"] <= 0:
                return jsonify({"error": "Average buy price must be greater than zero"}), 400
            
            # Check if user has enough balance
            user = storage.get_user(data["userId"])
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            total_cost = data["quantity"] * data["averageBuyPrice"]
            
            if user.accountBalance < total_cost:
                return jsonify({"error": "Insufficient account balance"}), 400
            
            # Check if already in portfolio
            existing_item = storage.get_portfolio_item(data["userId"], data["stockId"])
            if existing_item:
                return jsonify({"error": "Stock already in portfolio"}), 409
            
            # Create portfolio item
            portfolio_item = storage.create_portfolio_item(data)
            
            # Update user's account balance
            new_balance = user.accountBalance - total_cost
            storage.update_account_balance(data["userId"], new_balance)
            
            # Create transaction record
            transaction_data = {
                "userId": data["userId"],
                "stockId": data["stockId"],
                "type": "BUY",
                "quantity": data["quantity"],
                "price": data["averageBuyPrice"],
                "totalAmount": total_cost,
                "status": "COMPLETED",
                "notes": "Initial purchase"
            }
            storage.create_transaction(transaction_data)
            
            # Prepare response
            response_data = {
                "id": portfolio_item.id,
                "userId": portfolio_item.userId,
                "stockId": portfolio_item.stockId,
                "quantity": portfolio_item.quantity,
                "averageBuyPrice": portfolio_item.averageBuyPrice,
                "notes": portfolio_item.notes,
                "createdAt": portfolio_item.createdAt.isoformat(),
                "stock": {
                    "symbol": stock.symbol,
                    "name": stock.name,
                    "currentPrice": stock.currentPrice
                },
                "transactionAmount": total_cost,
                "newAccountBalance": new_balance
            }
            
            return jsonify({
                "message": "Stock added to portfolio",
                "portfolioItem": response_data
            }), 201
            
        except Exception as e:
            logger.error(f"Error in create_portfolio_item: {str(e)}")
            return jsonify({"error": "Failed to add to portfolio", "details": str(e)}), 500
    
    @app.route("/api/portfolio/<user_id>/<stock_id>", methods=["PUT"])
    @jwt_required_with_storage(storage)
    def update_portfolio_item(user_id, stock_id):
        """Update a portfolio item (buy more or sell some)"""
        try:
            data = request.get_json()
            
            # Validate transaction type
            if "action" not in data:
                return jsonify({"error": "Action is required (buy or sell)"}), 400
            
            action = data["action"].upper()
            if action not in ["BUY", "SELL"]:
                return jsonify({"error": "Invalid action, must be 'buy' or 'sell'"}), 400
            
            # Validate quantity
            if "quantity" not in data:
                return jsonify({"error": "Quantity is required"}), 400
            
            try:
                quantity = float(data["quantity"])
            except ValueError:
                return jsonify({"error": "Invalid quantity"}), 400
            
            if quantity <= 0:
                return jsonify({"error": "Quantity must be greater than zero"}), 400
            
            # Get existing portfolio item
            portfolio_item = storage.get_portfolio_item(user_id, stock_id)
            if not portfolio_item:
                return jsonify({"error": "Stock not in portfolio"}), 404
            
            # Get stock
            stock = storage.get_stock(stock_id)
            if not stock:
                return jsonify({"error": "Stock not found"}), 404
            
            # Get user
            user = storage.get_user(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Process buy or sell
            if action == "BUY":
                # For buying, use price from request or current stock price
                price = data.get("price", stock.currentPrice)
                if price <= 0:
                    return jsonify({"error": "Price must be greater than zero"}), 400
                
                # Calculate cost
                cost = quantity * price
                
                # Check if user has enough balance
                if user.accountBalance < cost:
                    return jsonify({"error": "Insufficient account balance"}), 400
                
                # Calculate new average buy price
                total_shares = portfolio_item.quantity + quantity
                current_cost = portfolio_item.quantity * portfolio_item.averageBuyPrice
                new_cost = cost
                new_average_price = (current_cost + new_cost) / total_shares
                
                # Update portfolio item
                updated_item = storage.update_portfolio_item(
                    user_id,
                    stock_id,
                    total_shares,
                    new_average_price
                )
                
                # Update user's account balance
                new_balance = user.accountBalance - cost
                storage.update_account_balance(user_id, new_balance)
                
                # Create transaction record
                transaction_data = {
                    "userId": user_id,
                    "stockId": stock_id,
                    "type": "BUY",
                    "quantity": quantity,
                    "price": price,
                    "totalAmount": cost,
                    "status": "COMPLETED",
                    "notes": data.get("notes")
                }
                transaction = storage.create_transaction(transaction_data)
                
                # Prepare buy response
                response_data = {
                    "action": "BUY",
                    "quantity": quantity,
                    "price": price,
                    "cost": cost,
                    "newTotalShares": total_shares,
                    "newAverageBuyPrice": new_average_price,
                    "newAccountBalance": new_balance,
                    "transactionId": transaction.id
                }
                
            else:  # SELL
                # For selling, use price from request or current stock price
                price = data.get("price", stock.currentPrice)
                if price <= 0:
                    return jsonify({"error": "Price must be greater than zero"}), 400
                
                # Check if user has enough shares
                if portfolio_item.quantity < quantity:
                    return jsonify({"error": "Insufficient shares"}), 400
                
                # Calculate proceeds
                proceeds = quantity * price
                
                # Calculate profit/loss
                cost_basis = quantity * portfolio_item.averageBuyPrice
                profit_loss = proceeds - cost_basis
                
                # Calculate remaining shares
                remaining_shares = portfolio_item.quantity - quantity
                
                if remaining_shares > 0:
                    # Update portfolio item with remaining shares, keep same average price
                    updated_item = storage.update_portfolio_item(
                        user_id,
                        stock_id,
                        remaining_shares,
                        portfolio_item.averageBuyPrice
                    )
                else:
                    # If no shares left, remove from portfolio
                    storage.delete_portfolio_item(user_id, stock_id)
                    updated_item = None
                
                # Update user's account balance
                new_balance = user.accountBalance + proceeds
                storage.update_account_balance(user_id, new_balance)
                
                # Create transaction record
                transaction_data = {
                    "userId": user_id,
                    "stockId": stock_id,
                    "type": "SELL",
                    "quantity": quantity,
                    "price": price,
                    "totalAmount": proceeds,
                    "status": "COMPLETED",
                    "notes": data.get("notes")
                }
                transaction = storage.create_transaction(transaction_data)
                
                # Prepare sell response
                response_data = {
                    "action": "SELL",
                    "quantity": quantity,
                    "price": price,
                    "proceeds": proceeds,
                    "profitLoss": profit_loss,
                    "profitLossPercent": (profit_loss / cost_basis) * 100 if cost_basis > 0 else 0,
                    "remainingShares": remaining_shares,
                    "newAccountBalance": new_balance,
                    "transactionId": transaction.id
                }
            
            # Add stock info to response
            response_data["stock"] = {
                "symbol": stock.symbol,
                "name": stock.name,
                "currentPrice": stock.currentPrice
            }
            
            return jsonify({
                "message": f"Portfolio successfully updated ({action.lower()})",
                "transaction": response_data
            }), 200
            
        except Exception as e:
            logger.error(f"Error in update_portfolio_item: {str(e)}")
            return jsonify({"error": "Failed to update portfolio", "details": str(e)}), 500
    
    @app.route("/api/portfolio/<user_id>/<stock_id>", methods=["DELETE"])
    @jwt_required_with_storage(storage)
    def delete_portfolio_item(user_id, stock_id):
        """Delete a portfolio item (sell all shares)"""
        try:
            # Get portfolio item
            portfolio_item = storage.get_portfolio_item(user_id, stock_id)
            if not portfolio_item:
                return jsonify({"error": "Stock not in portfolio"}), 404
            
            # Get stock
            stock = storage.get_stock(stock_id)
            if not stock:
                return jsonify({"error": "Stock not found"}), 404
            
            # Get user
            user = storage.get_user(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Calculate proceeds (selling at current market price)
            quantity = portfolio_item.quantity
            price = stock.currentPrice
            proceeds = quantity * price
            
            # Calculate profit/loss
            cost_basis = quantity * portfolio_item.averageBuyPrice
            profit_loss = proceeds - cost_basis
            
            # Delete portfolio item
            success = storage.delete_portfolio_item(user_id, stock_id)
            
            if not success:
                return jsonify({"error": "Failed to delete portfolio item"}), 500
            
            # Update user's account balance
            new_balance = user.accountBalance + proceeds
            storage.update_account_balance(user_id, new_balance)
            
            # Create transaction record
            transaction_data = {
                "userId": user_id,
                "stockId": stock_id,
                "type": "SELL",
                "quantity": quantity,
                "price": price,
                "totalAmount": proceeds,
                "status": "COMPLETED",
                "notes": "Sold all shares"
            }
            transaction = storage.create_transaction(transaction_data)
            
            # Prepare response
            response_data = {
                "action": "SELL_ALL",
                "quantity": quantity,
                "price": price,
                "proceeds": proceeds,
                "profitLoss": profit_loss,
                "profitLossPercent": (profit_loss / cost_basis) * 100 if cost_basis > 0 else 0,
                "newAccountBalance": new_balance,
                "transactionId": transaction.id,
                "stock": {
                    "symbol": stock.symbol,
                    "name": stock.name
                }
            }
            
            return jsonify({
                "message": "Stock removed from portfolio (sold all shares)",
                "transaction": response_data
            }), 200
            
        except Exception as e:
            logger.error(f"Error in delete_portfolio_item: {str(e)}")
            return jsonify({"error": "Failed to delete portfolio item", "details": str(e)}), 500