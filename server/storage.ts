import {
  users, type User, type InsertUser,
  stocks, type Stock, type InsertStock,
  watchlists, type Watchlist, type InsertWatchlist,
  aiSuggestions, type AiSuggestion, type InsertAiSuggestion,
  SuggestionType
} from "@shared/schema";

export interface IStorage {
  // User related operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Stocks related operations
  getStock(id: number): Promise<Stock | undefined>;
  getStockBySymbol(symbol: string): Promise<Stock | undefined>;
  getAllStocks(): Promise<Stock[]>;
  getTopStocks(limit: number): Promise<Stock[]>;
  createStock(stock: InsertStock): Promise<Stock>;
  updateStockPrice(id: number, price: number, change: number, changePercent: number): Promise<Stock | undefined>;

  // Watchlist related operations
  addToWatchlist(watchlistItem: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(userId: number, stockId: number): Promise<boolean>;
  getUserWatchlist(userId: number): Promise<Stock[]>;
  isStockInWatchlist(userId: number, stockId: number): Promise<boolean>;

  // AI suggestions related operations
  getAiSuggestion(id: number): Promise<AiSuggestion | undefined>;
  getStockAiSuggestion(stockId: number): Promise<AiSuggestion | undefined>;
  getAllAiSuggestions(): Promise<AiSuggestion[]>;
  getTopAiSuggestions(limit: number): Promise<AiSuggestion[]>;
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stocks: Map<number, Stock>;
  private watchlists: Map<number, Watchlist>;
  private aiSuggestions: Map<number, AiSuggestion>;
  private userIdCounter: number;
  private stockIdCounter: number;
  private watchlistIdCounter: number;
  private aiSuggestionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.stocks = new Map();
    this.watchlists = new Map();
    this.aiSuggestions = new Map();
    this.userIdCounter = 1;
    this.stockIdCounter = 1;
    this.watchlistIdCounter = 1;
    this.aiSuggestionIdCounter = 1;
    
    // Initialize with some sample stocks and AI suggestions
    this.initializeStocks();
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
    const stock: Stock = { ...insertStock, id };
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
      changePercent
    };
    
    this.stocks.set(id, updatedStock);
    return updatedStock;
  }

  // Watchlist related operations
  async addToWatchlist(insertWatchlist: InsertWatchlist): Promise<Watchlist> {
    const id = this.watchlistIdCounter++;
    const watchlist: Watchlist = { 
      ...insertWatchlist, 
      id, 
      addedAt: new Date() 
    };
    this.watchlists.set(id, watchlist);
    return watchlist;
  }

  async removeFromWatchlist(userId: number, stockId: number): Promise<boolean> {
    const watchlistId = Array.from(this.watchlists.entries()).find(
      ([_, item]) => item.userId === userId && item.stockId === stockId
    )?.[0];
    
    if (watchlistId) {
      return this.watchlists.delete(watchlistId);
    }
    
    return false;
  }

  async getUserWatchlist(userId: number): Promise<Stock[]> {
    const userWatchlistItems = Array.from(this.watchlists.values()).filter(
      (item) => item.userId === userId
    );
    
    const stockIds = userWatchlistItems.map((item) => item.stockId);
    
    return Array.from(this.stocks.values()).filter(
      (stock) => stockIds.includes(stock.id)
    );
  }

  async isStockInWatchlist(userId: number, stockId: number): Promise<boolean> {
    return Array.from(this.watchlists.values()).some(
      (item) => item.userId === userId && item.stockId === stockId
    );
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
    const suggestion: AiSuggestion = { 
      ...insertSuggestion, 
      id, 
      createdAt: new Date() 
    };
    this.aiSuggestions.set(id, suggestion);
    return suggestion;
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
