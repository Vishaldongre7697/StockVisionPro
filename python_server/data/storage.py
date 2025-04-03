"""
In-memory storage implementation for StockVisionPro API
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Union

from models.schemas import (
    User, Stock, AIRecommendation, HistoricalData, 
    Watchlist, Portfolio, Strategy, Transaction, 
    Notification, ChatMessage
)

# Configure logger
logger = logging.getLogger(__name__)


class MemStorage:
    """In-memory storage implementation for StockVisionPro API"""
    
    def __init__(self):
        """Initialize storage with empty collections"""
        # Main data collections
        self.users: List[User] = []
        self.stocks: List[Stock] = []
        self.ai_recommendations: List[AIRecommendation] = []
        self.historical_data: List[HistoricalData] = []
        self.watchlists: List[Watchlist] = []
        self.portfolios: List[Portfolio] = []
        self.strategies: List[Strategy] = []
        self.transactions: List[Transaction] = []
        self.notifications: List[Notification] = []
        self.chat_messages: List[ChatMessage] = []
        
        # Initialize with sample data
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        """Initialize with sample data for development"""
        # Sample users
        self.users = [
            User(
                id="user1",
                username="johnsmith",
                email="john@example.com",
                password="$2b$12$4Hl8/4.AAd8HlsOiCHRfJuDG3g5qLJgR3l8x9ePXxetBYVuqKPHSK",  # hashed "password123"
                fullName="John Smith",
                accountBalance=10000.0
            ),
            User(
                id="user2",
                username="janesmith",
                email="jane@example.com",
                password="$2b$12$4Hl8/4.AAd8HlsOiCHRfJuDG3g5qLJgR3l8x9ePXxetBYVuqKPHSK",  # hashed "password123"
                fullName="Jane Smith",
                accountBalance=15000.0
            )
        ]
        
        # Sample stocks
        self.stocks = [
            Stock(
                id="stock1",
                symbol="AAPL",
                name="Apple Inc.",
                currentPrice=170.50,
                dailyChange=1.75,
                dailyChangePercent=1.04,
                open=168.75,
                high=171.25,
                low=168.50,
                previousClose=168.75,
                volume=75000000,
                marketCap=2800000000000,
                peRatio=27.5,
                dividendYield=0.56,
                sector="Technology",
                exchange="NASDAQ",
                description="Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
            ),
            Stock(
                id="stock2",
                symbol="MSFT",
                name="Microsoft Corporation",
                currentPrice=320.10,
                dailyChange=-2.30,
                dailyChangePercent=-0.71,
                open=322.40,
                high=323.15,
                low=319.80,
                previousClose=322.40,
                volume=25000000,
                marketCap=2400000000000,
                peRatio=34.2,
                dividendYield=0.75,
                sector="Technology",
                exchange="NASDAQ",
                description="Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide."
            ),
            Stock(
                id="stock3",
                symbol="GOOGL",
                name="Alphabet Inc.",
                currentPrice=142.50,
                dailyChange=0.75,
                dailyChangePercent=0.53,
                open=141.75,
                high=143.00,
                low=141.50,
                previousClose=141.75,
                volume=18000000,
                marketCap=1900000000000,
                peRatio=25.6,
                dividendYield=None,
                sector="Technology",
                exchange="NASDAQ",
                description="Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America."
            ),
            Stock(
                id="stock4",
                symbol="AMZN",
                name="Amazon.com, Inc.",
                currentPrice=175.25,
                dailyChange=3.45,
                dailyChangePercent=2.01,
                open=171.80,
                high=176.20,
                low=171.50,
                previousClose=171.80,
                volume=30000000,
                marketCap=1800000000000,
                peRatio=62.8,
                dividendYield=None,
                sector="Consumer Cyclical",
                exchange="NASDAQ",
                description="Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally."
            ),
            Stock(
                id="stock5",
                symbol="TSLA",
                name="Tesla, Inc.",
                currentPrice=240.75,
                dailyChange=-4.25,
                dailyChangePercent=-1.73,
                open=245.00,
                high=247.50,
                low=240.00,
                previousClose=245.00,
                volume=80000000,
                marketCap=780000000000,
                peRatio=69.7,
                dividendYield=None,
                sector="Automotive",
                exchange="NASDAQ",
                description="Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems."
            )
        ]
        
        # Sample AI recommendations
        self.ai_recommendations = [
            AIRecommendation(
                id="rec1",
                stockId="stock1",
                type="BUY",
                confidence=85.5,
                sentiment="BULLISH",
                priceTarget=190.00,
                timeFrame="MEDIUM_TERM",
                analysis="Apple's strong product lineup and services growth suggest continued momentum."
            ),
            AIRecommendation(
                id="rec2",
                stockId="stock2",
                type="HOLD",
                confidence=65.0,
                sentiment="NEUTRAL",
                priceTarget=325.00,
                timeFrame="SHORT_TERM",
                analysis="Microsoft is fairly valued at current levels, but cloud business remains strong."
            ),
            AIRecommendation(
                id="rec3",
                stockId="stock3",
                type="BUY",
                confidence=78.5,
                sentiment="BULLISH",
                priceTarget=155.00,
                timeFrame="LONG_TERM",
                analysis="Google's ad business is resilient and AI investments will drive future growth."
            ),
            AIRecommendation(
                id="rec4",
                stockId="stock4",
                type="BUY",
                confidence=82.0,
                sentiment="BULLISH",
                priceTarget=195.00,
                timeFrame="MEDIUM_TERM",
                analysis="Amazon's e-commerce and AWS growth continue to exceed expectations."
            ),
            AIRecommendation(
                id="rec5",
                stockId="stock5",
                type="SELL",
                confidence=70.5,
                sentiment="BEARISH",
                priceTarget=210.00,
                timeFrame="SHORT_TERM",
                analysis="Tesla faces increasing competition and margins are under pressure."
            )
        ]
        
        # Sample historical data (abbreviated)
        self.historical_data = [
            # Apple historical data (just 3 days as examples)
            HistoricalData(
                id=f"hist1-{uuid.uuid4()}",
                stockId="stock1",
                date=datetime(2025, 4, 1),
                open=168.00,
                high=170.50,
                low=167.80,
                close=170.50,
                volume=75000000
            ),
            HistoricalData(
                id=f"hist1-{uuid.uuid4()}",
                stockId="stock1",
                date=datetime(2025, 3, 31),
                open=167.50,
                high=169.20,
                low=167.30,
                close=168.75,
                volume=68000000
            ),
            HistoricalData(
                id=f"hist1-{uuid.uuid4()}",
                stockId="stock1",
                date=datetime(2025, 3, 30),
                open=166.80,
                high=168.10,
                low=166.50,
                close=167.50,
                volume=62000000
            ),
            
            # Microsoft historical data (just 3 days as examples)
            HistoricalData(
                id=f"hist2-{uuid.uuid4()}",
                stockId="stock2",
                date=datetime(2025, 4, 1),
                open=322.40,
                high=323.15,
                low=319.80,
                close=320.10,
                volume=25000000
            ),
            HistoricalData(
                id=f"hist2-{uuid.uuid4()}",
                stockId="stock2",
                date=datetime(2025, 3, 31),
                open=321.75,
                high=324.20,
                low=321.50,
                close=322.40,
                volume=22000000
            ),
            HistoricalData(
                id=f"hist2-{uuid.uuid4()}",
                stockId="stock2",
                date=datetime(2025, 3, 30),
                open=320.80,
                high=322.50,
                low=320.60,
                close=321.75,
                volume=20000000
            )
        ]
        
        # Sample watchlists
        self.watchlists = [
            Watchlist(
                id="watch1",
                userId="user1",
                stockId="stock1",
                alertPrice=180.00,
                alertCondition="ABOVE"
            ),
            Watchlist(
                id="watch2",
                userId="user1",
                stockId="stock3",
                alertPrice=135.00,
                alertCondition="BELOW"
            ),
            Watchlist(
                id="watch3",
                userId="user2",
                stockId="stock4",
                alertPrice=200.00,
                alertCondition="ABOVE"
            ),
            Watchlist(
                id="watch4",
                userId="user2",
                stockId="stock5",
                alertPrice=220.00,
                alertCondition="BELOW"
            )
        ]
        
        # Sample portfolios
        self.portfolios = [
            Portfolio(
                id="port1",
                userId="user1",
                stockId="stock1",
                quantity=10,
                averageBuyPrice=165.75
            ),
            Portfolio(
                id="port2",
                userId="user1",
                stockId="stock4",
                quantity=5,
                averageBuyPrice=170.50
            ),
            Portfolio(
                id="port3",
                userId="user2",
                stockId="stock2",
                quantity=8,
                averageBuyPrice=315.25
            ),
            Portfolio(
                id="port4",
                userId="user2",
                stockId="stock3",
                quantity=15,
                averageBuyPrice=140.80
            )
        ]
        
        # Sample strategies
        self.strategies = [
            Strategy(
                id="strat1",
                userId="user1",
                name="Tech Growth Strategy",
                description="Focus on high-growth tech stocks with strong momentum",
                indicators=[
                    {"type": "SMA", "period": 50},
                    {"type": "RSI", "period": 14, "overbought": 70, "oversold": 30}
                ],
                entryConditions=[
                    {"indicator": "SMA", "condition": "PRICE_ABOVE_SMA"},
                    {"indicator": "RSI", "condition": "RSI_ABOVE", "value": 50}
                ],
                exitConditions=[
                    {"indicator": "TRAILING_STOP", "value": 10},
                    {"indicator": "RSI", "condition": "RSI_ABOVE", "value": 75}
                ],
                riskManagement={
                    "maxPositionSize": 5,
                    "stopLossPercent": 5
                },
                status="ACTIVE",
                targetStocks=["stock1", "stock2", "stock3", "stock4"]
            ),
            Strategy(
                id="strat2",
                userId="user2",
                name="Value Investing",
                description="Focus on undervalued stocks with strong fundamentals",
                indicators=[
                    {"type": "PE_RATIO", "maxValue": 20},
                    {"type": "DIVIDEND_YIELD", "minValue": 1.5}
                ],
                entryConditions=[
                    {"indicator": "PE_RATIO", "condition": "BELOW", "value": 15},
                    {"indicator": "PRICE_TO_BOOK", "condition": "BELOW", "value": 2.5}
                ],
                exitConditions=[
                    {"indicator": "PRICE_TARGET", "condition": "REACHED", "value": 20},
                    {"indicator": "TRAILING_STOP", "value": 15}
                ],
                riskManagement={
                    "maxPositionSize": 10,
                    "stopLossPercent": 10
                },
                status="INACTIVE",
                targetStocks=["stock5"]
            )
        ]
        
        # Sample transactions
        self.transactions = [
            Transaction(
                id="trans1",
                userId="user1",
                stockId="stock1",
                type="BUY",
                quantity=10,
                price=165.75,
                totalAmount=1657.50,
                status="COMPLETED",
                createdAt=datetime(2025, 3, 20),
                completedAt=datetime(2025, 3, 20)
            ),
            Transaction(
                id="trans2",
                userId="user1",
                stockId="stock4",
                type="BUY",
                quantity=5,
                price=170.50,
                totalAmount=852.50,
                status="COMPLETED",
                createdAt=datetime(2025, 3, 22),
                completedAt=datetime(2025, 3, 22)
            ),
            Transaction(
                id="trans3",
                userId="user2",
                stockId="stock2",
                type="BUY",
                quantity=8,
                price=315.25,
                totalAmount=2522.00,
                status="COMPLETED",
                createdAt=datetime(2025, 3, 18),
                completedAt=datetime(2025, 3, 18)
            ),
            Transaction(
                id="trans4",
                userId="user2",
                stockId="stock3",
                type="BUY",
                quantity=15,
                price=140.80,
                totalAmount=2112.00,
                status="COMPLETED",
                createdAt=datetime(2025, 3, 25),
                completedAt=datetime(2025, 3, 25)
            )
        ]
        
        # Sample notifications
        self.notifications = [
            Notification(
                id="notif1",
                userId="user1",
                title="Price Alert",
                message="Apple Inc. (AAPL) has reached your alert price of $170.00",
                type="ALERT",
                relatedEntityId="stock1",
                createdAt=datetime(2025, 4, 1)
            ),
            Notification(
                id="notif2",
                userId="user1",
                title="Strategy Alert",
                message="Your 'Tech Growth Strategy' has triggered a buy signal for Google (GOOGL)",
                type="STRATEGY",
                relatedEntityId="strat1",
                createdAt=datetime(2025, 4, 1)
            ),
            Notification(
                id="notif3",
                userId="user2",
                title="Price Alert",
                message="Tesla Inc. (TSLA) has dropped below your alert price of $245.00",
                type="ALERT",
                relatedEntityId="stock5",
                createdAt=datetime(2025, 4, 1)
            )
        ]
        
        # Sample chat messages
        self.chat_messages = [
            ChatMessage(
                id="chat1",
                userId="user1",
                message="What are the best tech stocks to invest in right now?",
                response="Based on current market analysis, the most promising tech stocks include AAPL, MSFT, and GOOGL due to their strong financial positions, growth prospects, and AI initiatives. Consider reviewing their latest earnings reports and industry trends before making investment decisions.",
                context={
                    "sector": "Technology",
                    "risk_profile": "Moderate"
                },
                createdAt=datetime(2025, 3, 30),
                respondedAt=datetime(2025, 3, 30)
            ),
            ChatMessage(
                id="chat2",
                userId="user2",
                message="Should I sell my Tesla shares?",
                response="The decision to sell Tesla shares depends on your investment goals, time horizon, and risk tolerance. Currently, Tesla faces increased competition, but maintains strong market position in EVs. Consider partial profit-taking while maintaining some exposure if you believe in their long-term potential with autonomous driving and energy solutions.",
                context={
                    "holding": "TSLA",
                    "risk_profile": "Aggressive"
                },
                createdAt=datetime(2025, 3, 31),
                respondedAt=datetime(2025, 3, 31)
            )
        ]
    
    # User methods
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get a user by username"""
        for user in self.users:
            if user.username == username:
                return user
        return None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email"""
        for user in self.users:
            if user.email == email:
                return user
        return None
    
    def get_user(self, user_id: str) -> Optional[User]:
        """Get a user by ID"""
        for user in self.users:
            if user.id == user_id:
                return user
        return None
    
    def create_user(self, user_data: Dict[str, Any]) -> User:
        """Create a new user"""
        # Generate ID if not provided
        if "id" not in user_data:
            user_data["id"] = str(uuid.uuid4())
        
        # Create User instance
        user = User(**user_data)
        
        # Add to storage
        self.users.append(user)
        
        return user
    
    def update_user(self, user_id: str, user_data: Dict[str, Any]) -> Optional[User]:
        """Update a user"""
        user = self.get_user(user_id)
        
        if not user:
            return None
        
        # Update fields
        for key, value in user_data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        # Update timestamp
        user.updatedAt = datetime.now()
        
        return user
    
    def update_account_balance(self, user_id: str, balance: float) -> Optional[User]:
        """Update a user's account balance"""
        user = self.get_user(user_id)
        
        if not user:
            return None
        
        user.accountBalance = balance
        user.updatedAt = datetime.now()
        
        return user
    
    def update_last_login(self, user_id: str) -> Optional[User]:
        """Update a user's last login time"""
        user = self.get_user(user_id)
        
        if not user:
            return None
        
        user.lastLogin = datetime.now()
        
        return user
    
    # Stock methods
    def get_all_stocks(self, limit: int = 100, offset: int = 0, 
                       sector: Optional[str] = None,
                       exchange: Optional[str] = None,
                       min_price: Optional[float] = None,
                       max_price: Optional[float] = None) -> List[Stock]:
        """Get all stocks with optional filtering"""
        filtered_stocks = self.stocks
        
        # Apply filters
        if sector:
            filtered_stocks = [s for s in filtered_stocks if s.sector == sector]
        
        if exchange:
            filtered_stocks = [s for s in filtered_stocks if s.exchange == exchange]
        
        if min_price is not None:
            filtered_stocks = [s for s in filtered_stocks if s.currentPrice >= min_price]
        
        if max_price is not None:
            filtered_stocks = [s for s in filtered_stocks if s.currentPrice <= max_price]
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        
        return filtered_stocks[start_idx:end_idx]
    
    def get_stock(self, stock_id: str) -> Optional[Stock]:
        """Get a stock by ID"""
        for stock in self.stocks:
            if stock.id == stock_id:
                return stock
        return None
    
    def get_stock_by_symbol(self, symbol: str) -> Optional[Stock]:
        """Get a stock by symbol"""
        for stock in self.stocks:
            if stock.symbol.upper() == symbol.upper():
                return stock
        return None
    
    def get_top_stocks(self, limit: int = 5, 
                       filter_by: str = "performance") -> List[Stock]:
        """Get top performing stocks"""
        if filter_by == "performance":
            # Sort by daily performance
            sorted_stocks = sorted(
                self.stocks, 
                key=lambda s: s.dailyChangePercent, 
                reverse=True
            )
        elif filter_by == "volume":
            # Sort by volume
            sorted_stocks = sorted(
                self.stocks, 
                key=lambda s: s.volume, 
                reverse=True
            )
        elif filter_by == "market_cap":
            # Sort by market cap
            sorted_stocks = sorted(
                [s for s in self.stocks if s.marketCap is not None], 
                key=lambda s: s.marketCap, 
                reverse=True
            )
        else:
            sorted_stocks = self.stocks
        
        return sorted_stocks[:limit]
    
    def search_stocks(self, query: str, limit: int = 10) -> List[Stock]:
        """Search stocks by name or symbol"""
        # Case-insensitive search in name and symbol
        query = query.lower()
        results = []
        
        for stock in self.stocks:
            if (query in stock.name.lower() or 
                query in stock.symbol.lower() or
                (stock.description and query in stock.description.lower())):
                results.append(stock)
                
                if len(results) >= limit:
                    break
        
        return results
    
    def get_unique_sectors(self) -> List[str]:
        """Get all unique sectors"""
        sectors = set()
        
        for stock in self.stocks:
            if stock.sector:
                sectors.add(stock.sector)
        
        return sorted(list(sectors))
    
    def get_unique_exchanges(self) -> List[str]:
        """Get all unique exchanges"""
        exchanges = set()
        
        for stock in self.stocks:
            exchanges.add(stock.exchange)
        
        return sorted(list(exchanges))
    
    # AI recommendation methods
    def get_all_ai_suggestions(self, limit: int = 100, offset: int = 0,
                              suggestion_type: Optional[str] = None,
                              sentiment: Optional[str] = None) -> List[AIRecommendation]:
        """Get all AI suggestions with optional filtering"""
        filtered_suggestions = self.ai_recommendations
        
        # Apply filters
        if suggestion_type:
            filtered_suggestions = [s for s in filtered_suggestions if s.type == suggestion_type.upper()]
        
        if sentiment:
            filtered_suggestions = [s for s in filtered_suggestions if s.sentiment == sentiment.upper()]
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        
        return filtered_suggestions[start_idx:end_idx]
    
    def get_top_ai_suggestions(self, limit: int = 5,
                              suggestion_type: Optional[str] = None) -> List[AIRecommendation]:
        """Get top AI suggestions based on confidence score"""
        filtered_suggestions = self.ai_recommendations
        
        # Apply type filter if provided
        if suggestion_type:
            filtered_suggestions = [s for s in filtered_suggestions if s.type == suggestion_type.upper()]
        
        # Sort by confidence score
        sorted_suggestions = sorted(
            filtered_suggestions,
            key=lambda s: s.confidence,
            reverse=True
        )
        
        return sorted_suggestions[:limit]
    
    def get_stock_ai_suggestion(self, stock_id: str) -> Optional[AIRecommendation]:
        """Get AI suggestion for a specific stock"""
        for suggestion in self.ai_recommendations:
            if suggestion.stockId == stock_id:
                return suggestion
        return None
    
    def get_suggestions_by_type(self, suggestion_type: str, limit: int = 10) -> List[AIRecommendation]:
        """Get AI suggestions by type"""
        suggestions = [s for s in self.ai_recommendations if s.type == suggestion_type]
        
        # Sort by confidence
        sorted_suggestions = sorted(
            suggestions,
            key=lambda s: s.confidence,
            reverse=True
        )
        
        return sorted_suggestions[:limit]
    
    # Historical data methods
    def get_stock_historical_data(self, stock_id: str, days: int = 30) -> List[HistoricalData]:
        """Get historical data for a stock"""
        # Filter by stock ID
        data = [h for h in self.historical_data if h.stockId == stock_id]
        
        # Sort by date (newest first)
        sorted_data = sorted(
            data,
            key=lambda h: h.date,
            reverse=True
        )
        
        # Limit by days
        return sorted_data[:days]
    
    # Watchlist methods
    def get_user_watchlist(self, user_id: str) -> List[Watchlist]:
        """Get a user's watchlist"""
        return [w for w in self.watchlists if w.userId == user_id]
    
    def is_stock_in_watchlist(self, user_id: str, stock_id: str) -> bool:
        """Check if a stock is in a user's watchlist"""
        for item in self.watchlists:
            if item.userId == user_id and item.stockId == stock_id:
                return True
        return False
    
    def add_to_watchlist(self, watchlist_data: Dict[str, Any]) -> Watchlist:
        """Add a stock to a user's watchlist"""
        # Generate ID if not provided
        if "id" not in watchlist_data:
            watchlist_data["id"] = str(uuid.uuid4())
        
        # Create Watchlist instance
        watchlist_item = Watchlist(**watchlist_data)
        
        # Add to storage
        self.watchlists.append(watchlist_item)
        
        return watchlist_item
    
    def update_watchlist_item(self, user_id: str, stock_id: str, 
                             alert_price: Optional[float], 
                             alert_condition: Optional[str]) -> Optional[Watchlist]:
        """Update a watchlist item"""
        # Find the watchlist item
        for item in self.watchlists:
            if item.userId == user_id and item.stockId == stock_id:
                # Update alert settings
                item.alertPrice = alert_price
                item.alertCondition = alert_condition
                
                # Update timestamp
                item.updatedAt = datetime.now()
                
                return item
        
        return None
    
    def remove_from_watchlist(self, user_id: str, stock_id: str) -> bool:
        """Remove a stock from a user's watchlist"""
        # Find the watchlist item
        for i, item in enumerate(self.watchlists):
            if item.userId == user_id and item.stockId == stock_id:
                # Remove from list
                self.watchlists.pop(i)
                return True
        
        return False
    
    # Portfolio methods
    def get_user_portfolio(self, user_id: str) -> List[Portfolio]:
        """Get a user's portfolio"""
        return [p for p in self.portfolios if p.userId == user_id]
    
    def get_portfolio_item(self, user_id: str, stock_id: str) -> Optional[Portfolio]:
        """Get a specific portfolio item"""
        for item in self.portfolios:
            if item.userId == user_id and item.stockId == stock_id:
                return item
        return None
    
    def create_portfolio_item(self, portfolio_data: Dict[str, Any]) -> Portfolio:
        """Create a portfolio item"""
        # Generate ID if not provided
        if "id" not in portfolio_data:
            portfolio_data["id"] = str(uuid.uuid4())
        
        # Create Portfolio instance
        portfolio_item = Portfolio(**portfolio_data)
        
        # Add to storage
        self.portfolios.append(portfolio_item)
        
        return portfolio_item
    
    def update_portfolio_item(self, user_id: str, stock_id: str, 
                             quantity: float, average_buy_price: float) -> Optional[Portfolio]:
        """Update a portfolio item"""
        # Find the portfolio item
        for item in self.portfolios:
            if item.userId == user_id and item.stockId == stock_id:
                # Update fields
                item.quantity = quantity
                item.averageBuyPrice = average_buy_price
                
                # Update timestamp
                item.updatedAt = datetime.now()
                
                return item
        
        return None
    
    def delete_portfolio_item(self, user_id: str, stock_id: str) -> bool:
        """Delete a portfolio item"""
        # Find the portfolio item
        for i, item in enumerate(self.portfolios):
            if item.userId == user_id and item.stockId == stock_id:
                # Remove from list
                self.portfolios.pop(i)
                return True
        
        return False
    
    def get_portfolio_value(self, user_id: str) -> Dict[str, Any]:
        """Get the total value of a user's portfolio"""
        portfolio_items = self.get_user_portfolio(user_id)
        
        total_value = 0.0
        total_investment = 0.0
        
        for item in portfolio_items:
            # Get current stock price
            stock = self.get_stock(item.stockId)
            
            if stock:
                current_value = stock.currentPrice * item.quantity
                investment_value = item.averageBuyPrice * item.quantity
                
                total_value += current_value
                total_investment += investment_value
        
        # Calculate profit/loss
        total_profit_loss = total_value - total_investment
        total_profit_loss_percent = (total_profit_loss / total_investment * 100) if total_investment > 0 else 0
        
        return {
            "totalValue": total_value,
            "totalInvestment": total_investment,
            "totalProfitLoss": total_profit_loss,
            "totalProfitLossPercent": total_profit_loss_percent
        }
    
    # Strategy methods
    def get_user_strategies(self, user_id: str) -> List[Strategy]:
        """Get a user's trading strategies"""
        return [s for s in self.strategies if s.userId == user_id]
    
    def get_strategy(self, strategy_id: str) -> Optional[Strategy]:
        """Get a strategy by ID"""
        for strategy in self.strategies:
            if strategy.id == strategy_id:
                return strategy
        return None
    
    def create_strategy(self, strategy_data: Dict[str, Any]) -> Strategy:
        """Create a trading strategy"""
        # Generate ID if not provided
        if "id" not in strategy_data:
            strategy_data["id"] = str(uuid.uuid4())
        
        # Create Strategy instance
        strategy = Strategy(**strategy_data)
        
        # Add to storage
        self.strategies.append(strategy)
        
        return strategy
    
    def update_strategy(self, strategy_id: str, strategy_data: Dict[str, Any]) -> Optional[Strategy]:
        """Update a trading strategy"""
        strategy = self.get_strategy(strategy_id)
        
        if not strategy:
            return None
        
        # Update fields
        for key, value in strategy_data.items():
            if hasattr(strategy, key):
                setattr(strategy, key, value)
        
        # Update timestamp
        strategy.updatedAt = datetime.now()
        
        return strategy
    
    def delete_strategy(self, strategy_id: str) -> bool:
        """Delete a trading strategy"""
        for i, strategy in enumerate(self.strategies):
            if strategy.id == strategy_id:
                self.strategies.pop(i)
                return True
        return False
    
    def toggle_strategy_status(self, strategy_id: str) -> Optional[Strategy]:
        """Toggle a strategy's active status"""
        strategy = self.get_strategy(strategy_id)
        
        if not strategy:
            return None
        
        # Toggle status
        if strategy.status == "ACTIVE":
            strategy.status = "INACTIVE"
        else:
            strategy.status = "ACTIVE"
        
        # Update timestamp
        strategy.updatedAt = datetime.now()
        
        return strategy
    
    # Transaction methods
    def get_user_transactions(self, user_id: str, limit: int = 100, offset: int = 0,
                              transaction_type: Optional[str] = None) -> List[Transaction]:
        """Get a user's transactions"""
        # Filter by user ID
        transactions = [t for t in self.transactions if t.userId == user_id]
        
        # Apply type filter if provided
        if transaction_type:
            transactions = [t for t in transactions if t.type == transaction_type.upper()]
        
        # Sort by creation date (newest first)
        sorted_transactions = sorted(
            transactions,
            key=lambda t: t.createdAt,
            reverse=True
        )
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        
        return sorted_transactions[start_idx:end_idx]
    
    def create_transaction(self, transaction_data: Dict[str, Any]) -> Transaction:
        """Create a transaction record"""
        # Generate ID if not provided
        if "id" not in transaction_data:
            transaction_data["id"] = str(uuid.uuid4())
        
        # If completed time not provided and status is COMPLETED, set to current time
        if "completedAt" not in transaction_data and transaction_data.get("status") == "COMPLETED":
            transaction_data["completedAt"] = datetime.now()
        
        # Create Transaction instance
        transaction = Transaction(**transaction_data)
        
        # Add to storage
        self.transactions.append(transaction)
        
        return transaction
    
    # Notification methods
    def get_user_notifications(self, user_id: str, limit: int = 100, offset: int = 0,
                              include_read: bool = False) -> List[Notification]:
        """Get a user's notifications"""
        # Filter by user ID
        notifications = [n for n in self.notifications if n.userId == user_id]
        
        # Filter out read notifications if specified
        if not include_read:
            notifications = [n for n in notifications if not n.isRead]
        
        # Sort by creation date (newest first)
        sorted_notifications = sorted(
            notifications,
            key=lambda n: n.createdAt,
            reverse=True
        )
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        
        return sorted_notifications[start_idx:end_idx]
    
    def create_notification(self, notification_data: Dict[str, Any]) -> Notification:
        """Create a notification"""
        # Generate ID if not provided
        if "id" not in notification_data:
            notification_data["id"] = str(uuid.uuid4())
        
        # Create Notification instance
        notification = Notification(**notification_data)
        
        # Add to storage
        self.notifications.append(notification)
        
        return notification
    
    def mark_notification_as_read(self, notification_id: str) -> Optional[Notification]:
        """Mark a notification as read"""
        for notification in self.notifications:
            if notification.id == notification_id:
                notification.isRead = True
                notification.readAt = datetime.now()
                return notification
        return None
    
    def mark_all_notifications_as_read(self, user_id: str) -> int:
        """Mark all notifications for a user as read"""
        count = 0
        
        for notification in self.notifications:
            if notification.userId == user_id and not notification.isRead:
                notification.isRead = True
                notification.readAt = datetime.now()
                count += 1
        
        return count
    
    # Chat methods
    def get_user_chat_history(self, user_id: str, limit: int = 100, offset: int = 0) -> List[ChatMessage]:
        """Get a user's chat history"""
        # Filter by user ID
        messages = [m for m in self.chat_messages if m.userId == user_id]
        
        # Sort by creation date (newest first)
        sorted_messages = sorted(
            messages,
            key=lambda m: m.createdAt,
            reverse=True
        )
        
        # Apply pagination
        start_idx = offset
        end_idx = offset + limit
        
        return sorted_messages[start_idx:end_idx]
    
    def create_chat_message(self, message_data: Dict[str, Any]) -> ChatMessage:
        """Create a chat message"""
        # Generate ID if not provided
        if "id" not in message_data:
            message_data["id"] = str(uuid.uuid4())
        
        # Create ChatMessage instance
        message = ChatMessage(**message_data)
        
        # Add to storage
        self.chat_messages.append(message)
        
        return message
    
    def update_chat_response(self, message_id: str, response: str) -> Optional[ChatMessage]:
        """Update a chat message with an AI response"""
        for message in self.chat_messages:
            if message.id == message_id:
                message.response = response
                message.respondedAt = datetime.now()
                return message
        return None
    
    def clear_chat_history(self, user_id: str) -> int:
        """Clear a user's chat history"""
        count = 0
        indices_to_remove = []
        
        # Find messages to remove
        for i, message in enumerate(self.chat_messages):
            if message.userId == user_id:
                indices_to_remove.append(i)
                count += 1
        
        # Remove messages in reverse order to avoid index issues
        for i in sorted(indices_to_remove, reverse=True):
            self.chat_messages.pop(i)
        
        return count