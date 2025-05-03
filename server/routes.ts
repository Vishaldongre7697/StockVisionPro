import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import axios from "axios";
import { 
  insertUserSchema, 
  insertWatchlistSchema, 
  insertAiSuggestionSchema, 
  insertTradingStrategySchema,
  insertTransactionSchema,
  insertPortfolioSchema,
  insertHistoricalDataSchema,
  insertNotificationSchema,
  insertChatMessageSchema,
  SuggestionType,
  TransactionType,
  TransactionStatus,
  NotificationType,
  TimeFrame
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Basic authentication middleware
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if userId is available in request body, params, or query
    const userId = req.body.userId || req.params.userId || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(Number(userId));
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Update last login time
    await storage.updateLastLogin(user.id);
    
    // Add user to request for other route handlers
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Authentication failed" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // User Authentication Routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Create new user
      const newUser = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to register user" });
      }
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to authenticate user" });
    }
  });

  // Stock Routes
  app.get("/api/stocks", async (_req: Request, res: Response) => {
    try {
      const stocks = await storage.getAllStocks();
      res.status(200).json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stocks" });
    }
  });

  app.get("/api/stocks/top", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const topStocks = await storage.getTopStocks(limit);
      res.status(200).json(topStocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top stocks" });
    }
  });

  app.get("/api/stocks/:symbol", async (req: Request, res: Response) => {
    try {
      const symbol = req.params.symbol;
      const stock = await storage.getStockBySymbol(symbol);
      
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }
      
      res.status(200).json(stock);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });

  // Watchlist Routes
  app.get("/api/watchlist/:userId", async (req: Request, res: Response) => {
    try {
      // Handle special case for guest user
      if (req.params.userId === 'guest') {
        // For guest users, return top trending stocks
        const topStocks = await storage.getTopStocks(6);
        return res.status(200).json(topStocks);
      }
      
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const watchlist = await storage.getUserWatchlist(userId);
      res.status(200).json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist", async (req: Request, res: Response) => {
    try {
      // Special handling for guest user
      if (req.body.userId === 'guest') {
        return res.status(200).json({ 
          id: 0, 
          userId: 'guest', 
          stockId: req.body.stockId,
          addedAt: new Date(),
          notes: null,
          alertPrice: null,
          alertCondition: null
        });
      }

      const watchlistData = insertWatchlistSchema.parse(req.body);
      
      // Check if stock is already in watchlist
      const isInWatchlist = await storage.isStockInWatchlist(
        watchlistData.userId,
        watchlistData.stockId
      );
      
      if (isInWatchlist) {
        return res.status(400).json({ message: "Stock already in watchlist" });
      }
      
      const result = await storage.addToWatchlist(watchlistData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to add to watchlist" });
      }
    }
  });

  app.delete("/api/watchlist/:userId/:stockId", async (req: Request, res: Response) => {
    try {
      // Handle special case for guest user
      if (req.params.userId === 'guest') {
        const stockId = parseInt(req.params.stockId);
        if (isNaN(stockId)) {
          return res.status(400).json({ message: "Invalid stock ID" });
        }
        // For guest, just return success
        return res.status(200).json({ message: "Stock removed from watchlist" });
      }
      
      const userId = parseInt(req.params.userId);
      const stockId = parseInt(req.params.stockId);
      
      if (isNaN(userId) || isNaN(stockId)) {
        return res.status(400).json({ message: "Invalid user ID or stock ID" });
      }
      
      const result = await storage.removeFromWatchlist(userId, stockId);
      
      if (!result) {
        return res.status(404).json({ message: "Stock not found in watchlist" });
      }
      
      res.status(200).json({ message: "Stock removed from watchlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // AI Suggestions Routes
  app.get("/api/ai-suggestions", async (_req: Request, res: Response) => {
    try {
      const suggestions = await storage.getAllAiSuggestions();
      res.status(200).json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI suggestions" });
    }
  });

  app.get("/api/ai-suggestions/top", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      const topSuggestions = await storage.getTopAiSuggestions(limit);
      
      // Get the corresponding stock for each suggestion
      const suggestionsWithStock = await Promise.all(
        topSuggestions.map(async (suggestion) => {
          const stock = await storage.getStock(suggestion.stockId);
          return { ...suggestion, stock };
        })
      );
      
      res.status(200).json(suggestionsWithStock);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top AI suggestions" });
    }
  });

  app.get("/api/ai-suggestions/stock/:stockId", async (req: Request, res: Response) => {
    try {
      const stockId = parseInt(req.params.stockId);
      
      if (isNaN(stockId)) {
        return res.status(400).json({ message: "Invalid stock ID" });
      }
      
      const suggestion = await storage.getStockAiSuggestion(stockId);
      
      if (!suggestion) {
        return res.status(404).json({ message: "AI suggestion not found for this stock" });
      }
      
      res.status(200).json(suggestion);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI suggestion" });
    }
  });
  
  app.get("/api/ai-suggestions/by-type/:type", async (req: Request, res: Response) => {
    try {
      const type = req.params.type as SuggestionType;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!Object.values(SuggestionType).includes(type)) {
        return res.status(400).json({ message: "Invalid suggestion type" });
      }
      
      const suggestions = await storage.getSuggestionsByType(type, limit);
      
      // Get the corresponding stock for each suggestion
      const suggestionsWithStock = await Promise.all(
        suggestions.map(async (suggestion) => {
          const stock = await storage.getStock(suggestion.stockId);
          return { ...suggestion, stock };
        })
      );
      
      res.status(200).json(suggestionsWithStock);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestions by type" });
    }
  });
  
  // Historical Data Routes
  app.get("/api/stocks/:stockId/historical", async (req: Request, res: Response) => {
    try {
      const stockId = parseInt(req.params.stockId);
      
      if (isNaN(stockId)) {
        return res.status(400).json({ message: "Invalid stock ID" });
      }
      
      // Parse start and end dates if provided
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const historicalData = await storage.getStockHistoricalData(stockId, startDate, endDate);
      res.status(200).json(historicalData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch historical data" });
    }
  });
  
  // Portfolio Routes
  app.get("/api/portfolio/:userId", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const portfolio = await storage.getUserPortfolio(userId);
      
      // Enrich with stock data
      const enrichedPortfolio = await Promise.all(
        portfolio.map(async (item) => {
          const stock = await storage.getStock(item.stockId);
          return {
            ...item,
            stock,
            currentValue: stock ? stock.currentPrice * item.quantity : 0,
            investmentValue: item.averageBuyPrice * item.quantity,
            profitLoss: stock ? (stock.currentPrice - item.averageBuyPrice) * item.quantity : 0,
            profitLossPercent: stock ? ((stock.currentPrice - item.averageBuyPrice) / item.averageBuyPrice) * 100 : 0
          };
        })
      );
      
      res.status(200).json(enrichedPortfolio);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });
  
  app.get("/api/portfolio/:userId/summary", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const summary = await storage.getPortfolioValue(userId);
      const user = await storage.getUser(userId);
      
      res.status(200).json({
        ...summary,
        accountBalance: user?.accountBalance || 0,
        totalAssets: (user?.accountBalance || 0) + summary.totalValue
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio summary" });
    }
  });
  
  app.post("/api/portfolio", authenticate, async (req: Request, res: Response) => {
    try {
      const portfolioData = insertPortfolioSchema.parse(req.body);
      
      // Check if user has enough balance
      const user = await storage.getUser(portfolioData.userId);
      const stock = await storage.getStock(portfolioData.stockId);
      
      if (!user || !stock) {
        return res.status(404).json({ message: "User or stock not found" });
      }
      
      const totalCost = portfolioData.averageBuyPrice * portfolioData.quantity;
      
      if (!user.accountBalance || user.accountBalance < totalCost) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create portfolio item
      const result = await storage.createPortfolioItem(portfolioData);
      
      // Update user balance
      await storage.updateAccountBalance(user.id, (user.accountBalance || 0) - totalCost);
      
      // Create a transaction record
      await storage.createTransaction({
        userId: user.id,
        stockId: stock.id,
        type: TransactionType.BUY,
        quantity: portfolioData.quantity,
        price: portfolioData.averageBuyPrice,
        totalAmount: totalCost,
        status: TransactionStatus.COMPLETED
      });
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to add to portfolio" });
      }
    }
  });
  
  app.put("/api/portfolio/:userId/:stockId", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const stockId = parseInt(req.params.stockId);
      const { quantity, averageBuyPrice } = req.body;
      
      if (isNaN(userId) || isNaN(stockId)) {
        return res.status(400).json({ message: "Invalid user ID or stock ID" });
      }
      
      const result = await storage.updatePortfolioItem(userId, stockId, quantity, averageBuyPrice);
      
      if (!result) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to update portfolio item" });
    }
  });
  
  app.delete("/api/portfolio/:userId/:stockId", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const stockId = parseInt(req.params.stockId);
      
      if (isNaN(userId) || isNaN(stockId)) {
        return res.status(400).json({ message: "Invalid user ID or stock ID" });
      }
      
      // Get portfolio item and stock before deletion
      const portfolioItem = await storage.getPortfolioItem(userId, stockId);
      const stock = await storage.getStock(stockId);
      
      if (!portfolioItem || !stock) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      
      // Calculate sale amount at current price
      const saleAmount = stock.currentPrice * portfolioItem.quantity;
      
      // Delete portfolio item
      const result = await storage.deletePortfolioItem(userId, stockId);
      
      if (!result) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      
      // Update user balance with sale proceeds
      const user = await storage.getUser(userId);
      if (user) {
        const currentBalance = user.accountBalance || 0;
        await storage.updateAccountBalance(userId, currentBalance + saleAmount);
        
        // Create a transaction record
        await storage.createTransaction({
          userId,
          stockId,
          type: TransactionType.SELL,
          quantity: portfolioItem.quantity,
          price: stock.currentPrice,
          totalAmount: saleAmount,
          status: TransactionStatus.COMPLETED
        });
      }
      
      res.status(200).json({ message: "Portfolio item sold successfully", saleAmount });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete portfolio item" });
    }
  });
  
  // Trading Strategies Routes
  app.get("/api/strategies/:userId", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const strategies = await storage.getUserStrategies(userId);
      res.status(200).json(strategies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trading strategies" });
    }
  });
  
  app.post("/api/strategies", authenticate, async (req: Request, res: Response) => {
    try {
      const strategyData = insertTradingStrategySchema.parse(req.body);
      const result = await storage.createStrategy(strategyData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create trading strategy" });
      }
    }
  });
  
  app.put("/api/strategies/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid strategy ID" });
      }
      
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Trading strategy not found" });
      }
      
      // Make sure user owns the strategy
      if (strategy.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Not authorized to update this strategy" });
      }
      
      const result = await storage.updateStrategy(id, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to update trading strategy" });
    }
  });
  
  app.delete("/api/strategies/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid strategy ID" });
      }
      
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Trading strategy not found" });
      }
      
      // Make sure user owns the strategy
      if (strategy.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Not authorized to delete this strategy" });
      }
      
      const result = await storage.deleteStrategy(id);
      
      if (!result) {
        return res.status(404).json({ message: "Trading strategy not found" });
      }
      
      res.status(200).json({ message: "Trading strategy deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete trading strategy" });
    }
  });
  
  app.put("/api/strategies/:id/toggle", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (isNaN(id) || typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "Invalid parameters" });
      }
      
      const strategy = await storage.getStrategy(id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Trading strategy not found" });
      }
      
      // Make sure user owns the strategy
      if (strategy.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Not authorized to update this strategy" });
      }
      
      const result = await storage.toggleStrategyStatus(id, isActive);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to update strategy status" });
    }
  });
  
  // Transactions Routes
  app.get("/api/transactions/:userId", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || undefined;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const transactions = await storage.getUserTransactions(userId, limit);
      
      // Enrich with stock data
      const enrichedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          const stock = await storage.getStock(transaction.stockId);
          return { ...transaction, stock };
        })
      );
      
      res.status(200).json(enrichedTransactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // Notifications Routes
  app.get("/api/notifications/:userId", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || undefined;
      const onlyUnread = req.query.unread === 'true';
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const notifications = await storage.getUserNotifications(userId, limit, onlyUnread);
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  app.post("/api/notifications/:id/read", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const notification = await storage.getNotification(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Make sure notification belongs to the user
      if (notification.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Not authorized to update this notification" });
      }
      
      const result = await storage.markNotificationAsRead(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  app.post("/api/notifications/:userId/read-all", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const count = await storage.markAllNotificationsAsRead(userId);
      res.status(200).json({ message: `${count} notifications marked as read` });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });
  
  // Chat Messages Routes
  app.get("/api/chat/:userId", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || undefined;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const messages = await storage.getChatMessages(userId, limit);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  
  app.post("/api/chat", authenticate, async (req: Request, res: Response) => {
    try {
      const chatMessageData = insertChatMessageSchema.parse(req.body);
      const userMessage = await storage.saveChatMessage(chatMessageData);
      
      // If it's a user message, generate an AI response
      if (chatMessageData.sender === 'USER') {
        // Get the user's portfolio data to personalize the response
        const portfolio = await storage.getUserPortfolio(chatMessageData.userId);
        const userStocks = await Promise.all(
          portfolio.map(async item => {
            const stock = await storage.getStock(item.stockId);
            return stock?.name || '';
          })
        );
        
        // Create AI response based on user message
        const aiResponse = {
          userId: chatMessageData.userId,
          sender: 'AI',
          message: generateAiResponse(chatMessageData.message, userStocks),
          context: {}
        };
        
        const aiMessage = await storage.saveChatMessage(aiResponse);
        
        res.status(201).json({ userMessage, aiMessage });
      } else {
        res.status(201).json({ userMessage });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to send chat message" });
      }
    }
  });
  
  app.delete("/api/chat/:userId", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      await storage.clearChatHistory(userId);
      res.status(200).json({ message: "Chat history cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear chat history" });
    }
  });
  
  // Helper function to generate AI responses to user messages
  function generateAiResponse(userMessage: string, userStocks: string[]): string {
    userMessage = userMessage.toLowerCase();
    
    // Check for greetings
    if (userMessage.match(/hi|hello|hey|greetings/)) {
      return `Hello! I'm SuhuAI, your personal trading assistant. How can I help you today?`;
    }
    
    // Check for questions about portfolio
    if (userMessage.includes('portfolio') || userMessage.includes('holdings')) {
      if (userStocks.length === 0) {
        return `You don't have any stocks in your portfolio yet. Would you like some recommendations on what to buy?`;
      } else {
        return `Your portfolio contains ${userStocks.join(', ')}. Would you like me to analyze any specific stock?`;
      }
    }
    
    // Check for stock recommendation requests
    if (userMessage.match(/recommend|suggestion|what.*buy|should.*buy/)) {
      return `Based on current market conditions, I recommend considering stocks in the technology and renewable energy sectors. Some specific stocks worth looking at are Reliance Industries, HDFC Bank, and Infosys based on their strong fundamentals and growth potential.`;
    }
    
    // Check for market questions
    if (userMessage.match(/market|nifty|sensex|index/)) {
      return `The market is showing mixed signals currently. Nifty is up slightly, but there's volatility due to global factors. It's important to maintain a diversified portfolio in the current conditions.`;
    }
    
    // Default response for other messages
    return `I understand you're asking about "${userMessage}". As your AI trading assistant, I'm continuously learning to provide better insights. Could you provide more details about what you'd like to know?`;
  }

  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time market data
  const STOCK_API_KEY = process.env.VITE_STOCK_API_KEY || '';
  const BASE_URL = 'https://www.alphavantage.co/query';
  
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections and their subscriptions
  const clients = new Map();
  
  wss.on('connection', (socket) => {
    console.log('WebSocket client connected');
    
    // Add client to our map with empty subscriptions
    const clientId = Date.now();
    clients.set(clientId, {
      socket,
      subscriptions: new Set()
    });
    
    // Handle subscription messages
    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe' && data.symbol) {
          const client = clients.get(clientId);
          if (client) {
            client.subscriptions.add(data.symbol);
            console.log(`Client ${clientId} subscribed to ${data.symbol}`);
            
            // Send initial data immediately
            try {
              const stockData = await fetchStockData(data.symbol);
              socket.send(JSON.stringify({
                type: 'stock_update',
                symbol: data.symbol,
                data: stockData
              }));
            } catch (error) {
              console.error(`Error fetching initial data for ${data.symbol}:`, error);
            }
          }
        } else if (data.type === 'unsubscribe' && data.symbol) {
          const client = clients.get(clientId);
          if (client && client.subscriptions.has(data.symbol)) {
            client.subscriptions.delete(data.symbol);
            console.log(`Client ${clientId} unsubscribed from ${data.symbol}`);
          }
        }
      } catch (err) {
        console.error('Invalid WebSocket message:', err);
      }
    });
    
    // Handle disconnection
    socket.on('close', () => {
      console.log(`WebSocket client ${clientId} disconnected`);
      clients.delete(clientId);
    });
  });
  
  // Helper function to fetch stock data
  async function fetchStockData(symbol: string) {
    try {
      if (!STOCK_API_KEY) {
        throw new Error('API key missing');
      }
      
      // Get quote data
      const quoteRes = await axios.get(
        `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${STOCK_API_KEY}`
      );
      
      const quote = quoteRes.data['Global Quote'];
      
      return {
        symbol: symbol,
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      throw error;
    }
  }
  
  // Set up periodic updates for subscribed stocks
  // Note: This is a simplified implementation that respects API rate limits
  // In a production environment, you might want to use a more sophisticated approach
  setInterval(async () => {
    // Get all unique symbols that clients are subscribed to
    const symbols = new Set<string>();
    clients.forEach((client) => {
      client.subscriptions.forEach((symbol: string) => {
        symbols.add(symbol);
      });
    });
    
    // Fetch data for each symbol and broadcast to subscribed clients
    Array.from(symbols).forEach(async (symbol) => {
      try {
        const stockData = await fetchStockData(symbol);
        
        // Broadcast to all clients subscribed to this symbol
        clients.forEach((client, clientId) => {
          if (client.subscriptions.has(symbol) && client.socket.readyState === WebSocket.OPEN) {
            client.socket.send(JSON.stringify({
              type: 'stock_update',
              symbol,
              data: stockData
            }));
          }
        });
      } catch (error) {
        console.error(`Error updating stock data for ${symbol}:`, error);
      }
      
      // Add a small delay between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    });
  }, 60000); // Update every minute
  
  return httpServer;
}
