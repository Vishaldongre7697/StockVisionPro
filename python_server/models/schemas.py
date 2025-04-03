"""
Data models for StockVisionPro API
"""

from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any, Union


class User(BaseModel):
    """User model for authentication and profile"""
    id: str
    username: str
    email: str
    password: Optional[str] = None
    fullName: str
    accountBalance: float = 10000.0  # Default starting balance
    lastLogin: Optional[datetime] = None
    isActive: bool = True
    preferences: Dict[str, Any] = {}
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: Optional[datetime] = None


class Stock(BaseModel):
    """Stock model for market data"""
    id: str
    symbol: str
    name: str
    currentPrice: float
    dailyChange: float
    dailyChangePercent: float
    open: float
    high: float
    low: float
    previousClose: float
    volume: int
    marketCap: Optional[float] = None
    peRatio: Optional[float] = None
    dividendYield: Optional[float] = None
    sector: Optional[str] = None
    exchange: str
    description: Optional[str] = None
    updatedAt: datetime = Field(default_factory=datetime.now)


class AIRecommendation(BaseModel):
    """AI-generated stock recommendation model"""
    id: str
    stockId: str
    type: str  # BUY, SELL, HOLD
    confidence: float  # 0-100 score
    sentiment: str  # BULLISH, BEARISH, NEUTRAL
    priceTarget: Optional[float] = None
    timeFrame: str  # SHORT_TERM, MEDIUM_TERM, LONG_TERM
    analysis: str
    createdAt: datetime = Field(default_factory=datetime.now)


class HistoricalData(BaseModel):
    """Historical stock price data model"""
    id: str
    stockId: str
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int


class Watchlist(BaseModel):
    """User watchlist item model"""
    id: str
    userId: str
    stockId: str
    alertPrice: Optional[float] = None
    alertCondition: Optional[str] = None  # ABOVE, BELOW
    notes: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: Optional[datetime] = None


class Portfolio(BaseModel):
    """User portfolio item model"""
    id: str
    userId: str
    stockId: str
    quantity: float
    averageBuyPrice: float
    notes: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: Optional[datetime] = None


class Strategy(BaseModel):
    """Trading strategy model"""
    id: str
    userId: str
    name: str
    description: Optional[str] = None
    indicators: List[Dict[str, Any]] = []
    entryConditions: List[Dict[str, Any]] = []
    exitConditions: List[Dict[str, Any]] = []
    riskManagement: Dict[str, Any] = {}
    status: str = "INACTIVE"  # ACTIVE, INACTIVE, PAUSED
    targetStocks: List[str] = []  # List of stock IDs
    performanceMetrics: Dict[str, Any] = {}
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: Optional[datetime] = None


class Transaction(BaseModel):
    """Transaction model for portfolio changes"""
    id: str
    userId: str
    stockId: str
    type: str  # BUY, SELL
    quantity: float
    price: float
    totalAmount: float
    status: str  # PENDING, COMPLETED, FAILED
    notes: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.now)
    completedAt: Optional[datetime] = None


class Notification(BaseModel):
    """User notification model"""
    id: str
    userId: str
    title: str
    message: str
    type: str  # ALERT, SYSTEM, STRATEGY
    relatedEntityId: Optional[str] = None  # stockId, strategyId, etc.
    isRead: bool = False
    createdAt: datetime = Field(default_factory=datetime.now)
    readAt: Optional[datetime] = None


class ChatMessage(BaseModel):
    """Chat message model for SuhuAI assistant"""
    id: str
    userId: str
    message: str
    response: Optional[str] = None
    context: Dict[str, Any] = {}
    createdAt: datetime = Field(default_factory=datetime.now)
    respondedAt: Optional[datetime] = None


# Login related models
class LoginRequest(BaseModel):
    """Login request data model"""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Login response data model"""
    token: str
    user: User


class RegisterRequest(BaseModel):
    """Register request data model"""
    username: str
    email: str 
    password: str
    fullName: str


# Request validation models
class WatchlistRequest(BaseModel):
    """Watchlist item request model"""
    userId: str
    stockId: str
    alertPrice: Optional[float] = None
    alertCondition: Optional[str] = None
    notes: Optional[str] = None


class PortfolioRequest(BaseModel):
    """Portfolio item request model"""
    userId: str
    stockId: str
    quantity: float
    averageBuyPrice: float
    notes: Optional[str] = None