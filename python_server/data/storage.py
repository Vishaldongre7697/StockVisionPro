from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
import json
import random
from models.schemas import User, Stock, StockHistoricalData, Watchlist, TradingStrategy
from models.schemas import Transaction, Portfolio, AiSuggestion, Notification, ChatMessage
from models.schemas import StockSentiment, SuggestionType, TransactionType, TransactionStatus, NotificationType, TimeFrame

class MemStorage:
    def __init__(self):
        # Storage maps
        self.users: Dict[int, User] = {}
        self.stocks: Dict[int, Stock] = {}
        self.stock_historical_data: Dict[int, StockHistoricalData] = {}
        self.watchlists: Dict[int, Watchlist] = {}
        self.trading_strategies: Dict[int, TradingStrategy] = {}
        self.transactions: Dict[int, Transaction] = {}
        self.portfolio_items: Dict[str, Portfolio] = {}  # key: f"{userId}:{stockId}"
        self.ai_suggestions: Dict[int, AiSuggestion] = {}
        self.notifications: Dict[int, Notification] = {}
        self.chat_messages: Dict[int, ChatMessage] = {}
        
        # ID counters
        self.user_id_counter = 1
        self.stock_id_counter = 1
        self.historical_data_id_counter = 1
        self.watchlist_id_counter = 1
        self.strategy_id_counter = 1
        self.transaction_id_counter = 1
        self.ai_suggestion_id_counter = 1
        self.notification_id_counter = 1
        self.chat_message_id_counter = 1
        
        # Initialize demo data
        self._initialize_data()
    
    def _initialize_data(self):
        # Initialize stocks
        self._initialize_stocks()
        
        # Initialize some historical data
        self._initialize_historical_data()
        
        # Create a demo user
        self.create_user({
            "username": "demo",
            "password": "password",
            "email": "demo@example.com",
            "fullName": "Demo User",
            "accountBalance": 1000000.0  # 10 Lakhs
        })
        
        # Create some AI suggestions
        for stock_id in range(1, 6):
            stock = self.get_stock(stock_id)
            if stock:
                suggestion_type = random.choice(list(SuggestionType))
                target_multiplier = 1.15 if suggestion_type == SuggestionType.BUY else 0.85
                stop_multiplier = 0.90 if suggestion_type == SuggestionType.BUY else 1.10
                
                self.create_ai_suggestion({
                    "stockId": stock_id,
                    "suggestion": suggestion_type,
                    "targetPrice": stock.currentPrice * target_multiplier,
                    "stopLoss": stock.currentPrice * stop_multiplier,
                    "confidence": random.uniform(60, 95),
                    "rationale": f"Based on technical analysis and recent market trends, this stock shows {suggestion_type.lower()} signals.",
                    "timeframe": random.choice(list(TimeFrame))
                })
    
    def _initialize_stocks(self):
        # Market indices
        self.create_stock({
            "symbol": "NIFTY",
            "name": "Nifty 50",
            "exchange": "NSE",
            "currentPrice": 22100.50,
            "previousClose": 22050.75,
            "change": 49.75,
            "changePercent": 0.23,
            "volume": 1234567890,
            "marketCap": 0,
            "sector": "Index"
        })
        
        self.create_stock({
            "symbol": "SENSEX",
            "name": "BSE Sensex",
            "exchange": "BSE",
            "currentPrice": 72300.25,
            "previousClose": 72100.50,
            "change": 199.75,
            "changePercent": 0.28,
            "volume": 987654321,
            "marketCap": 0,
            "sector": "Index"
        })
        
        # Top stocks
        self.create_stock({
            "symbol": "RELIANCE",
            "name": "Reliance Industries",
            "exchange": "NSE",
            "currentPrice": 2456.75,
            "previousClose": 2445.60,
            "change": 11.15,
            "changePercent": 0.46,
            "volume": 8765432,
            "marketCap": 16545345000000,
            "dayHigh": 2470.00,
            "dayLow": 2432.50,
            "sector": "Energy",
            "pe": 32.6,
            "eps": 75.34,
            "dividend": 1.2
        })
        
        self.create_stock({
            "symbol": "TCS",
            "name": "Tata Consultancy Services",
            "exchange": "NSE",
            "currentPrice": 3456.80,
            "previousClose": 3467.25,
            "change": -10.45,
            "changePercent": -0.30,
            "volume": 1245678,
            "marketCap": 12634567000000,
            "dayHigh": 3478.90,
            "dayLow": 3445.00,
            "sector": "Technology",
            "pe": 27.8,
            "eps": 124.35,
            "dividend": 2.8
        })
        
        self.create_stock({
            "symbol": "HDFCBANK",
            "name": "HDFC Bank",
            "exchange": "NSE",
            "currentPrice": 1578.45,
            "previousClose": 1570.30,
            "change": 8.15,
            "changePercent": 0.52,
            "volume": 5643789,
            "marketCap": 8763421000000,
            "dayHigh": 1585.00,
            "dayLow": 1565.25,
            "sector": "Finance",
            "pe": 18.9,
            "eps": 83.51,
            "dividend": 3.5
        })
        
        self.create_stock({
            "symbol": "INFY",
            "name": "Infosys",
            "exchange": "NSE",
            "currentPrice": 1482.35,
            "previousClose": 1475.60,
            "change": 6.75,
            "changePercent": 0.46,
            "volume": 3452987,
            "marketCap": 6143785000000,
            "dayHigh": 1490.00,
            "dayLow": 1472.80,
            "sector": "Technology",
            "pe": 24.6,
            "eps": 60.26,
            "dividend": 2.3
        })
        
        self.create_stock({
            "symbol": "WIPRO",
            "name": "Wipro",
            "exchange": "NSE",
            "currentPrice": 452.65,
            "previousClose": 450.80,
            "change": 1.85,
            "changePercent": 0.41,
            "volume": 2431678,
            "marketCap": 2476543000000,
            "dayHigh": 455.20,
            "dayLow": 448.90,
            "sector": "Technology",
            "pe": 19.8,
            "eps": 22.86,
            "dividend": 1.5
        })
    
    def _initialize_historical_data(self):
        """Generate some historical data for stocks"""
        now = datetime.now()
        
        # Generate data for the past 30 days for each stock
        for stock_id in range(1, self.stock_id_counter):
            stock = self.get_stock(stock_id)
            if not stock:
                continue
            
            base_price = stock.currentPrice * 0.85  # Start at 85% of current price
            volume_base = stock.volume or 1000000
            
            for i in range(30):
                # Date i days ago
                date = now - timedelta(days=29-i)
                
                # Random price fluctuation within a range
                daily_volatility = 0.02
                open_price = base_price * (1 + random.uniform(-daily_volatility, daily_volatility))
                close_price = open_price * (1 + random.uniform(-daily_volatility, daily_volatility))
                high_price = max(open_price, close_price) * (1 + random.uniform(0, daily_volatility))
                low_price = min(open_price, close_price) * (1 - random.uniform(0, daily_volatility))
                
                # Random volume
                volume = int(volume_base * random.uniform(0.7, 1.3))
                
                # Add historical data point
                self.create_historical_data_point({
                    "stockId": stock_id,
                    "date": date,
                    "open": open_price,
                    "high": high_price,
                    "low": low_price,
                    "close": close_price,
                    "volume": volume,
                    "adjustedClose": close_price
                })
                
                # Update base price for next day
                base_price = close_price
    
    # =========================================================================
    # User operations
    # =========================================================================
    def get_user(self, id: int) -> Optional[User]:
        return self.users.get(id)
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        for user in self.users.values():
            if user.username.lower() == username.lower():
                return user
        return None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        for user in self.users.values():
            if user.email.lower() == email.lower():
                return user
        return None
    
    def create_user(self, user_data: dict) -> User:
        user_id = self.user_id_counter
        self.user_id_counter += 1
        
        user = User(
            id=user_id,
            username=user_data.get("username"),
            password=user_data.get("password"),
            email=user_data.get("email"),
            fullName=user_data.get("fullName"),
            profileImage=user_data.get("profileImage"),
            phoneNumber=user_data.get("phoneNumber"),
            preferences=user_data.get("preferences", {}),
            accountBalance=user_data.get("accountBalance", 0.0),
            createdAt=datetime.now(),
            lastLoginAt=datetime.now()
        )
        
        self.users[user_id] = user
        return user
    
    def update_user(self, id: int, user_data: dict) -> Optional[User]:
        user = self.get_user(id)
        if not user:
            return None
        
        # Update fields that are provided
        for field, value in user_data.items():
            if hasattr(user, field) and field != "id":
                setattr(user, field, value)
        
        self.users[id] = user
        return user
    
    def update_last_login(self, id: int) -> Optional[User]:
        user = self.get_user(id)
        if not user:
            return None
        
        user.lastLoginAt = datetime.now()
        self.users[id] = user
        return user
    
    def update_account_balance(self, id: int, new_balance: float) -> Optional[User]:
        user = self.get_user(id)
        if not user:
            return None
        
        user.accountBalance = new_balance
        self.users[id] = user
        return user
    
    # =========================================================================
    # Stock operations
    # =========================================================================
    def get_stock(self, id: int) -> Optional[Stock]:
        return self.stocks.get(id)
    
    def get_stock_by_symbol(self, symbol: str) -> Optional[Stock]:
        for stock in self.stocks.values():
            if stock.symbol.upper() == symbol.upper():
                return stock
        return None
    
    def get_all_stocks(self) -> List[Stock]:
        return list(self.stocks.values())
    
    def get_top_stocks(self, limit: int = 10) -> List[Stock]:
        # Skip the first two stocks (market indices)
        stocks = list(self.stocks.values())[2:]
        # Sort by market cap and return top N
        return sorted(stocks, key=lambda x: x.marketCap or 0, reverse=True)[:limit]
    
    def create_stock(self, stock_data: dict) -> Stock:
        stock_id = self.stock_id_counter
        self.stock_id_counter += 1
        
        stock = Stock(
            id=stock_id,
            symbol=stock_data.get("symbol"),
            name=stock_data.get("name"),
            exchange=stock_data.get("exchange"),
            currentPrice=stock_data.get("currentPrice"),
            previousClose=stock_data.get("previousClose"),
            change=stock_data.get("change"),
            changePercent=stock_data.get("changePercent"),
            volume=stock_data.get("volume"),
            marketCap=stock_data.get("marketCap"),
            dayHigh=stock_data.get("dayHigh"),
            dayLow=stock_data.get("dayLow"),
            fiftyTwoWeekHigh=stock_data.get("fiftyTwoWeekHigh"),
            fiftyTwoWeekLow=stock_data.get("fiftyTwoWeekLow"),
            pe=stock_data.get("pe"),
            eps=stock_data.get("eps"),
            dividend=stock_data.get("dividend"),
            sector=stock_data.get("sector"),
            industry=stock_data.get("industry"),
            description=stock_data.get("description"),
            updatedAt=datetime.now()
        )
        
        self.stocks[stock_id] = stock
        return stock
    
    def update_stock_price(self, id: int, price: float, change: float, change_percent: float) -> Optional[Stock]:
        stock = self.get_stock(id)
        if not stock:
            return None
        
        stock.previousClose = stock.currentPrice
        stock.currentPrice = price
        stock.change = change
        stock.changePercent = change_percent
        stock.updatedAt = datetime.now()
        
        self.stocks[id] = stock
        return stock
    
    def update_stock(self, id: int, stock_data: dict) -> Optional[Stock]:
        stock = self.get_stock(id)
        if not stock:
            return None
        
        # Update fields that are provided
        for field, value in stock_data.items():
            if hasattr(stock, field) and field != "id":
                setattr(stock, field, value)
        
        stock.updatedAt = datetime.now()
        self.stocks[id] = stock
        return stock
    
    def get_stocks_by_trend(self, trend: str, limit: int = 10) -> List[Stock]:
        stocks = self.get_all_stocks()
        
        if trend == "up":
            # Filter stocks with positive change
            filtered = [stock for stock in stocks if stock.change and stock.change > 0]
            # Sort by change percent descending
            return sorted(filtered, key=lambda x: x.changePercent or 0, reverse=True)[:limit]
        else:  # down
            # Filter stocks with negative change
            filtered = [stock for stock in stocks if stock.change and stock.change < 0]
            # Sort by change percent ascending (most negative first)
            return sorted(filtered, key=lambda x: x.changePercent or 0)[:limit]
    
    def get_stocks_by_sector(self, sector: str) -> List[Stock]:
        return [stock for stock in self.stocks.values() if stock.sector and stock.sector.lower() == sector.lower()]
    
    # =========================================================================
    # Historical data operations
    # =========================================================================
    def get_stock_historical_data(self, stock_id: int, start_date: Optional[datetime] = None, 
                                 end_date: Optional[datetime] = None) -> List[StockHistoricalData]:
        data_points = [point for point in self.stock_historical_data.values() if point.stockId == stock_id]
        
        # Filter by date range if provided
        if start_date:
            data_points = [point for point in data_points if point.date >= start_date]
        if end_date:
            data_points = [point for point in data_points if point.date <= end_date]
        
        # Sort by date
        return sorted(data_points, key=lambda x: x.date)
    
    def create_historical_data_point(self, data: dict) -> StockHistoricalData:
        data_id = self.historical_data_id_counter
        self.historical_data_id_counter += 1
        
        data_point = StockHistoricalData(
            id=data_id,
            stockId=data.get("stockId"),
            date=data.get("date"),
            open=data.get("open"),
            high=data.get("high"),
            low=data.get("low"),
            close=data.get("close"),
            volume=data.get("volume"),
            adjustedClose=data.get("adjustedClose")
        )
        
        self.stock_historical_data[data_id] = data_point
        return data_point
    
    def bulk_insert_historical_data(self, data_points: List[dict]) -> List[StockHistoricalData]:
        result = []
        for data in data_points:
            result.append(self.create_historical_data_point(data))
        return result
    
    # =========================================================================
    # Watchlist operations
    # =========================================================================
    def get_watchlist(self, id: int) -> Optional[Watchlist]:
        return self.watchlists.get(id)
    
    def add_to_watchlist(self, watchlist_data: dict) -> Watchlist:
        watchlist_id = self.watchlist_id_counter
        self.watchlist_id_counter += 1
        
        watchlist_item = Watchlist(
            id=watchlist_id,
            userId=watchlist_data.get("userId"),
            stockId=watchlist_data.get("stockId"),
            addedAt=datetime.now(),
            alertPrice=watchlist_data.get("alertPrice"),
            alertCondition=watchlist_data.get("alertCondition")
        )
        
        self.watchlists[watchlist_id] = watchlist_item
        return watchlist_item
    
    def remove_from_watchlist(self, user_id: int, stock_id: int) -> bool:
        # Find the watchlist item by user and stock
        watchlist_id = None
        for id, item in self.watchlists.items():
            if item.userId == user_id and item.stockId == stock_id:
                watchlist_id = id
                break
        
        # Remove if found
        if watchlist_id:
            del self.watchlists[watchlist_id]
            return True
        return False
    
    def get_user_watchlist(self, user_id: int) -> List[Stock]:
        # Get all watchlist items for the user
        watchlist_items = [item for item in self.watchlists.values() if item.userId == user_id]
        
        # Get the stocks for those items
        stocks = []
        for item in watchlist_items:
            stock = self.get_stock(item.stockId)
            if stock:
                stocks.append(stock)
        
        return stocks
    
    def get_user_watchlist_items(self, user_id: int) -> List[Watchlist]:
        return [item for item in self.watchlists.values() if item.userId == user_id]
    
    def is_stock_in_watchlist(self, user_id: int, stock_id: int) -> bool:
        for item in self.watchlists.values():
            if item.userId == user_id and item.stockId == stock_id:
                return True
        return False
    
    def update_watchlist_alert(self, id: int, alert_price: Optional[float] = None, 
                              alert_condition: Optional[str] = None) -> Optional[Watchlist]:
        watchlist_item = self.get_watchlist(id)
        if not watchlist_item:
            return None
        
        if alert_price is not None:
            watchlist_item.alertPrice = alert_price
        if alert_condition is not None:
            watchlist_item.alertCondition = alert_condition
        
        self.watchlists[id] = watchlist_item
        return watchlist_item
    
    # =========================================================================
    # Trading Strategy operations
    # =========================================================================
    def get_strategy(self, id: int) -> Optional[TradingStrategy]:
        return self.trading_strategies.get(id)
    
    def get_user_strategies(self, user_id: int) -> List[TradingStrategy]:
        return [strategy for strategy in self.trading_strategies.values() if strategy.userId == user_id]
    
    def create_strategy(self, strategy_data: dict) -> TradingStrategy:
        strategy_id = self.strategy_id_counter
        self.strategy_id_counter += 1
        
        strategy = TradingStrategy(
            id=strategy_id,
            userId=strategy_data.get("userId"),
            name=strategy_data.get("name"),
            description=strategy_data.get("description"),
            conditions=strategy_data.get("conditions", {}),
            actions=strategy_data.get("actions", {}),
            isActive=strategy_data.get("isActive", False),
            backtestResults=strategy_data.get("backtestResults", {}),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        self.trading_strategies[strategy_id] = strategy
        return strategy
    
    def update_strategy(self, id: int, strategy_data: dict) -> Optional[TradingStrategy]:
        strategy = self.get_strategy(id)
        if not strategy:
            return None
        
        # Update fields that are provided
        for field, value in strategy_data.items():
            if hasattr(strategy, field) and field != "id":
                setattr(strategy, field, value)
        
        strategy.updatedAt = datetime.now()
        self.trading_strategies[id] = strategy
        return strategy
    
    def delete_strategy(self, id: int) -> bool:
        if id in self.trading_strategies:
            del self.trading_strategies[id]
            return True
        return False
    
    def toggle_strategy_status(self, id: int, is_active: bool) -> Optional[TradingStrategy]:
        strategy = self.get_strategy(id)
        if not strategy:
            return None
        
        strategy.isActive = is_active
        strategy.updatedAt = datetime.now()
        self.trading_strategies[id] = strategy
        return strategy
    
    def get_active_strategies(self) -> List[TradingStrategy]:
        return [strategy for strategy in self.trading_strategies.values() if strategy.isActive]
    
    # =========================================================================
    # Transaction operations
    # =========================================================================
    def get_transaction(self, id: int) -> Optional[Transaction]:
        return self.transactions.get(id)
    
    def get_user_transactions(self, user_id: int, limit: Optional[int] = None) -> List[Transaction]:
        transactions = [tx for tx in self.transactions.values() if tx.userId == user_id]
        
        # Sort by creation date, newest first
        transactions = sorted(transactions, key=lambda x: x.createdAt, reverse=True)
        
        # Apply limit if provided
        if limit:
            transactions = transactions[:limit]
        
        return transactions
    
    def create_transaction(self, transaction_data: dict) -> Transaction:
        transaction_id = self.transaction_id_counter
        self.transaction_id_counter += 1
        
        transaction = Transaction(
            id=transaction_id,
            userId=transaction_data.get("userId"),
            stockId=transaction_data.get("stockId"),
            type=transaction_data.get("type"),
            quantity=transaction_data.get("quantity"),
            price=transaction_data.get("price"),
            totalAmount=transaction_data.get("totalAmount"),
            status=transaction_data.get("status"),
            strategyId=transaction_data.get("strategyId"),
            createdAt=datetime.now(),
            completedAt=datetime.now() if transaction_data.get("status") == TransactionStatus.COMPLETED else None
        )
        
        self.transactions[transaction_id] = transaction
        return transaction
    
    def update_transaction_status(self, id: int, status: str, 
                                 completed_at: Optional[datetime] = None) -> Optional[Transaction]:
        transaction = self.get_transaction(id)
        if not transaction:
            return None
        
        transaction.status = status
        if status == TransactionStatus.COMPLETED:
            transaction.completedAt = completed_at or datetime.now()
        
        self.transactions[id] = transaction
        return transaction
    
    def get_transactions_by_strategy(self, strategy_id: int) -> List[Transaction]:
        return [tx for tx in self.transactions.values() if tx.strategyId == strategy_id]
    
    def get_transactions_by_stock(self, stock_id: int, user_id: Optional[int] = None) -> List[Transaction]:
        transactions = [tx for tx in self.transactions.values() if tx.stockId == stock_id]
        
        if user_id:
            transactions = [tx for tx in transactions if tx.userId == user_id]
        
        return transactions
    
    # =========================================================================
    # Portfolio operations
    # =========================================================================
    def get_portfolio_item(self, user_id: int, stock_id: int) -> Optional[Portfolio]:
        key = f"{user_id}:{stock_id}"
        return self.portfolio_items.get(key)
    
    def get_user_portfolio(self, user_id: int) -> List[Portfolio]:
        return [item for key, item in self.portfolio_items.items() if key.startswith(f"{user_id}:")]
    
    def create_portfolio_item(self, portfolio_data: dict) -> Portfolio:
        user_id = portfolio_data.get("userId")
        stock_id = portfolio_data.get("stockId")
        key = f"{user_id}:{stock_id}"
        
        # Check if portfolio item already exists
        existing_item = self.get_portfolio_item(user_id, stock_id)
        if existing_item:
            # Update existing item
            total_investment = (existing_item.quantity * existing_item.averageBuyPrice) + \
                              (portfolio_data.get("quantity") * portfolio_data.get("averageBuyPrice"))
            total_quantity = existing_item.quantity + portfolio_data.get("quantity")
            new_avg_price = total_investment / total_quantity if total_quantity > 0 else 0
            
            existing_item.quantity = total_quantity
            existing_item.averageBuyPrice = new_avg_price
            existing_item.updatedAt = datetime.now()
            
            self.portfolio_items[key] = existing_item
            return existing_item
        
        # Create new portfolio item
        portfolio_item = Portfolio(
            userId=user_id,
            stockId=stock_id,
            quantity=portfolio_data.get("quantity"),
            averageBuyPrice=portfolio_data.get("averageBuyPrice"),
            updatedAt=datetime.now()
        )
        
        self.portfolio_items[key] = portfolio_item
        return portfolio_item
    
    def update_portfolio_item(self, user_id: int, stock_id: int, quantity: float, 
                             average_buy_price: Optional[float] = None) -> Optional[Portfolio]:
        key = f"{user_id}:{stock_id}"
        portfolio_item = self.portfolio_items.get(key)
        
        if not portfolio_item:
            return None
        
        portfolio_item.quantity = quantity
        if average_buy_price is not None:
            portfolio_item.averageBuyPrice = average_buy_price
        
        portfolio_item.updatedAt = datetime.now()
        self.portfolio_items[key] = portfolio_item
        return portfolio_item
    
    def delete_portfolio_item(self, user_id: int, stock_id: int) -> bool:
        key = f"{user_id}:{stock_id}"
        if key in self.portfolio_items:
            del self.portfolio_items[key]
            return True
        return False
    
    def get_portfolio_value(self, user_id: int) -> dict:
        portfolio = self.get_user_portfolio(user_id)
        total_value = 0.0
        total_investment = 0.0
        
        for item in portfolio:
            stock = self.get_stock(item.stockId)
            if stock:
                item_current_value = stock.currentPrice * item.quantity
                item_investment = item.averageBuyPrice * item.quantity
                
                total_value += item_current_value
                total_investment += item_investment
        
        total_profit = total_value - total_investment
        
        return {
            "totalValue": total_value,
            "totalInvestment": total_investment,
            "totalProfit": total_profit
        }
    
    # =========================================================================
    # AI Suggestions operations
    # =========================================================================
    def get_ai_suggestion(self, id: int) -> Optional[AiSuggestion]:
        return self.ai_suggestions.get(id)
    
    def get_stock_ai_suggestion(self, stock_id: int) -> Optional[AiSuggestion]:
        # Get newest suggestion for this stock
        suggestions = [s for s in self.ai_suggestions.values() if s.stockId == stock_id]
        if not suggestions:
            return None
        
        # Sort by creation date, newest first
        return sorted(suggestions, key=lambda x: x.createdAt, reverse=True)[0]
    
    def get_all_ai_suggestions(self) -> List[AiSuggestion]:
        return list(self.ai_suggestions.values())
    
    def get_top_ai_suggestions(self, limit: int = 5) -> List[AiSuggestion]:
        # Get all suggestions and sort by confidence
        suggestions = list(self.ai_suggestions.values())
        suggestions = [s for s in suggestions if s.confidence]
        return sorted(suggestions, key=lambda x: x.confidence or 0, reverse=True)[:limit]
    
    def create_ai_suggestion(self, suggestion_data: dict) -> AiSuggestion:
        suggestion_id = self.ai_suggestion_id_counter
        self.ai_suggestion_id_counter += 1
        
        # Default expiry is 7 days from now
        expires_at = suggestion_data.get("expiresAt", datetime.now() + timedelta(days=7))
        
        suggestion = AiSuggestion(
            id=suggestion_id,
            stockId=suggestion_data.get("stockId"),
            suggestion=suggestion_data.get("suggestion"),
            targetPrice=suggestion_data.get("targetPrice"),
            stopLoss=suggestion_data.get("stopLoss"),
            confidence=suggestion_data.get("confidence"),
            rationale=suggestion_data.get("rationale"),
            timeframe=suggestion_data.get("timeframe"),
            createdAt=datetime.now(),
            expiresAt=expires_at
        )
        
        self.ai_suggestions[suggestion_id] = suggestion
        return suggestion
    
    def get_suggestions_by_type(self, suggestion_type: str, limit: Optional[int] = None) -> List[AiSuggestion]:
        suggestions = [s for s in self.ai_suggestions.values() if s.suggestion == suggestion_type]
        
        # Sort by confidence, highest first
        suggestions = sorted(suggestions, key=lambda x: x.confidence or 0, reverse=True)
        
        # Apply limit if provided
        if limit:
            suggestions = suggestions[:limit]
        
        return suggestions
    
    def get_suggestions_by_timeframe(self, timeframe: str, limit: Optional[int] = None) -> List[AiSuggestion]:
        suggestions = [s for s in self.ai_suggestions.values() if s.timeframe == timeframe]
        
        # Sort by confidence, highest first
        suggestions = sorted(suggestions, key=lambda x: x.confidence or 0, reverse=True)
        
        # Apply limit if provided
        if limit:
            suggestions = suggestions[:limit]
        
        return suggestions
    
    # =========================================================================
    # Notification operations
    # =========================================================================
    def get_notification(self, id: int) -> Optional[Notification]:
        return self.notifications.get(id)
    
    def get_user_notifications(self, user_id: int, limit: Optional[int] = None, 
                              only_unread: bool = False) -> List[Notification]:
        notifications = [n for n in self.notifications.values() if n.userId == user_id]
        
        # Filter unread if requested
        if only_unread:
            notifications = [n for n in notifications if not n.isRead]
        
        # Sort by creation date, newest first
        notifications = sorted(notifications, key=lambda x: x.createdAt, reverse=True)
        
        # Apply limit if provided
        if limit:
            notifications = notifications[:limit]
        
        return notifications
    
    def create_notification(self, notification_data: dict) -> Notification:
        notification_id = self.notification_id_counter
        self.notification_id_counter += 1
        
        notification = Notification(
            id=notification_id,
            userId=notification_data.get("userId"),
            type=notification_data.get("type"),
            title=notification_data.get("title"),
            message=notification_data.get("message"),
            isRead=notification_data.get("isRead", False),
            relatedEntityType=notification_data.get("relatedEntityType"),
            relatedEntityId=notification_data.get("relatedEntityId"),
            createdAt=datetime.now()
        )
        
        self.notifications[notification_id] = notification
        return notification
    
    def mark_notification_as_read(self, id: int) -> Optional[Notification]:
        notification = self.get_notification(id)
        if not notification:
            return None
        
        notification.isRead = True
        self.notifications[id] = notification
        return notification
    
    def mark_all_notifications_as_read(self, user_id: int) -> int:
        count = 0
        for id, notification in list(self.notifications.items()):
            if notification.userId == user_id and not notification.isRead:
                notification.isRead = True
                self.notifications[id] = notification
                count += 1
        
        return count
    
    def delete_notification(self, id: int) -> bool:
        if id in self.notifications:
            del self.notifications[id]
            return True
        return False
    
    # =========================================================================
    # Chat Message operations
    # =========================================================================
    def get_chat_messages(self, user_id: int, limit: Optional[int] = None) -> List[ChatMessage]:
        messages = [m for m in self.chat_messages.values() if m.userId == user_id]
        
        # Sort by creation date
        messages = sorted(messages, key=lambda x: x.createdAt)
        
        # Apply limit if provided
        if limit:
            messages = messages[-limit:]  # Get the most recent messages
        
        return messages
    
    def save_chat_message(self, message_data: dict) -> ChatMessage:
        message_id = self.chat_message_id_counter
        self.chat_message_id_counter += 1
        
        chat_message = ChatMessage(
            id=message_id,
            userId=message_data.get("userId"),
            sender=message_data.get("sender"),
            message=message_data.get("message"),
            context=message_data.get("context", {}),
            createdAt=datetime.now()
        )
        
        self.chat_messages[message_id] = chat_message
        return chat_message
    
    def clear_chat_history(self, user_id: int) -> bool:
        # Find all messages for the user
        message_ids = [id for id, message in self.chat_messages.items() if message.userId == user_id]
        
        # Delete all found messages
        for id in message_ids:
            del self.chat_messages[id]
        
        return True