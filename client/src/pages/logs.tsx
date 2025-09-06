diff --git a/client/src/pages/logs.tsx b/client/src/pages/logs.tsx
index a588517906f366c68d3495533bbf9c8173247b1f..35410593c96ccb51e83af7eaea5c42083cb603f2 100644
--- a/client/src/pages/logs.tsx
+++ b/client/src/pages/logs.tsx
@@ -1,141 +1,116 @@
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import Sidebar from "@/components/sidebar";
 import { useQuery } from "@tanstack/react-query";
 import { RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
 
 interface LogEntry {
   timestamp: string;
   level: 'info' | 'error' | 'warning';
   message: string;
   details?: string;
 }
 
 export default function LogsPage() {
-  // Mock logs - в реальном приложении эти данные пришли бы с сервера
-  const mockLogs: LogEntry[] = [
-    {
-      timestamp: new Date().toISOString(),
-      level: 'info',
-      message: 'RSS синхронизация запущена',
-      details: 'Источник: https://neiromantra.ru/12583-feed.xml'
+  const { data: logs = [], refetch } = useQuery<LogEntry[]>({
+    queryKey: ['logs'],
+    queryFn: async () => {
+      const res = await fetch('/api/logs');
+      return res.json();
     },
-    {
-      timestamp: new Date(Date.now() - 5000).toISOString(),
-      level: 'info',
-      message: 'Статья обработана успешно',
-      details: 'Заголовок: "15 секретов управления временем"'
-    },
-    {
-      timestamp: new Date(Date.now() - 15000).toISOString(),
-      level: 'warning',
-      message: 'Изображение недоступно',
-      details: 'URL: https://example.com/image.jpg'
-    },
-    {
-      timestamp: new Date(Date.now() - 30000).toISOString(),
-      level: 'error',
-      message: 'Ошибка валидации контента',
-      details: 'Статья слишком короткая для Zen требований'
-    },
-    {
-      timestamp: new Date(Date.now() - 60000).toISOString(),
-      level: 'info',
-      message: 'Zen RSS feed сгенерирован',
-      details: 'Включено 5 статей'
-    }
-  ];
+    refetchInterval: 5000,
+  });
 
   const getLogIcon = (level: string) => {
     switch (level) {
       case 'error':
         return <AlertCircle className="w-4 h-4 text-red-500" />;
       case 'warning':
         return <AlertCircle className="w-4 h-4 text-yellow-500" />;
       case 'info':
         return <CheckCircle className="w-4 h-4 text-green-500" />;
       default:
         return <Clock className="w-4 h-4 text-gray-500" />;
     }
   };
 
   const getLogBadge = (level: string) => {
     switch (level) {
       case 'error':
         return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Error</Badge>;
       case 'warning':
         return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Warning</Badge>;
       case 'info':
         return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Info</Badge>;
       default:
         return <Badge variant="secondary">Unknown</Badge>;
     }
   };
 
   const formatTime = (timestamp: string) => {
     return new Date(timestamp).toLocaleString('ru-RU', {
       hour: '2-digit',
       minute: '2-digit',
       second: '2-digit',
       day: '2-digit',
       month: '2-digit'
     });
   };
 
   return (
     <div className="min-h-screen flex bg-background text-foreground">
       <Sidebar />
       
       <main className="flex-1 flex flex-col overflow-hidden">
         <header className="bg-card border-b border-border p-6">
           <div className="flex items-center justify-between">
             <div>
               <h2 className="text-2xl font-bold">Логи системы</h2>
               <p className="text-muted-foreground">Мониторинг активности и ошибок</p>
             </div>
-            <RefreshCw className="w-5 h-5 text-muted-foreground" />
+            <RefreshCw className="w-5 h-5 text-muted-foreground cursor-pointer" onClick={() => refetch()} />
           </div>
         </header>
 
         <div className="flex-1 p-6 overflow-auto">
           <Card>
             <CardHeader className="pb-4">
               <CardTitle className="text-lg">Последние события</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               <ScrollArea className="h-[600px]">
                 <div className="space-y-4 p-6">
-                  {mockLogs.map((log, index) => (
+                  {logs.map((log, index) => (
                     <div 
                       key={index}
                       className="flex items-start gap-4 p-4 border border-border rounded-lg"
                     >
                       <div className="mt-0.5">
                         {getLogIcon(log.level)}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-2">
                           <span className="font-medium text-sm">{log.message}</span>
                           {getLogBadge(log.level)}
                         </div>
                         {log.details && (
                           <p className="text-muted-foreground text-xs mb-2">
                             {log.details}
                           </p>
                         )}
                         <p className="text-muted-foreground text-xs">
                           {formatTime(log.timestamp)}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
               </ScrollArea>
             </CardContent>
           </Card>
         </div>
       </main>
     </div>
   );
-}
\ No newline at end of file
+}
diff --git a/server/logger.ts b/server/logger.ts
new file mode 100644
index 0000000000000000000000000000000000000000..ef03f679b44c610eaca0a5bd87970c44c7bb4f52
--- /dev/null
+++ b/server/logger.ts
@@ -0,0 +1,27 @@
+
+export type LogLevel = 'info' | 'error' | 'warning';
+
+export interface LogEntry {
+  timestamp: string;
+  level: LogLevel;
+  message: string;
+  details?: string;
+}
+
+const logs: LogEntry[] = [];
+
+export function addLog(message: string, level: LogLevel = 'info', details?: string) {
+  const entry: LogEntry = {
+    timestamp: new Date().toISOString(),
+    level,
+    message,
+    details,
+  };
+  logs.push(entry);
+  if (logs.length > 100) logs.shift();
+  console.log(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}${details ? ' - ' + details : ''}`);
+}
+
+export function getLogs() {
+  return logs;
+}
diff --git a/server/routes.ts b/server/routes.ts
index aa9affe0c3f036acc78332a2e7621fea4a96e855..a600ab4c573a2b18238dc463eca6bf66955f2a95 100644
--- a/server/routes.ts
+++ b/server/routes.ts
@@ -1,30 +1,31 @@
 import type { Express } from "express";
 import { createServer, type Server } from "http";
 import { storage } from "./storage";
 import { rssProcessor } from "./services/rss-processor";
 import { zenRSSGenerator } from "./services/zen-rss-generator";
+import { getLogs } from "./logger";
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
@@ -140,50 +141,55 @@ export async function registerRoutes(app: Express): Promise<Server> {
 
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
 
+  // Get recent logs
+  app.get("/api/logs", (req, res) => {
+    res.json(getLogs());
+  });
+
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
diff --git a/server/services/rss-processor.ts b/server/services/rss-processor.ts
index 1ec8f967ee954aca52e2cb0896480c973f7616ae..a74f8253d98f4387b611a61818b45362429c96ae 100644
--- a/server/services/rss-processor.ts
+++ b/server/services/rss-processor.ts
@@ -1,211 +1,219 @@
 import Parser from 'rss-parser';
 import { JSDOM } from 'jsdom';
 import { storage } from '../storage';
 import { type InsertArticle } from '@shared/schema';
+import { addLog } from '../logger';
 
 interface RSSItem {
   title?: string;
   link?: string;
   pubDate?: string;
   author?: string;
   content?: string;
   contentSnippet?: string;
   description?: string;
   categories?: string[];
   enclosure?: {
     url: string;
     type: string;
   };
 }
 
 export class RSSProcessor {
   private parser: Parser;
 
   constructor() {
     this.parser = new Parser({
       customFields: {
         item: [
           ['content:encoded', 'content'],
           ['description', 'description'],
         ]
       }
     });
   }
 
   async fetchAndProcessRSS(sourceUrl: string): Promise<void> {
     try {
-      console.log(`Fetching RSS from: ${sourceUrl}`);
+      addLog('Starting RSS fetch', 'info', sourceUrl);
       const feed = await this.parser.parseURL(sourceUrl);
-      
+
       for (const item of feed.items) {
         await this.processRSSItem(item as RSSItem);
       }
-      
+
       // Update last checked time
       const config = await storage.getRssConfig();
       if (config) {
         await storage.updateRssConfig(config.id, {
           lastChecked: new Date()
         });
       }
-      
+
+      addLog('Finished RSS fetch', 'info', sourceUrl);
     } catch (error) {
-      console.error('Error fetching RSS:', error);
+      addLog('Error fetching RSS', 'error', error instanceof Error ? error.message : String(error));
       throw new Error(`Failed to fetch RSS: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
   }
 
   private async processRSSItem(item: RSSItem): Promise<void> {
     if (!item.title || !item.link) {
-      console.warn('Skipping item with missing required fields:', item.title);
+      addLog('Skipping item with missing required fields', 'warning', item.title || 'unknown');
       return;
     }
 
+    addLog('Start processing item', 'info', item.title);
+
     // Check if article already exists
     const existingArticle = await storage.getArticleByLink(item.link);
     if (existingArticle) {
-      console.log(`Article already exists: ${item.title}`);
+      addLog('Article already exists', 'info', item.title);
       return;
     }
 
     try {
       // Extract and sanitize content
       const content = this.extractAndSanitizeContent(item);
       const images = this.extractImages(content);
       let categories = this.sanitizeCategories(item.categories || []);
       if (categories.length === 0) { categories = ['Технологии']; }
 
       const article: InsertArticle = {
         title: item.title,
         link: item.link,
         author: item.author || 'Unknown',
         pubDate: new Date(item.pubDate || Date.now()),
         category: categories,
         description: this.extractDescription(item),
         content: content,
         images: images,
         status: 'pending',
         errorMessage: null,
         zenCompliant: false,
       };
 
       const createdArticle = await storage.createArticle(article);
-      
+
       // Process the article for Zen compliance
       await this.processForZenCompliance(createdArticle.id);
-      
+
+      addLog('Finished processing item', 'info', item.title);
     } catch (error) {
-      console.error(`Error processing article ${item.title}:`, error);
+      addLog(`Error processing article ${item.title}`, 'error', error instanceof Error ? error.message : String(error));
     }
   }
 
   private extractAndSanitizeContent(item: RSSItem): string {
     let content = item.content || item.contentSnippet || item.description || '';
     
     if (!content) return '';
     
     try {
       // Parse HTML and sanitize
       const dom = new JSDOM(`<body>${content}</body>`);
       const document = dom.window.document;
       const body = document.body;
       
       if (!body) return content;
       
       // Remove script and style tags
       const scripts = body.querySelectorAll('script, style');
       scripts.forEach((el: Element) => el.remove());
       
       // Keep only allowed tags for Zen
       const allowedTags = ['p', 'br', 'strong', 'em', 'i', 'b', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'];
       const allElements = Array.from(body.querySelectorAll('*'));
       
       allElements.forEach((el: Element) => {
         if (!allowedTags.includes(el.tagName.toLowerCase())) {
           // Create text node with element's text content
           const textContent = el.textContent || '';
           if (textContent.trim() && el.parentNode) {
             const textNode = document.createTextNode(textContent);
             el.parentNode.replaceChild(textNode, el);
           } else if (el.parentNode) {
             el.parentNode.removeChild(el);
           }
         }
       });
       
       return body.innerHTML || content;
     } catch (error) {
-      console.error('Error sanitizing content:', error);
+      addLog('Error sanitizing content', 'error', error instanceof Error ? error.message : String(error));
       // Fallback: strip HTML tags manually
       return content.replace(/<[^>]*>/g, '');
     }
   }
 
   private extractImages(content: string): string[] {
     const dom = new JSDOM(content);
     const images = dom.window.document.querySelectorAll('img');
     
     return Array.from(images)
       .map((img: HTMLImageElement) => img.src)
       .filter(src => src && src.startsWith('http'));
   }
 
   private extractDescription(item: RSSItem): string {
     const description = item.contentSnippet || item.description || '';
     // Limit to 160 characters for better SEO
     return description.length > 160 ? description.substring(0, 157) + '...' : description;
   }
 
   private sanitizeCategories(categories: string[]): string[] {
     // Map to Zen-compatible categories
     const zenCategories = [
       'Технологии', 'Наука', 'Образование', 'Культура', 'Спорт',
       'Здоровье', 'Путешествия', 'Кулинария', 'Автомобили', 'Недвижимость',
       'Мода', 'Красота', 'Дом', 'Семья', 'Психология', 'Бизнес', 'Финансы'
     ];
     
     return categories
       .filter(cat => zenCategories.includes(cat))
       .slice(0, 3); // Zen allows max 3 categories
   }
 
   private async processForZenCompliance(articleId: string): Promise<void> {
     try {
+      addLog('Start Zen compliance processing', 'info', articleId);
       await storage.updateArticle(articleId, {
         status: 'processing'
       });
 
       // Simulate processing time
       await new Promise(resolve => setTimeout(resolve, 1000));
 
       const article = await storage.getArticleById(articleId);
       if (!article) return;
 
       // Check Zen compliance
       const isCompliant = this.checkZenCompliance(article);
-      
+
       await storage.updateArticle(articleId, {
         status: 'processed',
         zenCompliant: isCompliant,
         errorMessage: isCompliant ? null : 'Content does not meet Zen requirements'
       });
 
+      addLog('Finished Zen compliance processing', 'info', articleId);
     } catch (error) {
       await storage.updateArticle(articleId, {
         status: 'error',
         errorMessage: error instanceof Error ? error.message : 'Processing failed'
       });
+      addLog('Zen compliance processing failed', 'error', error instanceof Error ? error.message : String(error));
     }
   }
 
   private checkZenCompliance(article: any): boolean {
     // Basic Zen compliance checks
     if (!article.title || article.title.length < 10) return false;
     if (!article.content || article.content.length < 80) return false;
     if (article.content.length > 50000) return false; // Zen limit
     
     return true;
   }
 }
 
 export const rssProcessor = new RSSProcessor();
diff --git a/server/services/zen-rss-generator.ts b/server/services/zen-rss-generator.ts
index da81f7e8c26a85700eea12c568ddec5679a4e55b..234cf1c2399f6ec0d8d39789cbcd1267afd35364 100644
--- a/server/services/zen-rss-generator.ts
+++ b/server/services/zen-rss-generator.ts
@@ -1,80 +1,93 @@
 import { storage } from '../storage';
 import { type Article, type RssConfig } from '@shared/schema';
+import { addLog } from '../logger';
 
 export class ZenRSSGenerator {
   async generateZenRSS(): Promise<string> {
+    addLog('Starting Zen RSS generation');
     const config = await storage.getRssConfig();
     const articles = await storage.getArticles();
-    
+
     if (!config) {
       throw new Error('RSS configuration not found');
     }
 
     // Filter only processed and Zen-compliant articles
-    const zenArticles = articles.filter(article => 
+    const zenArticles = articles.filter(article =>
       article.status === 'processed' && article.zenCompliant
     );
 
-    return this.buildRSSXML(config, zenArticles);
+    const result = this.buildRSSXML(config, zenArticles);
+    addLog('Finished Zen RSS generation');
+    return result;
   }
 
   private buildRSSXML(config: RssConfig, articles: Article[]): string {
+    addLog('Building RSS XML');
     const items = articles.map(article => this.buildItemXML(article)).join('\n');
-    
-    return `<?xml version="1.0" encoding="UTF-8"?>
+
+    const xml = `<?xml version="1.0" encoding="UTF-8"?>
 <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
   <channel>
     <title><![CDATA[${config.title}]]></title>
     <link>${config.siteLink}</link>
     <description><![CDATA[${config.description}]]></description>
     <language>${config.language}</language>
     <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
     <generator>RSS to Zen Bridge</generator>
-    
+
     ${items}
   </channel>
 </rss>`;
+    addLog('Finished building RSS XML');
+    return xml;
   }
 
   private buildItemXML(article: Article): string {
-    const categories = article.category?.map(cat => 
+    addLog('Building RSS item', 'info', article.title);
+    const categories = article.category?.map(cat =>
       `<category><![CDATA[${cat}]]></category>`
     ).join('\n    ') || '';
 
-    const enclosures = article.images?.map(imageUrl => 
+    const enclosures = article.images?.map(imageUrl =>
       `<enclosure url="${imageUrl}" type="image/jpeg" />`
     ).join('\n    ') || '';
 
-    return `    <item>
+    const item = `    <item>
       <title><![CDATA[${article.title}]]></title>
       <link>${article.link}</link>
       <pubDate>${article.pubDate.toUTCString()}</pubDate>
       <author><![CDATA[${article.author}]]></author>
       ${categories}
       <description><![CDATA[${article.description || ''}]]></description>
       <content:encoded><![CDATA[${article.content}]]></content:encoded>
       ${enclosures}
       <guid>${article.link}</guid>
     </item>`;
+    addLog('Finished RSS item', 'info', article.title);
+    return item;
   }
 
   async getStats() {
+    addLog('Fetching processing stats');
     const articles = await storage.getArticles();
     const config = await storage.getRssConfig();
-    
+
     const totalArticles = articles.length;
     const processedArticles = articles.filter(a => a.status === 'processed').length;
     const zenCompliantArticles = articles.filter(a => a.zenCompliant).length;
     const errorCount = articles.filter(a => a.status === 'error').length;
-    
-    return {
+
+    const stats = {
       totalArticles,
       processedArticles,
       zenCompliantArticles,
       errorCount,
       lastUpdated: config?.lastChecked || null,
     };
+    addLog('Finished fetching processing stats');
+    return stats;
   }
 }
 
 export const zenRSSGenerator = new ZenRSSGenerator();
