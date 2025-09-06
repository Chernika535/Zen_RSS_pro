diff --git a/server/services/rss-processor.ts b/server/services/rss-processor.ts
index 1ec8f967ee954aca52e2cb0896480c973f7616ae..2b24e07daf8c19b03e795593d29057bd3ebffd91 100644
--- a/server/services/rss-processor.ts
+++ b/server/services/rss-processor.ts
@@ -49,51 +49,52 @@ export class RSSProcessor {
         });
       }
       
     } catch (error) {
       console.error('Error fetching RSS:', error);
       throw new Error(`Failed to fetch RSS: ${error instanceof Error ? error.message : 'Unknown error'}`);
     }
   }
 
   private async processRSSItem(item: RSSItem): Promise<void> {
     if (!item.title || !item.link) {
       console.warn('Skipping item with missing required fields:', item.title);
       return;
     }
 
     // Check if article already exists
     const existingArticle = await storage.getArticleByLink(item.link);
     if (existingArticle) {
       console.log(`Article already exists: ${item.title}`);
       return;
     }
 
     try {
       // Extract and sanitize content
       const content = this.extractAndSanitizeContent(item);
-      const images = this.extractImages(content);
+      const config = await storage.getRssConfig();
+      const images = this.extractImages(content, item, config?.siteLink);
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
       
       // Process the article for Zen compliance
       await this.processForZenCompliance(createdArticle.id);
       
     } catch (error) {
       console.error(`Error processing article ${item.title}:`, error);
     }
@@ -119,57 +120,75 @@ export class RSSProcessor {
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
       console.error('Error sanitizing content:', error);
       // Fallback: strip HTML tags manually
       return content.replace(/<[^>]*>/g, '');
     }
   }
 
-  private extractImages(content: string): string[] {
+  private extractImages(content: string, item: RSSItem, siteLink?: string): string[] {
     const dom = new JSDOM(content);
     const images = dom.window.document.querySelectorAll('img');
-    
+    const allowed = /\.(jpe?g|png|webp)$/i;
+
     return Array.from(images)
-      .map((img: HTMLImageElement) => img.src)
-      .filter(src => src && src.startsWith('http'));
+      .map((img: HTMLImageElement) => {
+        let src = img.getAttribute('src') || '';
+        if (!src) return '';
+
+        try {
+          const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(src);
+          if (src.startsWith('/') || !hasScheme) {
+            const base = item.link || siteLink || '';
+            if (base) {
+              src = new URL(src, base).href;
+            }
+          }
+        } catch {
+          return '';
+        }
+
+        return src;
+      })
+      .filter(src => src.startsWith('http') && allowed.test(src.split('?')[0].toLowerCase()));
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
       await storage.updateArticle(articleId, {
         status: 'processing'
diff --git a/server/services/zen-rss-generator.ts b/server/services/zen-rss-generator.ts
index da81f7e8c26a85700eea12c568ddec5679a4e55b..4366475d1f06fdba2d3ed28022aef9d12fa566ae 100644
--- a/server/services/zen-rss-generator.ts
+++ b/server/services/zen-rss-generator.ts
@@ -1,80 +1,122 @@
 import { storage } from '../storage';
 import { type Article, type RssConfig } from '@shared/schema';
+import { JSDOM } from 'jsdom';
 
 export class ZenRSSGenerator {
   async generateZenRSS(): Promise<string> {
     const config = await storage.getRssConfig();
     const articles = await storage.getArticles();
     
     if (!config) {
       throw new Error('RSS configuration not found');
     }
 
     // Filter only processed and Zen-compliant articles
     const zenArticles = articles.filter(article => 
       article.status === 'processed' && article.zenCompliant
     );
 
     return this.buildRSSXML(config, zenArticles);
   }
 
   private buildRSSXML(config: RssConfig, articles: Article[]): string {
-    const items = articles.map(article => this.buildItemXML(article)).join('\n');
+    const items = articles.map(article => this.buildItemXML(article, config.siteLink)).join('\n');
     
     return `<?xml version="1.0" encoding="UTF-8"?>
 <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
   <channel>
     <title><![CDATA[${config.title}]]></title>
     <link>${config.siteLink}</link>
     <description><![CDATA[${config.description}]]></description>
     <language>${config.language}</language>
     <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
     <generator>RSS to Zen Bridge</generator>
     
     ${items}
   </channel>
 </rss>`;
   }
 
-  private buildItemXML(article: Article): string {
-    const categories = article.category?.map(cat => 
+  private buildItemXML(article: Article, siteLink: string): string {
+    const { content, images } = this.normalizeImages(article.content, article.link, siteLink);
+    const categories = article.category?.map(cat =>
       `<category><![CDATA[${cat}]]></category>`
     ).join('\n    ') || '';
 
-    const enclosures = article.images?.map(imageUrl => 
-      `<enclosure url="${imageUrl}" type="image/jpeg" />`
+    const enclosures = images.map(imageUrl =>
+      `<enclosure url="${imageUrl}" type="${this.getMimeType(imageUrl)}" />`
     ).join('\n    ') || '';
 
     return `    <item>
       <title><![CDATA[${article.title}]]></title>
       <link>${article.link}</link>
       <pubDate>${article.pubDate.toUTCString()}</pubDate>
       <author><![CDATA[${article.author}]]></author>
       ${categories}
       <description><![CDATA[${article.description || ''}]]></description>
-      <content:encoded><![CDATA[${article.content}]]></content:encoded>
+      <content:encoded><![CDATA[${content}]]></content:encoded>
       ${enclosures}
       <guid>${article.link}</guid>
     </item>`;
   }
 
+  private normalizeImages(content: string, articleLink: string, siteLink: string): { content: string; images: string[] } {
+    const dom = new JSDOM(`<body>${content}</body>`);
+    const document = dom.window.document;
+    const imgs = Array.from(document.querySelectorAll('img'));
+    const allowed = /\.(jpe?g|png|webp)$/i;
+    const images: string[] = [];
+
+    imgs.forEach(img => {
+      let src = img.getAttribute('src') || '';
+      try {
+        const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(src);
+        if (src.startsWith('/') || !hasScheme) {
+          const base = articleLink || siteLink;
+          if (base) {
+            src = new URL(src, base).href;
+          }
+        }
+      } catch {
+        src = '';
+      }
+
+      if (!src.startsWith('http') || !allowed.test(src.split('?')[0].toLowerCase())) {
+        img.remove();
+        return;
+      }
+
+      img.setAttribute('src', src);
+      images.push(src);
+    });
+
+    return { content: document.body.innerHTML, images };
+  }
+
+  private getMimeType(url: string): string {
+    const lower = url.toLowerCase();
+    if (lower.endsWith('.png')) return 'image/png';
+    if (lower.endsWith('.webp')) return 'image/webp';
+    return 'image/jpeg';
+  }
+
   async getStats() {
     const articles = await storage.getArticles();
     const config = await storage.getRssConfig();
     
     const totalArticles = articles.length;
     const processedArticles = articles.filter(a => a.status === 'processed').length;
     const zenCompliantArticles = articles.filter(a => a.zenCompliant).length;
     const errorCount = articles.filter(a => a.status === 'error').length;
     
     return {
       totalArticles,
       processedArticles,
       zenCompliantArticles,
       errorCount,
       lastUpdated: config?.lastChecked || null,
     };
   }
 }
 
 export const zenRSSGenerator = new ZenRSSGenerator();
diff --git a/server/storage.ts b/server/storage.ts
index ed418ce68afe7b7e01db09e3641b9f8b5d661b48..6a6dea6d4e8690b3896955b1e4dd9e09ecf52b61 100644
--- a/server/storage.ts
+++ b/server/storage.ts
@@ -69,52 +69,57 @@ export class MemStorage implements IStorage {
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
+      category: (insertArticle.category ?? []) as string[],
+      images: (insertArticle.images ?? []) as string[],
+      errorMessage: insertArticle.errorMessage || null,
+      zenCompliant: insertArticle.zenCompliant ?? false,
       createdAt: new Date(),
       processedAt: null,
+      status: insertArticle.status || 'pending',
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
