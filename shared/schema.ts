import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  profileImage: text("profile_image"),
  phoneNumber: text("phone_number"),
  preferences: jsonb("preferences"),
  accountBalance: real("account_balance").default(10000), // Virtual trading balance
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  profileImage: true,
  phoneNumber: true,
  preferences: true,
});

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  exchange: text("exchange").notNull(),
  currentPrice: real("current_price").notNull(),
  previousClose: real("previous_close").notNull(),
  change: real("change"),
  changePercent: real("change_percent"),
  volume: integer("volume"),
  marketCap: real("market_cap"),
  sector: text("sector"),
  high52Week: real("high_52_week"),
  low52Week: real("low_52_week"),
  eps: real("eps"),
  pe: real("pe"),
  dividend: real("dividend"),
  dividendYield: real("dividend_yield"),
  beta: real("beta"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStockSchema = createInsertSchema(stocks).pick({
  symbol: true,
  name: true,
  exchange: true,
  currentPrice: true,
  previousClose: true,
  change: true,
  changePercent: true,
  volume: true,
  marketCap: true,
  sector: true,
  high52Week: true,
  low52Week: true,
  eps: true,
  pe: true,
  dividend: true,
  dividendYield: true,
  beta: true,
  description: true,
});

export const stockHistoricalData = pgTable("stock_historical_data", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull(),
  date: timestamp("date").notNull(),
  open: real("open").notNull(),
  high: real("high").notNull(),
  low: real("low").notNull(),
  close: real("close").notNull(),
  volume: integer("volume").notNull(),
});

export const insertHistoricalDataSchema = createInsertSchema(stockHistoricalData).pick({
  stockId: true,
  date: true,
  open: true,
  high: true,
  low: true,
  close: true,
  volume: true,
});

export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stockId: integer("stock_id").notNull(),
  notes: text("notes"),
  addedAt: timestamp("added_at").defaultNow(),
  alertPrice: real("alert_price"),
  alertCondition: text("alert_condition"), // above, below
});

export const insertWatchlistSchema = createInsertSchema(watchlists).pick({
  userId: true,
  stockId: true,
  notes: true,
  alertPrice: true,
  alertCondition: true,
});

export const tradingStrategies = pgTable("trading_strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false),
  conditions: jsonb("conditions").notNull(),  // JSON describing the strategy conditions
  actions: jsonb("actions").notNull(),       // JSON describing what actions to take
  backtestResults: jsonb("backtest_results"), // Results from backtesting
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTradingStrategySchema = createInsertSchema(tradingStrategies).pick({
  userId: true,
  name: true, 
  description: true,
  isActive: true,
  conditions: true,
  actions: true,
  backtestResults: true,
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stockId: integer("stock_id").notNull(),
  type: text("type").notNull(), // "BUY" or "SELL"
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  totalAmount: real("total_amount").notNull(),
  status: text("status").notNull(), // "PENDING", "COMPLETED", "FAILED"
  strategyId: integer("strategy_id"), // If transaction was triggered by a strategy
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  stockId: true,
  type: true,
  quantity: true,
  price: true,
  totalAmount: true,
  status: true,
  strategyId: true,
});

export const portfolio = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stockId: integer("stock_id").notNull(),
  quantity: integer("quantity").notNull(),
  averageBuyPrice: real("average_buy_price").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPortfolioSchema = createInsertSchema(portfolio).pick({
  userId: true,
  stockId: true,
  quantity: true,
  averageBuyPrice: true,
});

export const aiSuggestions = pgTable("ai_suggestions", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull(),
  suggestion: text("suggestion").notNull(), // BUY, SELL, HOLD, WATCH
  targetPrice: real("target_price"),
  stopLoss: real("stop_loss"),
  confidence: integer("confidence"), // 0-100
  rationale: text("rationale"),
  timeframe: text("timeframe"), // "SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).pick({
  stockId: true,
  suggestion: true,
  targetPrice: true,
  stopLoss: true,
  confidence: true,
  rationale: true,
  timeframe: true,
  expiresAt: true,
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "PRICE_ALERT", "STRATEGY_ALERT", "AI_SUGGESTION", "SYSTEM"
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedEntityType: text("related_entity_type"), // "STOCK", "STRATEGY", "SUGGESTION"
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  isRead: true,
  relatedEntityType: true,
  relatedEntityId: true,
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sender: text("sender").notNull(), // "USER" or "AI"
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  context: jsonb("context"), // Context data for the AI to maintain conversation state
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  sender: true,
  message: true,
  context: true,
});

// Define advanced types for the schema
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;

export type StockHistoricalData = typeof stockHistoricalData.$inferSelect;
export type InsertStockHistoricalData = z.infer<typeof insertHistoricalDataSchema>;

export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;

export type TradingStrategy = typeof tradingStrategies.$inferSelect;
export type InsertTradingStrategy = z.infer<typeof insertTradingStrategySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Portfolio = typeof portfolio.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// UI Types and Enums
export enum StockSentiment {
  VERY_BULLISH = "Very Bullish",
  BULLISH = "Bullish",
  NEUTRAL = "Neutral",
  BEARISH = "Bearish",
  VERY_BEARISH = "Very Bearish"
}

export enum SuggestionType {
  BUY = "BUY",
  SELL = "SELL",
  HOLD = "HOLD",
  WATCH = "WATCH"
}

export enum TransactionType {
  BUY = "BUY",
  SELL = "SELL"
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

export enum NotificationType {
  PRICE_ALERT = "PRICE_ALERT",
  STRATEGY_ALERT = "STRATEGY_ALERT",
  AI_SUGGESTION = "AI_SUGGESTION",
  SYSTEM = "SYSTEM"
}

export enum TimeFrame {
  SHORT_TERM = "SHORT_TERM",
  MEDIUM_TERM = "MEDIUM_TERM",
  LONG_TERM = "LONG_TERM"
}
