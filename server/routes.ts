import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { rssProcessor } from "./services/rss-processor";
import { zenRSSGenerator } from "./services/zen-rss-generator";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all articles
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  // Get article by ID
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.getArticleById(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // Update article status
  app.patch("/api/articles/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        status: z.enum(["pending", "processing", "processed", "error"]).optional(),
        errorMessage: z.string().nullable().optional(),
        zenCompliant: z.boolean().optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const article = await storage.updateArticle(req.params.id, updates);
      res.json(article);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Reprocess article
  app.post("/api/articles/:id/reprocess", async (req, res) => {
    try {
      const article = await storage.getArticleById(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      // Reset status to pending and reprocess
      await storage.updateArticle(req.params.id, {
        status: "pending",
        errorMessage: null,
        zenCompliant: false,
      });

      res.json({ message: "Article queued for reprocessing" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reprocess article" });
    }
  });

  // Get RSS configuration
  app.get("/api/rss-config", async (req, res) => {
    try {
      const config = await storage.getRssConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RSS configuration" });
    }
  });

  // Update RSS configuration
  app.patch("/api/rss-config/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        sourceUrl: z.string().url().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        siteLink: z.string().url().optional(),
        language: z.string().optional(),
        checkInterval: z.string().optional(),
        isActive: z.boolean().optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const config = await storage.updateRssConfig(req.params.id, updates);
      res.json(config);
    } catch (error) {
      res.status(400).json({ error: "Invalid configuration data" });
    }
  });

  // Manual RSS sync
  app.post("/api/sync", async (req, res) => {
    try {
      const config = await storage.getRssConfig();
      if (!config || !config.isActive) {
        return res.status(400).json({ error: "RSS configuration not found or inactive" });
      }

      // Start async processing
      rssProcessor.fetchAndProcessRSS(config.sourceUrl).catch(error => {
        console.error("Background RSS processing failed:", error);
      });

      res.json({ message: "RSS sync started" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start RSS sync" });
    }
  });

  // Get processing statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await zenRSSGenerator.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Generate and serve Zen RSS feed
  app.get("/zen-feed.xml", async (req, res) => {
    try {
      const rssXML = await zenRSSGenerator.generateZenRSS();
      res.set('Content-Type', 'application/rss+xml; charset=utf-8');
      res.send(rssXML);
    } catch (error) {
      res.status(500).set('Content-Type', 'text/plain').send("Failed to generate RSS feed");
    }
  });

  // Get processing status
  app.get("/api/status", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      const recentArticles = articles.slice(0, 5);
      
      const processingStatus = {
        isProcessing: recentArticles.some(a => a.status === "processing"),
        currentStep: recentArticles.some(a => a.status === "processing") ? "processing" : "idle",
        progress: 0,
        recentArticles: recentArticles.map(a => ({
          id: a.id,
          title: a.title,
          status: a.status,
          processedAt: a.processedAt
        }))
      };

      res.json(processingStatus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch processing status" });
    }
  });

  const httpServer = createServer(app);

  // Start periodic RSS checking and initial sync (async to not block server startup)
  setTimeout(async () => {
    const config = await storage.getRssConfig();
    if (config && config.isActive) {
      // Initial RSS sync on startup
      console.log("Starting initial RSS sync...");
      try {
        await rssProcessor.fetchAndProcessRSS(config.sourceUrl);
        console.log("Initial RSS sync completed successfully");
      } catch (error) {
        console.error("Initial RSS sync failed:", error);
      }

      // Set up periodic checking
      const intervalMinutes = parseInt(config.checkInterval || "30") || 30;
      setInterval(async () => {
        try {
          await rssProcessor.fetchAndProcessRSS(config.sourceUrl);
        } catch (error) {
          console.error("Scheduled RSS processing failed:", error);
        }
      }, intervalMinutes * 60 * 1000);
    }
  }, 1000); // Start RSS sync 1 second after server starts

  return httpServer;
}
