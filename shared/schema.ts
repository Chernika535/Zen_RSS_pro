import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  link: text("link").notNull().unique(),
  author: text("author"),
  pubDate: timestamp("pub_date").notNull(),
  category: jsonb("category").$type<string[]>().default([]),
  description: text("description"),
  content: text("content").notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  status: varchar("status", { enum: ["pending", "processing", "processed", "error"] }).notNull().default("pending"),
  errorMessage: text("error_message"),
  zenCompliant: boolean("zen_compliant").default(false),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const rssConfig = pgTable("rss_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceUrl: text("source_url").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  siteLink: text("site_link").notNull(),
  language: text("language").default("ru"),
  checkInterval: varchar("check_interval").default("30"),
  isActive: boolean("is_active").default(true),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const processingStats = pgTable("processing_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalArticles: varchar("total_articles").default("0"),
  processedArticles: varchar("processed_articles").default("0"),
  errorCount: varchar("error_count").default("0"),
  averageProcessingTime: text("average_processing_time").default("0"),
  lastUpdated: timestamp("last_updated").default(sql`now()`),
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertRssConfigSchema = createInsertSchema(rssConfig).omit({
  id: true,
  createdAt: true,
  lastChecked: true,
});

export const insertProcessingStatsSchema = createInsertSchema(processingStats).omit({
  id: true,
  lastUpdated: true,
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export type RssConfig = typeof rssConfig.$inferSelect;
export type InsertRssConfig = z.infer<typeof insertRssConfigSchema>;

export type ProcessingStats = typeof processingStats.$inferSelect;
export type InsertProcessingStats = z.infer<typeof insertProcessingStatsSchema>;
