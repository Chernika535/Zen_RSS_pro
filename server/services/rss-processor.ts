import Parser from 'rss-parser';
import { JSDOM } from 'jsdom';
import { storage } from '../storage';
import { type InsertArticle } from '@shared/schema';

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
      console.log(`Fetching RSS from: ${sourceUrl}`);
      const feed = await this.parser.parseURL(sourceUrl);
      
      for (const item of feed.items) {
        await this.processRSSItem(item as RSSItem);
      }
      
      // Update last checked time
      const config = await storage.getRssConfig();
      if (config) {
        await storage.updateRssConfig(config.id, {
          lastChecked: new Date()
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
      
      // Process the article for Zen compliance
      await this.processForZenCompliance(createdArticle.id);
      
    } catch (error) {
      console.error(`Error processing article ${item.title}:`, error);
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
      console.error('Error sanitizing content:', error);
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
      await storage.updateArticle(articleId, {
        status: 'processing'
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      const article = await storage.getArticleById(articleId);
      if (!article) return;

      // Check Zen compliance
      const isCompliant = this.checkZenCompliance(article);
      
      await storage.updateArticle(articleId, {
        status: 'processed',
        zenCompliant: isCompliant,
        errorMessage: isCompliant ? null : 'Content does not meet Zen requirements'
      });

    } catch (error) {
      await storage.updateArticle(articleId, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Processing failed'
      });
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
