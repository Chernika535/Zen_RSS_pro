import { type Article, type InsertArticle, type RssConfig, type InsertRssConfig, type ProcessingStats, type InsertProcessingStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Articles
  getArticles(): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | undefined>;
  getArticleByLink(link: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, updates: Partial<Article>): Promise<Article>;
  deleteArticle(id: string): Promise<void>;
  
  // RSS Config
  getRssConfig(): Promise<RssConfig | undefined>;
  createRssConfig(config: InsertRssConfig): Promise<RssConfig>;
  updateRssConfig(id: string, updates: Partial<RssConfig>): Promise<RssConfig>;
  
  // Processing Stats
  getProcessingStats(): Promise<ProcessingStats>;
  updateProcessingStats(updates: Partial<ProcessingStats>): Promise<ProcessingStats>;
}

export class MemStorage implements IStorage {
  private articles: Map<string, Article>;
  private rssConfigs: Map<string, RssConfig>;
  private stats: ProcessingStats;

  constructor() {
    this.articles = new Map();
    this.rssConfigs = new Map();
    this.stats = {
      id: randomUUID(),
      totalArticles: "0",
      processedArticles: "0",
      errorCount: "0",
      averageProcessingTime: "0",
      lastUpdated: new Date(),
    };
    
    // Initialize default RSS config
    this.initializeDefaultConfig();
  }

  private initializeDefaultConfig() {
    const defaultConfig: RssConfig = {
      id: randomUUID(),
      sourceUrl: "https://neiromantra.ru/12583-feed.xml",
      title: "RSS to Zen Bridge",
      description: "Automated RSS to Yandex Zen publishing service",
      siteLink: "https://neiromantra.ru",
      language: "ru",
      checkInterval: "30",
      isActive: true,
      lastChecked: null,
      createdAt: new Date(),
    };
    this.rssConfigs.set(defaultConfig.id, defaultConfig);
  }

  // Articles
  async getArticles(): Promise<Article[]> {
    return Array.from(this.articles.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticleByLink(link: string): Promise<Article | undefined> {
    return Array.from(this.articles.values()).find(article => article.link === link);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const article: Article = {
      ...insertArticle,
      id,
      description: insertArticle.description || null,
      author: insertArticle.author || null,
      createdAt: new Date(),
      processedAt: null,
    };
    this.articles.set(id, article);
    await this.updateStatsOnCreate();
    return article;
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
    const article = this.articles.get(id);
    if (!article) {
      throw new Error(`Article with id ${id} not found`);
    }
    
    const updatedArticle = { ...article, ...updates };
    if (updates.status === "processed" || updates.status === "error") {
      updatedArticle.processedAt = new Date();
    }
    
    this.articles.set(id, updatedArticle);
    await this.updateStatsOnUpdate(updates);
    return updatedArticle;
  }

  async deleteArticle(id: string): Promise<void> {
    this.articles.delete(id);
    await this.updateStatsOnDelete();
  }

  // RSS Config
  async getRssConfig(): Promise<RssConfig | undefined> {
    const configs = Array.from(this.rssConfigs.values());
    return configs[0]; // Return first config
  }

  async createRssConfig(insertConfig: InsertRssConfig): Promise<RssConfig> {
    const id = randomUUID();
    const config: RssConfig = {
      ...insertConfig,
      id,
      language: insertConfig.language || null,
      checkInterval: insertConfig.checkInterval || null,
      isActive: insertConfig.isActive ?? null,
      createdAt: new Date(),
      lastChecked: null,
    };
    this.rssConfigs.set(id, config);
    return config;
  }

  async updateRssConfig(id: string, updates: Partial<RssConfig>): Promise<RssConfig> {
    const config = this.rssConfigs.get(id);
    if (!config) {
      throw new Error(`RSS config with id ${id} not found`);
    }
    
    const updatedConfig = { ...config, ...updates };
    this.rssConfigs.set(id, updatedConfig);
    return updatedConfig;
  }

  // Processing Stats
  async getProcessingStats(): Promise<ProcessingStats> {
    return this.stats;
  }

  async updateProcessingStats(updates: Partial<ProcessingStats>): Promise<ProcessingStats> {
    this.stats = { ...this.stats, ...updates, lastUpdated: new Date() };
    return this.stats;
  }

  private async updateStatsOnCreate() {
    const totalArticles = this.articles.size;
    await this.updateProcessingStats({
      totalArticles: totalArticles.toString(),
    });
  }

  private async updateStatsOnUpdate(updates: Partial<Article>) {
    const articles = Array.from(this.articles.values());
    const processedArticles = articles.filter(a => a.status === "processed").length;
    const errorCount = articles.filter(a => a.status === "error").length;
    
    await this.updateProcessingStats({
      processedArticles: processedArticles.toString(),
      errorCount: errorCount.toString(),
    });
  }

  private async updateStatsOnDelete() {
    const totalArticles = this.articles.size;
    const articles = Array.from(this.articles.values());
    const processedArticles = articles.filter(a => a.status === "processed").length;
    const errorCount = articles.filter(a => a.status === "error").length;
    
    await this.updateProcessingStats({
      totalArticles: totalArticles.toString(),
      processedArticles: processedArticles.toString(),
      errorCount: errorCount.toString(),
    });
  }
}

export const storage = new MemStorage();
