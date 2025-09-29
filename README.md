# ScrapingDog MCP Server

[![npm version](https://badge.fury.io/js/scrapingdog-mcp-server.svg)](https://badge.fury.io/js/scrapingdog-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for [ScrapingDog API](https://scrapingdog.com) that provides comprehensive web scraping, search engine data extraction, social media scraping, and e-commerce data collection capabilities.

## Features

### 🌐 General Web Scraping
- **HTML Extraction**: Scrape any webpage with automatic proxy rotation and CAPTCHA solving
- **JavaScript Rendering**: Support for dynamic content with headless Chrome browsers
- **Premium Proxies**: Access to 40+ million rotating residential proxies
- **Geo-targeting**: Country-specific scraping for localized content

### 🔍 Search Engine APIs
- **Google Search**: Organic results, ads, and related search data
- **Google AI Search**: AI-powered search with overview and insights
- **Bing Search**: Comprehensive Bing search results
- **Google Maps**: Business listings and location data
- **Google News**: Real-time news articles and updates

### 🛒 E-commerce Data Extraction
- **Amazon Products**: Product search, details, pricing, and availability
- **Amazon Reviews**: Customer reviews and ratings extraction
- **Walmart Products**: Product information and pricing data

### 📱 Social Media Scraping
- **LinkedIn**: Profile and company information extraction
- **LinkedIn Jobs**: Job listings by location and keywords
- **Twitter/X**: Posts, likes, and bookmarks extraction
- **Instagram**: Profile and posts data
- **Facebook**: Page and profile information

### 💼 Job Board Integration
- **Indeed**: Job listings with advanced filtering options

## Installation

### Prerequisites
- Node.js 18+ 
- ScrapingDog API key (get one at [scrapingdog.com](https://scrapingdog.com))

### Install from npm
```bash
npm install -g scrapingdog-mcp-server
```

### Install from source
```bash
git clone https://github.com/nvrunx/scrapingdog-mcp-server.git
cd scrapingdog-mcp-server
npm install
npm run build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "scrapingdog": {
      "command": "npx",
      "args": ["scrapingdog-mcp-server"]
    }
  }
}
```

### With MCP Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'scrapingdog-mcp-server',
});

const client = new Client({
  name: 'scrapingdog-client',
  version: '1.0.0',
}, {
  capabilities: {},
});

await client.connect(transport);
```

## Available Tools

### General Web Scraping

#### `scrape_webpage`
Scrape any webpage with advanced features.

```json
{
  "url": "https://example.com",
  "api_key": "your-api-key",
  "dynamic": true,
  "premium": false,
  "country": "US",
  "wait": 3,
  "format": "html"
}
```

**Parameters:**
- `url` (required): Target URL to scrape
- `api_key` (required): Your ScrapingDog API key
- `dynamic`: Enable JavaScript rendering (5 credits)
- `premium`: Use premium residential proxies (25 credits with dynamic)
- `country`: Country code for geo-targeting (US, UK, CA, etc.)
- `wait`: Wait time in seconds (1-10)
- `format`: Response format (html, json)

### Search Engine Tools

#### `google_search`
Search Google and get comprehensive results (5 credits).

```json
{
  "query": "artificial intelligence trends 2024",
  "api_key": "your-api-key",
  "country": "US",
  "language": "en",
  "page": 1,
  "num": 10
}
```

#### `google_ai_search`
Get AI-powered search insights (10 credits).

```json
{
  "query": "machine learning applications",
  "api_key": "your-api-key",
  "country": "US",
  "language": "en"
}
```

#### `bing_search`
Search Bing for organic results (5 credits).

```json
{
  "query": "web scraping best practices",
  "api_key": "your-api-key",
  "country": "US",
  "page": 1
}
```

#### `google_maps_search`
Find business listings and locations (5 credits).

```json
{
  "query": "restaurants in New York",
  "api_key": "your-api-key",
  "country": "US",
  "language": "en"
}
```

#### `google_news_search`
Get latest news articles (5 credits).

```json
{
  "query": "technology news",
  "api_key": "your-api-key",
  "country": "US",
  "language": "en",
  "time_range": "d"
}
```

### E-commerce Tools

#### `amazon_product_search`
Search Amazon products (1 credit).

```json
{
  "query": "wireless headphones",
  "api_key": "your-api-key",
  "country": "US",
  "page": 1
}
```

#### `amazon_reviews`
Get product reviews (100 credits).

```json
{
  "asin": "B08N5WRWNW",
  "api_key": "your-api-key",
  "country": "US",
  "page": 1
}
```

#### `walmart_product_search`
Search Walmart products (5 credits).

```json
{
  "query": "laptop computers",
  "api_key": "your-api-key",
  "page": 1
}
```

### Social Media Tools

#### `linkedin_profile_scraper`
Extract LinkedIn profile data (50-100 credits).

```json
{
  "profile_url": "https://www.linkedin.com/in/username",
  "api_key": "your-api-key"
}
```

#### `linkedin_company_scraper`
Extract LinkedIn company information (50-100 credits).

```json
{
  "company_url": "https://www.linkedin.com/company/company-name",
  "api_key": "your-api-key"
}
```

#### `linkedin_jobs_search`
Search LinkedIn job listings (5 credits).

```json
{
  "query": "software engineer",
  "location": "San Francisco, CA",
  "api_key": "your-api-key",
  "page": 1
}
```

#### `twitter_post_scraper`
Extract Twitter/X posts (5 credits).

```json
{
  "username": "elonmusk",
  "api_key": "your-api-key",
  "count": 20
}
```

#### `instagram_profile_scraper`
Get Instagram profile information (15 credits).

```json
{
  "username": "instagram",
  "api_key": "your-api-key"
}
```

#### `instagram_posts_scraper`
Extract Instagram posts (15 credits).

```json
{
  "username": "natgeo",
  "api_key": "your-api-key",
  "count": 10
}
```

#### `facebook_scraper`
Extract Facebook page data (5 credits).

```json
{
  "url": "https://www.facebook.com/page-name",
  "api_key": "your-api-key"
}
```

### Job Board Tools

#### `indeed_jobs_search`
Search Indeed job listings.

```json
{
  "query": "data scientist",
  "location": "Remote",
  "api_key": "your-api-key",
  "country": "US",
  "page": 1
}
```

## Credit System

ScrapingDog uses a credit-based pricing system:

| Tool | Credits | Description |
|------|---------|-------------|
| General Web Scraping | 1 | Basic HTML extraction |
| JavaScript Rendering | +5 | Dynamic content rendering |
| Premium Proxies | +20 | With JavaScript rendering |
| Search APIs | 5-10 | Google, Bing, Maps, News |
| Amazon Products | 1 | Product information |
| Amazon Reviews | 100 | Customer reviews |
| Social Media | 5-100 | Varies by platform and data |

## Error Handling

The server includes comprehensive error handling:

- **Validation Errors**: Input parameter validation using Zod schemas
- **API Errors**: ScrapingDog API error responses with status codes
- **Network Errors**: Timeout and connection error handling
- **Rate Limiting**: Automatic retry logic for rate-limited requests

## Development

### Setup Development Environment

```bash
git clone https://github.com/nvrunx/scrapingdog-mcp-server.git
cd scrapingdog-mcp-server
npm install
```

### Build and Run

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run production build
npm start
```

### Testing

```bash
# Install MCP Inspector for testing
npx @modelcontextprotocol/inspector scrapingdog-mcp-server
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Follow TypeScript best practices
2. Add proper error handling for new tools
3. Include JSDoc comments for all functions
4. Update README for new features
5. Test with MCP Inspector before submitting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **ScrapingDog API Documentation**: [docs.scrapingdog.com](https://docs.scrapingdog.com)
- **Issues**: [GitHub Issues](https://github.com/nvrunx/scrapingdog-mcp-server/issues)
- **MCP Documentation**: [modelcontextprotocol.io](https://modelcontextprotocol.io)

## Disclaimer

This is an unofficial MCP server for ScrapingDog API. Please ensure you comply with the terms of service of both ScrapingDog and the websites you're scraping. Always respect robots.txt and rate limiting guidelines.

---

**Built with ❤️ by [Guddu Kumar](https://github.com/nvrunx)**