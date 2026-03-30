import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // User preferences
  languageCode: varchar("languageCode", { length: 10 }).default("en"),
  countryCode: varchar("countryCode", { length: 10 }),
  postalCode: varchar("postalCode", { length: 20 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table - stores product information from backend API
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 255 }).notNull().unique(), // External product ID from API
  name: text("name").notNull(),
  brand: varchar("brand", { length: 255 }),
  model: varchar("model", { length: 255 }),
  category: varchar("category", { length: 100 }),
  imageUrl: text("imageUrl"),
  barcode: varchar("barcode", { length: 100 }),
  
  // Product metadata stored as JSON
  metadata: json("metadata").$type<{
    specifications?: Record<string, string>;
    careInstructions?: string[];
    sustainabilityScore?: number;
    warrantyInfo?: string;
    description?: string;
  }>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product instances - user-owned products with custom data
 */
export const productInstances = mysqlTable("product_instances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(), // References products.id
  
  // Custom user data
  nickname: varchar("nickname", { length: 255 }),
  purchaseDate: timestamp("purchaseDate"),
  purchasePrice: int("purchasePrice"), // Store as cents
  purchaseLocation: varchar("purchaseLocation", { length: 255 }),
  warrantyExpiry: timestamp("warrantyExpiry"),
  notes: text("notes"),
  
  // Custom tags as JSON array
  tags: json("tags").$type<string[]>(),
  
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductInstance = typeof productInstances.$inferSelect;
export type InsertProductInstance = typeof productInstances.$inferInsert;

/**
 * Scan history - tracks products scanned but not owned
 */
export const scanHistory = mysqlTable("scan_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(), // References products.id
  scannedAt: timestamp("scannedAt").defaultNow().notNull(),
});

export type ScanHistory = typeof scanHistory.$inferSelect;
export type InsertScanHistory = typeof scanHistory.$inferInsert;

/**
 * AI conversations - stores chat history with AI assistant
 */
export const aiConversations = mysqlTable("ai_conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId"), // Optional - conversation may be about a specific product
  
  provider: varchar("provider", { length: 50 }).notNull(), // openai, gemini, perplexity, deepseek
  
  // Conversation messages stored as JSON array
  messages: json("messages").$type<Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
  }>>().notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

/**
 * AI provider settings - stores user's API keys for different AI providers
 */
export const aiProviderSettings = mysqlTable("ai_provider_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // openai, gemini, perplexity, deepseek
  apiKey: text("apiKey").notNull(), // Encrypted API key
  isActive: boolean("isActive").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiProviderSetting = typeof aiProviderSettings.$inferSelect;
export type InsertAiProviderSetting = typeof aiProviderSettings.$inferInsert;

/**
 * Product documentation - receipts, photos, notes attached to products
 */
export const productDocuments = mysqlTable("product_documents", {
  id: int("id").autoincrement().primaryKey(),
  productInstanceId: int("productInstanceId").notNull(),
  userId: int("userId").notNull(),
  
  documentType: varchar("documentType", { length: 50 }).notNull(), // receipt, photo, manual, note
  title: varchar("title", { length: 255 }),
  fileUrl: text("fileUrl"), // S3 URL for files
  fileKey: varchar("fileKey", { length: 500 }), // S3 key for file management
  mimeType: varchar("mimeType", { length: 100 }),
  textContent: text("textContent"), // For notes
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductDocument = typeof productDocuments.$inferSelect;
export type InsertProductDocument = typeof productDocuments.$inferInsert;
