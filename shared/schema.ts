import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  profileImage: text("profile_image"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  profileImage: true,
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
});

export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stockId: integer("stock_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertWatchlistSchema = createInsertSchema(watchlists).pick({
  userId: true,
  stockId: true,
});

export const aiSuggestions = pgTable("ai_suggestions", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id").notNull(),
  suggestion: text("suggestion").notNull(), // BUY, SELL, HOLD
  targetPrice: real("target_price"),
  stopLoss: real("stop_loss"),
  confidence: integer("confidence"), // 0-100
  rationale: text("rationale"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).pick({
  stockId: true,
  suggestion: true,
  targetPrice: true,
  stopLoss: true,
  confidence: true,
  rationale: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;

export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;

export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;

// UI Types
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
