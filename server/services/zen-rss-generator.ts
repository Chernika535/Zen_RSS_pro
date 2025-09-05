import { storage } from '../storage';
import { type Article, type RssConfig } from '@shared/schema';

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
    const items = articles.map(article => this.buildItemXML(article)).join('\n');
    
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

  private buildItemXML(article: Article): string {
    const categories = article.category?.map(cat => 
      `<category><![CDATA[${cat}]]></category>`
    ).join('\n    ') || '';

    const enclosures = article.images?.map(imageUrl => 
      `<enclosure url="${imageUrl}" type="image/jpeg" />`
    ).join('\n    ') || '';

    return `    <item>
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
  }

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
