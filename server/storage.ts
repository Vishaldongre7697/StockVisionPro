import {
  users, type User, type InsertUser,
  stocks, type Stock, type InsertStock,
  stockHistoricalData, type StockHistoricalData, type InsertStockHistoricalData,
  watchlists, type Watchlist, type InsertWatchlist,
  aiSuggestions, type AiSuggestion, type InsertAiSuggestion,
  tradingStrategies, type TradingStrategy, type InsertTradingStrategy,
  transactions, type Transaction, type InsertTransaction,
  portfolio, type Portfolio, type InsertPortfolio,
  notifications, type Notification, type InsertNotification,
  chatMessages, type ChatMessage, type InsertChatMessage,
  SuggestionType, TransactionType, TransactionStatus, NotificationType, TimeFrame
} from "@shared/schema";

export interface IStorage {
  // User related operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateLastLogin(id: number): Promise<User | undefined>;
  updateAccountBalance(id: number, newBalance: number): Promise<User | undefined>;

  // Stocks related operations
  getStock(id: number): Promise<Stock | undefined>;
  getStockBySymbol(symbol: string): Promise<Stock | undefined>;
  getAllStocks(): Promise<Stock[]>;
  getTopStocks(limit: number): Promise<Stock[]>;
  createStock(stock: InsertStock): Promise<Stock>;
  updateStockPrice(id: number, price: number, change: number, changePercent: number): Promise<Stock | undefined>;
  updateStock(id: number, stockData: Partial<InsertStock>): Promise<Stock | undefined>;
  getStocksByTrend(trend: "up" | "down", limit: number): Promise<Stock[]>;
  getStocksBySector(sector: string): Promise<Stock[]>;

  // Stock historical data operations
  getStockHistoricalData(stockId: number, startDate?: Date, endDate?: Date): Promise<StockHistoricalData[]>;
  createHistoricalDataPoint(data: InsertStockHistoricalData): Promise<StockHistoricalData>;
  bulkInsertHistoricalData(dataPoints: InsertStockHistoricalData[]): Promise<StockHistoricalData[]>;

  // Watchlist related operations
  getWatchlist(id: number): Promise<Watchlist | undefined>;
  addToWatchlist(watchlistItem: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(userId: number | 'guest', stockId: number): Promise<boolean>;
  getUserWatchlist(userId: number | 'guest'): Promise<Stock[]>;
  isStockInWatchlist(userId: number | 'guest', stockId: number): Promise<boolean>;
  getUserWatchlistItems(userId: number | 'guest'): Promise<Watchlist[]>;
  updateWatchlistAlert(id: number, alertPrice: number | null, alertCondition: string | null): Promise<Watchlist | undefined>;

  // Trading Strategy operations
  getStrategy(id: number): Promise<TradingStrategy | undefined>;
  getUserStrategies(userId: number): Promise<TradingStrategy[]>;
  createStrategy(strategy: InsertTradingStrategy): Promise<TradingStrategy>;
  updateStrategy(id: number, strategyData: Partial<InsertTradingStrategy>): Promise<TradingStrategy | undefined>;
  deleteStrategy(id: number): Promise<boolean>;
  toggleStrategyStatus(id: number, isActive: boolean): Promise<TradingStrategy | undefined>;
  getActiveStrategies(): Promise<TradingStrategy[]>;

  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getUserTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: TransactionStatus, completedAt?: Date): Promise<Transaction | undefined>;
  getTransactionsByStrategy(strategyId: number): Promise<Transaction[]>;
  getTransactionsByStock(stockId: number, userId?: number): Promise<Transaction[]>;

  // Portfolio operations
  getPortfolioItem(userId: number, stockId: number): Promise<Portfolio | undefined>;
  getUserPortfolio(userId: number): Promise<Portfolio[]>;
  createPortfolioItem(portfolioItem: InsertPortfolio): Promise<Portfolio>;
  updatePortfolioItem(userId: number, stockId: number, quantity: number, averageBuyPrice?: number): Promise<Portfolio | undefined>;
  deletePortfolioItem(userId: number, stockId: number): Promise<boolean>;
  getPortfolioValue(userId: number): Promise<{ totalValue: number; totalInvestment: number; totalProfit: number }>;

  // AI suggestions related operations
  getAiSuggestion(id: number): Promise<AiSuggestion | undefined>;
  getStockAiSuggestion(stockId: number): Promise<AiSuggestion | undefined>;
  getAllAiSuggestions(): Promise<AiSuggestion[]>;
  getTopAiSuggestions(limit: number): Promise<AiSuggestion[]>;
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;
  getSuggestionsByType(type: SuggestionType, limit?: number): Promise<AiSuggestion[]>;
  getSuggestionsByTimeframe(timeframe: TimeFrame, limit?: number): Promise<AiSuggestion[]>;

  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getUserNotifications(userId: number, limit?: number, onlyUnread?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<number>;
  deleteNotification(id: number): Promise<boolean>;

  // Chat messages operations
  getChatMessages(userId: number, limit?: number): Promise<ChatMessage[]>;
  saveChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage>;
  clearChatHistory(userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stocks: Map<number, Stock>;
  private stockHistoricalData: Map<number, StockHistoricalData>;
  private watchlists: Map<number, Watchlist>;
  private tradingStrategies: Map<number, TradingStrategy>;
  private transactions: Map<number, Transaction>;
  private portfolioItems: Map<string, Portfolio>; // key: `${userId}:${stockId}`
  private aiSuggestions: Map<number, AiSuggestion>;
  private notifications: Map<number, Notification>;
  private chatMessages: Map<number, ChatMessage>;
  
  private userIdCounter: number;
  private stockIdCounter: number;
  private historicalDataIdCounter: number;
  private watchlistIdCounter: number;
  private strategyIdCounter: number;
  private transactionIdCounter: number;
  private aiSuggestionIdCounter: number;
  private notificationIdCounter: number;
  private chatMessageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.stocks = new Map();
    this.stockHistoricalData = new Map();
    this.watchlists = new Map();
    this.tradingStrategies = new Map();
    this.transactions = new Map();
    this.portfolioItems = new Map();
    this.aiSuggestions = new Map();
    this.notifications = new Map();
    this.chatMessages = new Map();
    
    this.userIdCounter = 1;
    this.stockIdCounter = 1;
    this.historicalDataIdCounter = 1;
    this.watchlistIdCounter = 1;
    this.strategyIdCounter = 1;
    this.transactionIdCounter = 1;
    this.aiSuggestionIdCounter = 1;
    this.notificationIdCounter = 1;
    this.chatMessageIdCounter = 1;
    
    // Initialize with sample data
    this.initializeData();
  }
  
  // Initialize with sample data
  private async initializeData() {
    await this.initializeStocks();
    await this.initializeHistoricalData();
  }
  
  // Initialize historical data
  private async initializeHistoricalData() {
    // Generate 30 days of historical data for each stock
    const stocks = await this.getAllStocks();
    const now = new Date();
    
    for (const stock of stocks) {
      if (stock.symbol === "NIFTY" || stock.symbol === "SENSEX") continue; // Skip indices
      
      const dataPoints: InsertStockHistoricalData[] = [];
      let basePrice = stock.currentPrice * 0.9; // Start 10% lower than current price
      
      // Generate data for 30 days
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        // Add some randomness to prices
        const randomFactor = 1 + (Math.random() * 0.04 - 0.02); // -2% to +2%
        basePrice = basePrice * randomFactor;
        
        // Calculate high, low, and volume with some randomness
        const high = basePrice * (1 + Math.random() * 0.02); // Up to 2% higher
        const low = basePrice * (1 - Math.random() * 0.02); // Up to 2% lower
        const volume = Math.floor(100000 + Math.random() * 500000); // Random volume between 100k and 600k
        
        dataPoints.push({
          stockId: stock.id,
          date,
          open: basePrice,
          close: basePrice,
          high,
          low,
          volume
        });
      }
      
      // Bulk insert the data points
      await this.bulkInsertHistoricalData(dataPoints);
    }
  }

  // User related operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      accountBalance: 10000, // Initial balance for virtual trading
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...userData,
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateLastLogin(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      lastLoginAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateAccountBalance(id: number, newBalance: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      accountBalance: newBalance
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Stock related operations
  async getStock(id: number): Promise<Stock | undefined> {
    return this.stocks.get(id);
  }

  async getStockBySymbol(symbol: string): Promise<Stock | undefined> {
    return Array.from(this.stocks.values()).find(
      (stock) => stock.symbol.toUpperCase() === symbol.toUpperCase()
    );
  }

  async getAllStocks(): Promise<Stock[]> {
    return Array.from(this.stocks.values());
  }

  async getTopStocks(limit: number): Promise<Stock[]> {
    return Array.from(this.stocks.values())
      .sort((a, b) => {
        // Sort by absolute change percentage (highest first)
        return Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0);
      })
      .slice(0, limit);
  }

  async createStock(insertStock: InsertStock): Promise<Stock> {
    const id = this.stockIdCounter++;
    const stock: Stock = { 
      ...insertStock, 
      id,
      updatedAt: new Date() 
    };
    this.stocks.set(id, stock);
    return stock;
  }

  async updateStockPrice(id: number, price: number, change: number, changePercent: number): Promise<Stock | undefined> {
    const stock = this.stocks.get(id);
    if (!stock) return undefined;
    
    const updatedStock: Stock = {
      ...stock,
      currentPrice: price,
      change,
      changePercent,
      updatedAt: new Date()
    };
    
    this.stocks.set(id, updatedStock);
    return updatedStock;
  }

  async updateStock(id: number, stockData: Partial<InsertStock>): Promise<Stock | undefined> {
    const stock = this.stocks.get(id);
    if (!stock) return undefined;
    
    const updatedStock: Stock = {
      ...stock,
      ...stockData,
      updatedAt: new Date()
    };
    
    this.stocks.set(id, updatedStock);
    return updatedStock;
  }

  async getStocksByTrend(trend: "up" | "down", limit: number): Promise<Stock[]> {
    return Array.from(this.stocks.values())
      .filter(stock => {
        if (trend === "up") {
          return (stock.changePercent || 0) > 0;
        } else {
          return (stock.changePercent || 0) < 0;
        }
      })
      .sort((a, b) => {
        if (trend === "up") {
          return (b.changePercent || 0) - (a.changePercent || 0);
        } else {
          return (a.changePercent || 0) - (b.changePercent || 0);
        }
      })
      .slice(0, limit);
  }

  async getStocksBySector(sector: string): Promise<Stock[]> {
    return Array.from(this.stocks.values())
      .filter(stock => stock.sector === sector);
  }

  // Stock historical data operations
  async getStockHistoricalData(stockId: number, startDate?: Date, endDate?: Date): Promise<StockHistoricalData[]> {
    const data = Array.from(this.stockHistoricalData.values())
      .filter(point => point.stockId === stockId);
    
    if (startDate || endDate) {
      return data.filter(point => {
        const pointDate = new Date(point.date);
        if (startDate && endDate) {
          return pointDate >= startDate && pointDate <= endDate;
        } else if (startDate) {
          return pointDate >= startDate;
        } else if (endDate) {
          return pointDate <= endDate;
        }
        return true;
      });
    }
    
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createHistoricalDataPoint(data: InsertStockHistoricalData): Promise<StockHistoricalData> {
    const id = this.historicalDataIdCounter++;
    const historicalData: StockHistoricalData = {
      ...data,
      id
    };
    this.stockHistoricalData.set(id, historicalData);
    return historicalData;
  }

  async bulkInsertHistoricalData(dataPoints: InsertStockHistoricalData[]): Promise<StockHistoricalData[]> {
    return Promise.all(dataPoints.map(point => this.createHistoricalDataPoint(point)));
  }

  // Watchlist related operations
  async getWatchlist(id: number): Promise<Watchlist | undefined> {
    return this.watchlists.get(id);
  }
  
  async addToWatchlist(insertWatchlist: InsertWatchlist): Promise<Watchlist> {
    const id = this.watchlistIdCounter++;
    const watchlist: Watchlist = { 
      ...insertWatchlist, 
      id, 
      addedAt: new Date(),
      notes: insertWatchlist.notes || null,
      alertPrice: insertWatchlist.alertPrice || null,
      alertCondition: insertWatchlist.alertCondition || null
    };
    this.watchlists.set(id, watchlist);
    return watchlist;
  }

  async removeFromWatchlist(userId: number | 'guest', stockId: number): Promise<boolean> {
    // For guest user, always return true (simulation of successful removal)
    if (userId === 'guest') {
      return true;
    }
    
    const watchlistId = Array.from(this.watchlists.entries()).find(
      ([_, item]) => item.userId === userId && item.stockId === stockId
    )?.[0];
    
    if (watchlistId) {
      return this.watchlists.delete(watchlistId);
    }
    
    return false;
  }

  async getUserWatchlist(userId: number | 'guest'): Promise<Stock[]> {
    // For guest user, return recommended stocks
    if (userId === 'guest') {
      // Return top trending stocks for guest users
      return this.getTopStocks(6);
    }
    
    const userWatchlistItems = Array.from(this.watchlists.values()).filter(
      (item) => item.userId === userId
    );
    
    const stockIds = userWatchlistItems.map((item) => item.stockId);
    
    return Array.from(this.stocks.values()).filter(
      (stock) => stockIds.includes(stock.id)
    );
  }
  
  async getUserWatchlistItems(userId: number | 'guest'): Promise<Watchlist[]> {
    // For guest user, return empty watchlist items
    if (userId === 'guest') {
      return [];
    }
    
    return Array.from(this.watchlists.values()).filter(
      (item) => item.userId === userId
    );
  }

  async isStockInWatchlist(userId: number | 'guest', stockId: number): Promise<boolean> {
    // For guest user, always return false to allow adding any stock
    if (userId === 'guest') {
      return false;
    }
    
    return Array.from(this.watchlists.values()).some(
      (item) => item.userId === userId && item.stockId === stockId
    );
  }
  
  async updateWatchlistAlert(id: number, alertPrice: number | null, alertCondition: string | null): Promise<Watchlist | undefined> {
    const watchlist = this.watchlists.get(id);
    if (!watchlist) return undefined;
    
    const updatedWatchlist: Watchlist = {
      ...watchlist,
      alertPrice,
      alertCondition
    };
    
    this.watchlists.set(id, updatedWatchlist);
    return updatedWatchlist;
  }

  // Trading Strategy operations
  async getStrategy(id: number): Promise<TradingStrategy | undefined> {
    return this.tradingStrategies.get(id);
  }
  
  async getUserStrategies(userId: number): Promise<TradingStrategy[]> {
    return Array.from(this.tradingStrategies.values())
      .filter(strategy => strategy.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  
  async createStrategy(strategy: InsertTradingStrategy): Promise<TradingStrategy> {
    const id = this.strategyIdCounter++;
    const now = new Date();
    const tradingStrategy: TradingStrategy = {
      ...strategy,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.tradingStrategies.set(id, tradingStrategy);
    return tradingStrategy;
  }
  
  async updateStrategy(id: number, strategyData: Partial<InsertTradingStrategy>): Promise<TradingStrategy | undefined> {
    const strategy = this.tradingStrategies.get(id);
    if (!strategy) return undefined;
    
    const updatedStrategy: TradingStrategy = {
      ...strategy,
      ...strategyData,
      updatedAt: new Date()
    };
    
    this.tradingStrategies.set(id, updatedStrategy);
    return updatedStrategy;
  }
  
  async deleteStrategy(id: number): Promise<boolean> {
    return this.tradingStrategies.delete(id);
  }
  
  async toggleStrategyStatus(id: number, isActive: boolean): Promise<TradingStrategy | undefined> {
    const strategy = this.tradingStrategies.get(id);
    if (!strategy) return undefined;
    
    const updatedStrategy: TradingStrategy = {
      ...strategy,
      isActive,
      updatedAt: new Date()
    };
    
    this.tradingStrategies.set(id, updatedStrategy);
    return updatedStrategy;
  }
  
  async getActiveStrategies(): Promise<TradingStrategy[]> {
    return Array.from(this.tradingStrategies.values())
      .filter(strategy => strategy.isActive);
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getUserTransactions(userId: number, limit?: number): Promise<Transaction[]> {
    const userTransactions = Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? userTransactions.slice(0, limit) : userTransactions;
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: new Date(),
      completedAt: null
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
  
  async updateTransactionStatus(id: number, status: TransactionStatus, completedAt?: Date): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction: Transaction = {
      ...transaction,
      status,
      completedAt: status === TransactionStatus.COMPLETED ? (completedAt || new Date()) : null
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async getTransactionsByStrategy(strategyId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.strategyId === strategyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getTransactionsByStock(stockId: number, userId?: number): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values())
      .filter(transaction => transaction.stockId === stockId);
    
    if (userId) {
      transactions = transactions.filter(transaction => transaction.userId === userId);
    }
    
    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Portfolio operations
  async getPortfolioItem(userId: number, stockId: number): Promise<Portfolio | undefined> {
    return this.portfolioItems.get(`${userId}:${stockId}`);
  }
  
  async getUserPortfolio(userId: number): Promise<Portfolio[]> {
    return Array.from(this.portfolioItems.values())
      .filter(item => item.userId === userId);
  }
  
  async createPortfolioItem(portfolioItem: InsertPortfolio): Promise<Portfolio> {
    const key = `${portfolioItem.userId}:${portfolioItem.stockId}`;
    const portfolio: Portfolio = {
      ...portfolioItem,
      id: this.generatePortfolioId(portfolioItem.userId, portfolioItem.stockId),
      updatedAt: new Date()
    };
    this.portfolioItems.set(key, portfolio);
    return portfolio;
  }
  
  async updatePortfolioItem(userId: number, stockId: number, quantity: number, averageBuyPrice?: number): Promise<Portfolio | undefined> {
    const key = `${userId}:${stockId}`;
    const portfolioItem = this.portfolioItems.get(key);
    if (!portfolioItem) return undefined;
    
    const updatedItem: Portfolio = {
      ...portfolioItem,
      quantity,
      ...(averageBuyPrice ? { averageBuyPrice } : {}),
      updatedAt: new Date()
    };
    
    this.portfolioItems.set(key, updatedItem);
    return updatedItem;
  }
  
  async deletePortfolioItem(userId: number, stockId: number): Promise<boolean> {
    const key = `${userId}:${stockId}`;
    return this.portfolioItems.delete(key);
  }
  
  async getPortfolioValue(userId: number): Promise<{ totalValue: number; totalInvestment: number; totalProfit: number }> {
    const portfolio = await this.getUserPortfolio(userId);
    let totalValue = 0;
    let totalInvestment = 0;
    
    for (const item of portfolio) {
      const stock = await this.getStock(item.stockId);
      if (stock) {
        const currentValue = stock.currentPrice * item.quantity;
        const investment = item.averageBuyPrice * item.quantity;
        
        totalValue += currentValue;
        totalInvestment += investment;
      }
    }
    
    return {
      totalValue,
      totalInvestment,
      totalProfit: totalValue - totalInvestment
    };
  }
  
  private generatePortfolioId(userId: number, stockId: number): number {
    // Simple hash function to generate a unique ID for portfolio items
    return ((userId * 1000) + stockId);
  }

  // AI Suggestions related operations
  async getAiSuggestion(id: number): Promise<AiSuggestion | undefined> {
    return this.aiSuggestions.get(id);
  }

  async getStockAiSuggestion(stockId: number): Promise<AiSuggestion | undefined> {
    return Array.from(this.aiSuggestions.values()).find(
      (suggestion) => suggestion.stockId === stockId
    );
  }

  async getAllAiSuggestions(): Promise<AiSuggestion[]> {
    return Array.from(this.aiSuggestions.values());
  }

  async getTopAiSuggestions(limit: number): Promise<AiSuggestion[]> {
    return Array.from(this.aiSuggestions.values())
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, limit);
  }

  async createAiSuggestion(insertSuggestion: InsertAiSuggestion): Promise<AiSuggestion> {
    const id = this.aiSuggestionIdCounter++;
    const now = new Date();
    
    // Set expiration date to 7 days from now if not specified
    const expiresAt = insertSuggestion.expiresAt || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const suggestion: AiSuggestion = { 
      ...insertSuggestion, 
      id, 
      createdAt: now,
      expiresAt
    };
    this.aiSuggestions.set(id, suggestion);
    return suggestion;
  }
  
  async getSuggestionsByType(type: SuggestionType, limit?: number): Promise<AiSuggestion[]> {
    const suggestions = Array.from(this.aiSuggestions.values())
      .filter(suggestion => suggestion.suggestion === type)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      
    return limit ? suggestions.slice(0, limit) : suggestions;
  }
  
  async getSuggestionsByTimeframe(timeframe: TimeFrame, limit?: number): Promise<AiSuggestion[]> {
    const suggestions = Array.from(this.aiSuggestions.values())
      .filter(suggestion => suggestion.timeframe === timeframe)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      
    return limit ? suggestions.slice(0, limit) : suggestions;
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }
  
  async getUserNotifications(userId: number, limit?: number, onlyUnread: boolean = false): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId);
      
    if (onlyUnread) {
      notifications = notifications.filter(notification => !notification.isRead);
    }
    
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? notifications.slice(0, limit) : notifications;
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date()
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification: Notification = {
      ...notification,
      isRead: true
    };
    
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<number> {
    let count = 0;
    
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.userId === userId && !notification.isRead) {
        this.notifications.set(id, { ...notification, isRead: true });
        count++;
      }
    }
    
    return count;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }

  // Chat messages operations
  async getChatMessages(userId: number, limit?: number): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
    return limit ? messages.slice(0, limit) : messages;
  }
  
  async saveChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageIdCounter++;
    const message: ChatMessage = {
      ...chatMessage,
      id,
      createdAt: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }
  
  async clearChatHistory(userId: number): Promise<boolean> {
    const messagesToDelete = Array.from(this.chatMessages.entries())
      .filter(([_, message]) => message.userId === userId)
      .map(([id, _]) => id);
      
    messagesToDelete.forEach(id => this.chatMessages.delete(id));
    
    return true;
  }

  // Initialize with sample data
  private async initializeStocks() {
    // Market indices
    await this.createStock({
      symbol: "NIFTY",
      name: "Nifty 50",
      exchange: "NSE",
      currentPrice: 22055.40,
      previousClose: 21880.00,
      change: 175.40,
      changePercent: 0.82,
      volume: 0,
      marketCap: 0,
      sector: "Index"
    });

    await this.createStock({
      symbol: "SENSEX",
      name: "BSE Sensex",
      exchange: "BSE",
      currentPrice: 72456.10,
      previousClose: 71930.70,
      change: 525.40,
      changePercent: 0.73,
      volume: 0,
      marketCap: 0,
      sector: "Index"
    });

    // Reliance Industries
    const reliance = await this.createStock({
      symbol: "RELIANCE",
      name: "Reliance Industries Ltd",
      exchange: "NSE",
      currentPrice: 2934.55,
      previousClose: 2899.75,
      change: 34.80,
      changePercent: 1.2,
      volume: 4800000,
      marketCap: 19850000000000,
      sector: "Energy & Telecom"
    });

    // HDFC Bank
    const hdfc = await this.createStock({
      symbol: "HDFCBANK",
      name: "HDFC Bank",
      exchange: "NSE",
      currentPrice: 1678.30,
      previousClose: 1687.40,
      change: -9.10,
      changePercent: -0.54,
      volume: 3200000,
      marketCap: 12450000000000,
      sector: "Banking"
    });

    // Infosys
    const infy = await this.createStock({
      symbol: "INFY",
      name: "Infosys Ltd",
      exchange: "NSE",
      currentPrice: 1565.80,
      previousClose: 1579.90,
      change: -14.10,
      changePercent: -0.89,
      volume: 2100000,
      marketCap: 6500000000000,
      sector: "Information Technology"
    });

    // Add more stocks
    const tataMotors = await this.createStock({
      symbol: "TATAMOTORS",
      name: "Tata Motors",
      exchange: "NSE",
      currentPrice: 944.65,
      previousClose: 935.20,
      change: 9.45,
      changePercent: 1.01,
      volume: 3500000,
      marketCap: 3100000000000,
      sector: "Automobile"
    });

    const bajajFinance = await this.createStock({
      symbol: "BAJFINANCE",
      name: "Bajaj Finance",
      exchange: "NSE",
      currentPrice: 6932.45,
      previousClose: 6985.30,
      change: -52.85,
      changePercent: -0.76,
      volume: 1900000,
      marketCap: 4200000000000,
      sector: "Financial Services"
    });

    const bhartiAirtel = await this.createStock({
      symbol: "BHARTIARTL",
      name: "Bharti Airtel",
      exchange: "NSE",
      currentPrice: 1287.30,
      previousClose: 1290.75,
      change: -3.45,
      changePercent: -0.27,
      volume: 2700000,
      marketCap: 7180000000000,
      sector: "Telecommunications"
    });

    // Create AI suggestions
    await this.createAiSuggestion({
      stockId: reliance.id,
      suggestion: SuggestionType.BUY,
      targetPrice: 2980,
      stopLoss: 2900,
      confidence: 85,
      rationale: "Strong institutional buying detected with increased volume. Resistance at ₹2,980 with support at ₹2,900."
    });

    await this.createAiSuggestion({
      stockId: hdfc.id,
      suggestion: SuggestionType.SELL,
      targetPrice: 1650,
      stopLoss: 1700,
      confidence: 78,
      rationale: "Technical indicators showing bearish pattern with decreasing volume. Selling pressure expected to continue."
    });

    await this.createAiSuggestion({
      stockId: infy.id,
      suggestion: SuggestionType.HOLD,
      targetPrice: 1580,
      stopLoss: 1540,
      confidence: 65,
      rationale: "Consolidation phase within a defined range. Wait for breakout before making trading decisions."
    });

    await this.createAiSuggestion({
      stockId: tataMotors.id,
      suggestion: SuggestionType.BUY,
      targetPrice: 980,
      stopLoss: 925,
      confidence: 82,
      rationale: "Strong bullish momentum with recent volume spike and positive sector outlook."
    });

    await this.createAiSuggestion({
      stockId: bajajFinance.id,
      suggestion: SuggestionType.SELL,
      targetPrice: 6800,
      stopLoss: 7000,
      confidence: 78,
      rationale: "Bearish pattern detected with negative divergence in momentum indicators."
    });

    await this.createAiSuggestion({
      stockId: bhartiAirtel.id,
      suggestion: SuggestionType.WATCH,
      targetPrice: 1320,
      stopLoss: 1260,
      confidence: 60,
      rationale: "Approaching critical resistance level with mixed volume signals. Monitor closely."
    });
  }
}

export const storage = new MemStorage();
