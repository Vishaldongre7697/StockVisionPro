from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from enum import Enum, auto

# Enumerations
class StockSentiment(str, Enum):
    VERY_BULLISH = "Very Bullish"
    BULLISH = "Bullish"
    NEUTRAL = "Neutral"
    BEARISH = "Bearish"
    VERY_BEARISH = "Very Bearish"

class SuggestionType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"
    WATCH = "WATCH"

class TransactionType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class NotificationType(str, Enum):
    PRICE_ALERT = "PRICE_ALERT"
    STRATEGY_ALERT = "STRATEGY_ALERT"
    AI_SUGGESTION = "AI_SUGGESTION"
    SYSTEM = "SYSTEM"

class TimeFrame(str, Enum):
    SHORT_TERM = "SHORT_TERM"
    MEDIUM_TERM = "MEDIUM_TERM"
    LONG_TERM = "LONG_TERM"

# Model Schemas
class User(BaseModel):
    id: int
    username: str
    password: str
    email: str
    fullName: Optional[str] = None
    profileImage: Optional[str] = None
    phoneNumber: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    accountBalance: float = 0.0
    createdAt: datetime = Field(default_factory=datetime.now)
    lastLoginAt: datetime = Field(default_factory=datetime.now)

class Stock(BaseModel):
    id: int
    symbol: str
    name: str
    exchange: str
    currentPrice: float
    previousClose: float
    change: Optional[float] = None
    changePercent: Optional[float] = None
    volume: Optional[int] = None
    marketCap: Optional[float] = None
    dayHigh: Optional[float] = None
    dayLow: Optional[float] = None
    fiftyTwoWeekHigh: Optional[float] = None
    fiftyTwoWeekLow: Optional[float] = None
    pe: Optional[float] = None
    eps: Optional[float] = None
    dividend: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    updatedAt: datetime = Field(default_factory=datetime.now)

class StockHistoricalData(BaseModel):
    id: int
    stockId: int
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    adjustedClose: Optional[float] = None

class Watchlist(BaseModel):
    id: int
    userId: int
    stockId: int
    addedAt: datetime = Field(default_factory=datetime.now)
    alertPrice: Optional[float] = None
    alertCondition: Optional[str] = None  # "above", "below"

class TradingStrategy(BaseModel):
    id: int
    userId: int
    name: str
    description: Optional[str] = None
    conditions: Dict[str, Any]  # JSON object with strategy conditions
    actions: Dict[str, Any]     # JSON object with strategy actions
    isActive: bool = False
    backtestResults: Optional[Dict[str, Any]] = None
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now)

class Transaction(BaseModel):
    id: int
    userId: int
    stockId: int
    type: str  # TransactionType
    quantity: float
    price: float
    totalAmount: float
    status: str  # TransactionStatus
    strategyId: Optional[int] = None
    createdAt: datetime = Field(default_factory=datetime.now)
    completedAt: Optional[datetime] = None

class Portfolio(BaseModel):
    userId: int
    stockId: int
    quantity: float
    averageBuyPrice: float
    updatedAt: datetime = Field(default_factory=datetime.now)

class AiSuggestion(BaseModel):
    id: int
    stockId: int
    suggestion: str  # SuggestionType
    targetPrice: Optional[float] = None
    stopLoss: Optional[float] = None
    confidence: Optional[float] = None  # 0-100
    rationale: Optional[str] = None
    timeframe: Optional[str] = None  # TimeFrame
    createdAt: datetime = Field(default_factory=datetime.now)
    expiresAt: datetime

class Notification(BaseModel):
    id: int
    userId: int
    type: str  # NotificationType
    title: str
    message: str
    isRead: bool = False
    relatedEntityType: Optional[str] = None  # "stock", "strategy", "transaction"
    relatedEntityId: Optional[int] = None
    createdAt: datetime = Field(default_factory=datetime.now)

class ChatMessage(BaseModel):
    id: int
    userId: int
    sender: str  # "USER" or "AI"
    message: str
    context: Optional[Dict[str, Any]] = None
    createdAt: datetime = Field(default_factory=datetime.now)