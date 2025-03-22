import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWatchlistSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

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

  const httpServer = createServer(app);
  return httpServer;
}
