"""
Trading Strategy routes for StockVisionPro API
"""

from flask import request, jsonify
import logging
import json

from . import strategy_bp
from data.storage import MemStorage
from utils.auth_helper import auth_required

# Initialize logger and storage
logger = logging.getLogger(__name__)
storage = MemStorage()

@strategy_bp.route("/<int:user_id>", methods=["GET"])
@auth_required()
def get_user_strategies(current_user_id, user_id):
    """Get a user's trading strategies"""
    try:
        # Verify authorization
        if current_user_id != user_id:
            return jsonify({"message": "Unauthorized to view these strategies"}), 403
        
        # Get strategies
        strategies = storage.get_user_strategies(user_id)
        
        # Process strategies
        strategy_list = [strategy.model_dump() for strategy in strategies]
        
        return jsonify(strategy_list), 200
    
    except Exception as e:
        logger.error(f"Error retrieving strategies for user {user_id}: {str(e)}")
        return jsonify({"message": f"Failed to retrieve strategies: {str(e)}"}), 500

@strategy_bp.route("", methods=["POST"])
@auth_required()
def create_strategy(current_user_id):
    """Create a new trading strategy"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["userId", "name", "conditions"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"message": f"Missing required field: {field}"}), 400
        
        # Verify authorization
        if data.get("userId") != current_user_id:
            return jsonify({"message": "Unauthorized to create strategy for this user"}), 403
        
        # Validate conditions format
        try:
            if isinstance(data.get("conditions"), str):
                json.loads(data.get("conditions"))
            elif not isinstance(data.get("conditions"), (dict, list)):
                return jsonify({"message": "Conditions must be a valid JSON object or string"}), 400
        except json.JSONDecodeError:
            return jsonify({"message": "Conditions must be a valid JSON object or string"}), 400
        
        # Create strategy
        strategy = storage.create_strategy({
            "userId": data.get("userId"),
            "name": data.get("name"),
            "description": data.get("description", ""),
            "conditions": data.get("conditions"),
            "actions": data.get("actions", []),
            "isActive": data.get("isActive", False),
            "backtestResults": data.get("backtestResults", {})
        })
        
        logger.info(f"Trading strategy created: {strategy.name}")
        
        return jsonify(strategy.model_dump()), 201
    
    except Exception as e:
        logger.error(f"Error creating strategy: {str(e)}")
        return jsonify({"message": f"Failed to create strategy: {str(e)}"}), 500

@strategy_bp.route("/<int:strategy_id>", methods=["GET"])
@auth_required()
def get_strategy(current_user_id, strategy_id):
    """Get a specific trading strategy"""
    try:
        # Get strategy
        strategy = storage.get_strategy(strategy_id)
        
        if not strategy:
            return jsonify({"message": "Trading strategy not found"}), 404
        
        # Verify authorization
        if strategy.userId != current_user_id:
            return jsonify({"message": "Unauthorized to view this strategy"}), 403
        
        return jsonify(strategy.model_dump()), 200
    
    except Exception as e:
        logger.error(f"Error retrieving strategy {strategy_id}: {str(e)}")
        return jsonify({"message": f"Failed to retrieve strategy: {str(e)}"}), 500

@strategy_bp.route("/<int:strategy_id>", methods=["PUT"])
@auth_required()
def update_strategy(current_user_id, strategy_id):
    """Update a trading strategy"""
    try:
        data = request.get_json()
        
        # Get existing strategy
        strategy = storage.get_strategy(strategy_id)
        
        if not strategy:
            return jsonify({"message": "Trading strategy not found"}), 404
        
        # Verify authorization
        if strategy.userId != current_user_id:
            return jsonify({"message": "Unauthorized to update this strategy"}), 403
        
        # Validate conditions format if provided
        if "conditions" in data:
            try:
                if isinstance(data.get("conditions"), str):
                    json.loads(data.get("conditions"))
                elif not isinstance(data.get("conditions"), (dict, list)):
                    return jsonify({"message": "Conditions must be a valid JSON object or string"}), 400
            except json.JSONDecodeError:
                return jsonify({"message": "Conditions must be a valid JSON object or string"}), 400
        
        # Update strategy
        updated_strategy = storage.update_strategy(strategy_id, {
            "name": data.get("name", strategy.name),
            "description": data.get("description", strategy.description),
            "conditions": data.get("conditions", strategy.conditions),
            "actions": data.get("actions", strategy.actions),
            "isActive": data.get("isActive", strategy.isActive),
            "backtestResults": data.get("backtestResults", strategy.backtestResults)
        })
        
        logger.info(f"Trading strategy updated: {updated_strategy.name}")
        
        return jsonify(updated_strategy.model_dump()), 200
    
    except Exception as e:
        logger.error(f"Error updating strategy {strategy_id}: {str(e)}")
        return jsonify({"message": f"Failed to update strategy: {str(e)}"}), 500

@strategy_bp.route("/<int:strategy_id>", methods=["DELETE"])
@auth_required()
def delete_strategy(current_user_id, strategy_id):
    """Delete a trading strategy"""
    try:
        # Get existing strategy
        strategy = storage.get_strategy(strategy_id)
        
        if not strategy:
            return jsonify({"message": "Trading strategy not found"}), 404
        
        # Verify authorization
        if strategy.userId != current_user_id:
            return jsonify({"message": "Unauthorized to delete this strategy"}), 403
        
        # Delete strategy
        success = storage.delete_strategy(strategy_id)
        
        if not success:
            return jsonify({"message": "Failed to delete strategy"}), 500
        
        logger.info(f"Trading strategy deleted: {strategy.name}")
        
        return jsonify({"message": "Strategy deleted successfully"}), 200
    
    except Exception as e:
        logger.error(f"Error deleting strategy {strategy_id}: {str(e)}")
        return jsonify({"message": f"Failed to delete strategy: {str(e)}"}), 500

@strategy_bp.route("/<int:strategy_id>/toggle", methods=["PUT"])
@auth_required()
def toggle_strategy(current_user_id, strategy_id):
    """Enable or disable a trading strategy"""
    try:
        # Get existing strategy
        strategy = storage.get_strategy(strategy_id)
        
        if not strategy:
            return jsonify({"message": "Trading strategy not found"}), 404
        
        # Verify authorization
        if strategy.userId != current_user_id:
            return jsonify({"message": "Unauthorized to modify this strategy"}), 403
        
        # Toggle active status
        new_status = not strategy.isActive
        
        # Update strategy
        updated_strategy = storage.update_strategy(strategy_id, {
            "isActive": new_status
        })
        
        status_text = "enabled" if new_status else "disabled"
        logger.info(f"Trading strategy {updated_strategy.name} {status_text}")
        
        return jsonify({
            "strategy": updated_strategy.model_dump(),
            "message": f"Strategy {status_text} successfully"
        }), 200
    
    except Exception as e:
        logger.error(f"Error toggling strategy {strategy_id}: {str(e)}")
        return jsonify({"message": f"Failed to toggle strategy: {str(e)}"}), 500

@strategy_bp.route("/<int:strategy_id>/backtest", methods=["POST"])
@auth_required()
def backtest_strategy(current_user_id, strategy_id):
    """Run a backtest on a trading strategy"""
    try:
        data = request.get_json()
        
        # Get existing strategy
        strategy = storage.get_strategy(strategy_id)
        
        if not strategy:
            return jsonify({"message": "Trading strategy not found"}), 404
        
        # Verify authorization
        if strategy.userId != current_user_id:
            return jsonify({"message": "Unauthorized to backtest this strategy"}), 403
        
        # Get backtest parameters
        start_date = data.get("startDate")
        end_date = data.get("endDate")
        initial_capital = data.get("initialCapital", 10000)
        
        if not start_date or not end_date:
            return jsonify({"message": "Start date and end date are required"}), 400
        
        # In a real implementation, this would run an actual backtest
        # Here we simulate a backtest result
        backtest_results = {
            "startDate": start_date,
            "endDate": end_date,
            "initialCapital": initial_capital,
            "finalCapital": initial_capital * 1.25,
            "totalReturn": 25,
            "annualizedReturn": 12.5,
            "maxDrawdown": 8.2,
            "sharpeRatio": 1.35,
            "trades": 15,
            "winRate": 60,
            "returnHistory": [
                {"date": "2023-01-01", "equity": initial_capital},
                {"date": "2023-04-01", "equity": initial_capital * 1.08},
                {"date": "2023-07-01", "equity": initial_capital * 1.15},
                {"date": "2023-10-01", "equity": initial_capital * 1.20},
                {"date": "2024-01-01", "equity": initial_capital * 1.25}
            ]
        }
        
        # Update strategy with backtest results
        updated_strategy = storage.update_strategy(strategy_id, {
            "backtestResults": backtest_results
        })
        
        logger.info(f"Backtest completed for strategy: {strategy.name}")
        
        return jsonify({
            "strategy": updated_strategy.model_dump(),
            "backtestResults": backtest_results
        }), 200
    
    except Exception as e:
        logger.error(f"Error backtesting strategy {strategy_id}: {str(e)}")
        return jsonify({"message": f"Failed to backtest strategy: {str(e)}"}), 500