#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { z } from 'zod';

// ScrapingDog API configuration
const SCRAPINGDOG_BASE_URL = 'https://api.scrapingdog.com';

// Validation schemas
const ApiKeySchema = z.string().min(1, 'API key is required');
const UrlSchema = z.string().url('Must be a valid URL');
const QuerySchema = z.string().min(1, 'Query is required');

// Tool definitions for all ScrapingDog APIs
const TOOLS = [
  // General Web Scraping
  {
    name: 'scrape_webpage',
    description: 'Scrape any webpage and return HTML content with proxy rotation and CAPTCHA solving',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to scrape' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        dynamic: { type: 'boolean', description: 'Enable JavaScript rendering (costs 5 credits)' },
        premium: { type: 'boolean', description: 'Use premium residential proxies (costs 25 credits with dynamic)' },
        country: { type: 'string', description: 'Country code for geo-targeting (e.g., US, UK, CA)' },
        wait: { type: 'number', description: 'Wait time in seconds for page to load (1-10)' },
        format: { type: 'string', enum: ['html', 'json'], description: 'Response format' }
      },
      required: ['url', 'api_key']
    }
  },
  
  // Search Engine APIs
  {
    name: 'google_search',
    description: 'Search Google and get organic results, ads, and related data (5 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        country: { type: 'string', description: 'Country code (e.g., US, UK, CA)' },
        language: { type: 'string', description: 'Language code (e.g., en, es, fr)' },
        page: { type: 'number', description: 'Page number (default: 1)' },
        num: { type: 'number', description: 'Number of results per page (max: 100)' }
      },
      required: ['query', 'api_key']
    }
  },
  
  {
    name: 'google_ai_search',
    description: 'Search Google with AI-powered overview and insights (10 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        country: { type: 'string', description: 'Country code' },
        language: { type: 'string', description: 'Language code' }
      },
      required: ['query', 'api_key']
    }
  },
  
  {
    name: 'bing_search',
    description: 'Search Bing and get organic results in JSON format (5 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        country: { type: 'string', description: 'Country code' },
        page: { type: 'number', description: 'Page number' }
      },
      required: ['query', 'api_key']
    }
  },
  
  {
    name: 'google_maps_search',
    description: 'Search Google Maps for business listings and location data (5 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "restaurants in New York")' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        country: { type: 'string', description: 'Country code' },
        language: { type: 'string', description: 'Language code' }
      },
      required: ['query', 'api_key']
    }
  },
  
  {
    name: 'google_news_search',
    description: 'Search Google News for latest news articles (5 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'News search query' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        country: { type: 'string', description: 'Country code' },
        language: { type: 'string', description: 'Language code' },
        time_range: { type: 'string', enum: ['h', 'd', 'w', 'm', 'y'], description: 'Time range (h=hour, d=day, w=week, m=month, y=year)' }
      },
      required: ['query', 'api_key']
    }
  },
  
  // E-commerce APIs
  {
    name: 'amazon_product_search',
    description: 'Search Amazon products and get detailed product information (1 credit)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Product search query or ASIN' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        country: { type: 'string', description: 'Amazon country domain (e.g., US, UK, CA, IN)' },
        page: { type: 'number', description: 'Page number' }
      },
      required: ['query', 'api_key']
    }
  },
  
  {
    name: 'amazon_reviews',
    description: 'Get Amazon product reviews and ratings (100 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        asin: { type: 'string', description: 'Amazon Standard Identification Number (ASIN)' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        country: { type: 'string', description: 'Amazon country domain' },
        page: { type: 'number', description: 'Page number' }
      },
      required: ['asin', 'api_key']
    }
  },
  
  {
    name: 'walmart_product_search',
    description: 'Search Walmart products and get product details (5 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Product search query' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        page: { type: 'number', description: 'Page number' }
      },
      required: ['query', 'api_key']
    }
  },
  
  // Social Media APIs
  {
    name: 'linkedin_profile_scraper',
    description: 'Extract LinkedIn profile information (50-100 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        profile_url: { type: 'string', description: 'LinkedIn profile URL' },
        api_key: { type: 'string', description: 'ScrapingDog API key' }
      },
      required: ['profile_url', 'api_key']
    }
  },
  
  {
    name: 'linkedin_company_scraper',
    description: 'Extract LinkedIn company information (50-100 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        company_url: { type: 'string', description: 'LinkedIn company URL' },
        api_key: { type: 'string', description: 'ScrapingDog API key' }
      },
      required: ['company_url', 'api_key']
    }
  },
  
  {
    name: 'linkedin_jobs_search',
    description: 'Search LinkedIn job listings by location and keywords (5 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Job search query' },
        location: { type: 'string', description: 'Job location' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        page: { type: 'number', description: 'Page number' }
      },
      required: ['query', 'location', 'api_key']
    }
  },
  
  {
    name: 'twitter_post_scraper',
    description: 'Extract Twitter/X posts, likes, and bookmarks (5 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Twitter username (without @)' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        count: { type: 'number', description: 'Number of posts to retrieve (max: 100)' }
      },
      required: ['username', 'api_key']
    }
  },
  
  {
    name: 'instagram_profile_scraper',
    description: 'Extract Instagram profile information (15 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Instagram username (without @)' },
        api_key: { type: 'string', description: 'ScrapingDog API key' }
      },
      required: ['username', 'api_key']
    }
  },
  
  {
    name: 'instagram_posts_scraper',
    description: 'Extract Instagram posts from a profile (15 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Instagram username (without @)' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        count: { type: 'number', description: 'Number of posts to retrieve' }
      },
      required: ['username', 'api_key']
    }
  },
  
  {
    name: 'facebook_scraper',
    description: 'Extract Facebook page or profile information (5 credits)',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Facebook page or profile URL' },
        api_key: { type: 'string', description: 'ScrapingDog API key' }
      },
      required: ['url', 'api_key']
    }
  },
  
  // Job Boards
  {
    name: 'indeed_jobs_search',
    description: 'Search Indeed job listings with filters and location',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Job search query' },
        location: { type: 'string', description: 'Job location' },
        api_key: { type: 'string', description: 'ScrapingDog API key' },
        country: { type: 'string', description: 'Country code' },
        page: { type: 'number', description: 'Page number' }
      },
      required: ['query', 'location', 'api_key']
    }
  }
];

class ScrapingDogServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'scrapingdog-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'scrape_webpage':
            return await this.scrapeWebpage(args);
          case 'google_search':
            return await this.googleSearch(args);
          case 'google_ai_search':
            return await this.googleAiSearch(args);
          case 'bing_search':
            return await this.bingSearch(args);
          case 'google_maps_search':
            return await this.googleMapsSearch(args);
          case 'google_news_search':
            return await this.googleNewsSearch(args);
          case 'amazon_product_search':
            return await this.amazonProductSearch(args);
          case 'amazon_reviews':
            return await this.amazonReviews(args);
          case 'walmart_product_search':
            return await this.walmartProductSearch(args);
          case 'linkedin_profile_scraper':
            return await this.linkedinProfileScraper(args);
          case 'linkedin_company_scraper':
            return await this.linkedinCompanyScraper(args);
          case 'linkedin_jobs_search':
            return await this.linkedinJobsSearch(args);
          case 'twitter_post_scraper':
            return await this.twitterPostScraper(args);
          case 'instagram_profile_scraper':
            return await this.instagramProfileScraper(args);
          case 'instagram_posts_scraper':
            return await this.instagramPostsScraper(args);
          case 'facebook_scraper':
            return await this.facebookScraper(args);
          case 'indeed_jobs_search':
            return await this.indeedJobsSearch(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async makeScrapingDogRequest(endpoint: string, params: Record<string, any>) {
    try {
      const response = await axios.get(`${SCRAPINGDOG_BASE_URL}${endpoint}`, {
        params,
        timeout: 60000, // 60 second timeout
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        
        throw new McpError(
          ErrorCode.InternalError,
          `ScrapingDog API error (${status}): ${message}`
        );
      }
      throw error;
    }
  }

  // Tool implementations
  private async scrapeWebpage(args: any) {
    const { url, api_key, dynamic, premium, country, wait, format } = args;
    
    UrlSchema.parse(url);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      url,
    };
    
    if (dynamic !== undefined) params.dynamic = dynamic;
    if (premium !== undefined) params.premium = premium;
    if (country) params.country = country;
    if (wait) params.wait = wait;
    if (format) params.format = format;
    
    return await this.makeScrapingDogRequest('', params);
  }

  private async googleSearch(args: any) {
    const { query, api_key, country, language, page, num } = args;
    
    QuerySchema.parse(query);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      query,
    };
    
    if (country) params.country = country;
    if (language) params.language = language;
    if (page) params.page = page;
    if (num) params.num = num;
    
    return await this.makeScrapingDogRequest('/google', params);
  }

  private async googleAiSearch(args: any) {
    const { query, api_key, country, language } = args;
    
    QuerySchema.parse(query);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      query,
    };
    
    if (country) params.country = country;
    if (language) params.language = language;
    
    return await this.makeScrapingDogRequest('/google-ai', params);
  }

  private async bingSearch(args: any) {
    const { query, api_key, country, page } = args;
    
    QuerySchema.parse(query);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      query,
    };
    
    if (country) params.country = country;
    if (page) params.page = page;
    
    return await this.makeScrapingDogRequest('/bing', params);
  }

  private async googleMapsSearch(args: any) {
    const { query, api_key, country, language } = args;
    
    QuerySchema.parse(query);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      query,
    };
    
    if (country) params.country = country;
    if (language) params.language = language;
    
    return await this.makeScrapingDogRequest('/google-maps', params);
  }

  private async googleNewsSearch(args: any) {
    const { query, api_key, country, language, time_range } = args;
    
    QuerySchema.parse(query);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      query,
    };
    
    if (country) params.country = country;
    if (language) params.language = language;
    if (time_range) params.time_range = time_range;
    
    return await this.makeScrapingDogRequest('/google-news', params);
  }

  private async amazonProductSearch(args: any) {
    const { query, api_key, country, page } = args;
    
    QuerySchema.parse(query);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      query,
    };
    
    if (country) params.country = country;
    if (page) params.page = page;
    
    return await this.makeScrapingDogRequest('/amazon', params);
  }

  private async amazonReviews(args: any) {
    const { asin, api_key, country, page } = args;
    
    z.string().min(1).parse(asin);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      asin,
    };
    
    if (country) params.country = country;
    if (page) params.page = page;
    
    return await this.makeScrapingDogRequest('/amazon-reviews', params);
  }

  private async walmartProductSearch(args: any) {
    const { query, api_key, page } = args;
    
    QuerySchema.parse(query);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      query,
    };
    
    if (page) params.page = page;
    
    return await this.makeScrapingDogRequest('/walmart', params);
  }

  private async linkedinProfileScraper(args: any) {
    const { profile_url, api_key } = args;
    
    UrlSchema.parse(profile_url);
    ApiKeySchema.parse(api_key);
    
    const params = {
      api_key,
      url: profile_url,
    };
    
    return await this.makeScrapingDogRequest('/linkedin-profile', params);
  }

  private async linkedinCompanyScraper(args: any) {
    const { company_url, api_key } = args;
    
    UrlSchema.parse(company_url);
    ApiKeySchema.parse(api_key);
    
    const params = {
      api_key,
      url: company_url,
    };
    
    return await this.makeScrapingDogRequest('/linkedin-company', params);
  }

  private async linkedinJobsSearch(args: any) {
    const { query, location, api_key, page } = args;
    
    QuerySchema.parse(query);
    z.string().min(1).parse(location);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      query,
      location,
    };
    
    if (page) params.page = page;
    
    return await this.makeScrapingDogRequest('/linkedin-jobs', params);
  }

  private async twitterPostScraper(args: any) {
    const { username, api_key, count } = args;
    
    z.string().min(1).parse(username);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      username,
    };
    
    if (count) params.count = count;
    
    return await this.makeScrapingDogRequest('/twitter', params);
  }

  private async instagramProfileScraper(args: any) {
    const { username, api_key } = args;
    
    z.string().min(1).parse(username);
    ApiKeySchema.parse(api_key);
    
    const params = {
      api_key,
      username,
    };
    
    return await this.makeScrapingDogRequest('/instagram-profile', params);
  }

  private async instagramPostsScraper(args: any) {
    const { username, api_key, count } = args;
    
    z.string().min(1).parse(username);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      username,
    };
    
    if (count) params.count = count;
    
    return await this.makeScrapingDogRequest('/instagram-posts', params);
  }

  private async facebookScraper(args: any) {
    const { url, api_key } = args;
    
    UrlSchema.parse(url);
    ApiKeySchema.parse(api_key);
    
    const params = {
      api_key,
      url,
    };
    
    return await this.makeScrapingDogRequest('/facebook', params);
  }

  private async indeedJobsSearch(args: any) {
    const { query, location, api_key, country, page } = args;
    
    QuerySchema.parse(query);
    z.string().min(1).parse(location);
    ApiKeySchema.parse(api_key);
    
    const params: Record<string, any> = {
      api_key,
      query,
      location,
    };
    
    if (country) params.country = country;
    if (page) params.page = page;
    
    return await this.makeScrapingDogRequest('/indeed', params);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ScrapingDog MCP server running on stdio');
  }
}

const server = new ScrapingDogServer();
server.run().catch(console.error);