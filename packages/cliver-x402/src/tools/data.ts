/**
 * Data Tools
 *
 * Web scraping, data extraction, and analysis tools.
 */

import { z } from 'zod';
import type { X402Client } from '../client.js';
import type { ToolDefinition } from '../types.js';

// =============================================================================
// Input Schemas
// =============================================================================

export const ScrapeUrlInput = z.object({
  url: z.string().url('Invalid URL'),
  format: z.enum(['text', 'markdown', 'html']).optional().default('markdown'),
  waitForSelector: z.string().optional(),
});

export const ScrapeSearchInput = z.object({
  query: z.string().min(1, 'Query is required'),
  maxResults: z.number().min(1).max(100).optional().default(10),
  site: z.string().optional(),
});

export const ExtractDataInput = z.object({
  content: z.string().min(1, 'Content is required'),
  schema: z.record(z.string()),
  instructions: z.string().optional(),
});

export const AnalyzeDataInput = z.object({
  data: z.union([z.array(z.record(z.unknown())), z.string()]),
  question: z.string().min(1, 'Question is required'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const dataTools: ToolDefinition[] = [
  {
    name: 'x402_scrape_url',
    description: `Scrape content from a webpage. Costs ~$0.01/page.

Extract content from any public webpage:
- Handles JavaScript-rendered pages
- Multiple output formats
- Optional wait for dynamic content

Perfect for:
- Data collection
- Content aggregation
- Competitive analysis
- Research automation

Note: Respects robots.txt. Some sites may block scraping.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the webpage to scrape',
        },
        format: {
          type: 'string',
          description: 'Output format',
          enum: ['text', 'markdown', 'html'],
        },
        waitForSelector: {
          type: 'string',
          description: 'CSS selector to wait for before scraping (for dynamic content)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'x402_scrape_search',
    description: `Scrape search engine results. Costs ~$0.02/search.

Get structured search results:
- Returns title, URL, and snippet for each result
- Optional site-specific search
- Up to 100 results

Perfect for:
- Market research
- Competitor monitoring
- SEO analysis
- Lead generation`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results (1-100, default 10)',
        },
        site: {
          type: 'string',
          description: 'Limit search to specific site (e.g., "reddit.com")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'x402_extract_data',
    description: `Extract structured data from unstructured content. Costs ~$0.01/extraction.

Use AI to extract data matching your schema:
- Define fields and types
- Handles messy data
- Returns clean JSON

Perfect for:
- Processing documents
- Parsing emails
- Extracting product info
- Normalizing data

Example schema:
{
  "name": "string - company name",
  "revenue": "number - annual revenue in USD",
  "employees": "number - employee count"
}`,
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to extract data from (text, HTML, etc.)',
        },
        schema: {
          type: 'object',
          description: 'Object defining fields to extract (e.g., {"name": "string", "price": "number"})',
        },
        instructions: {
          type: 'string',
          description: 'Additional instructions for extraction',
        },
      },
      required: ['content', 'schema'],
    },
  },
  {
    name: 'x402_analyze_data',
    description: `Analyze data and answer questions about it. Costs ~$0.02/analysis.

Use AI to analyze datasets:
- Natural language questions
- Pattern detection
- Statistical insights
- Trend analysis

Perfect for:
- Business intelligence
- Data exploration
- Report generation
- Quick insights`,
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'Data to analyze (JSON array of objects, or CSV string)',
        },
        question: {
          type: 'string',
          description: 'Question to answer about the data (e.g., "What is the average sales by region?")',
        },
      },
      required: ['data', 'question'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleScrapeUrl(client: X402Client, args: unknown): Promise<string> {
  const input = ScrapeUrlInput.parse(args);
  const result = await client.scrapeUrl(input);

  const data = result.data as { content: string; title?: string; metadata?: Record<string, string> };

  let output = `Page scraped successfully!

URL: ${input.url}
${data.title ? `Title: ${data.title}` : ''}
Format: ${input.format}
Cost: $${result.cost.toFixed(4)}`;

  if (data.metadata && Object.keys(data.metadata).length > 0) {
    output += '\n\n--- METADATA ---';
    for (const [key, value] of Object.entries(data.metadata)) {
      output += `\n${key}: ${value}`;
    }
    output += '\n--- END METADATA ---';
  }

  output += `\n\n--- CONTENT ---\n${data.content}\n--- END CONTENT ---`;

  return output;
}

export async function handleScrapeSearch(client: X402Client, args: unknown): Promise<string> {
  const input = ScrapeSearchInput.parse(args);
  const result = await client.scrapeSearch(input);

  const data = result.data as { results: { title: string; url: string; snippet: string }[] };

  let output = `Search results retrieved!

Query: "${input.query}"
${input.site ? `Site: ${input.site}` : ''}
Results Found: ${data.results.length}
Cost: $${result.cost.toFixed(4)}

--- RESULTS ---`;

  for (let i = 0; i < data.results.length; i++) {
    const r = data.results[i];
    output += `\n\n${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`;
  }

  output += '\n--- END RESULTS ---';

  return output;
}

export async function handleExtractData(client: X402Client, args: unknown): Promise<string> {
  const input = ExtractDataInput.parse(args);
  const result = await client.extractData(input);

  const data = result.data as { data: Record<string, unknown> };

  return `Data extracted successfully!

Fields Extracted: ${Object.keys(data.data).length}
Cost: $${result.cost.toFixed(4)}

--- EXTRACTED DATA ---
${JSON.stringify(data.data, null, 2)}
--- END DATA ---`;
}

export async function handleAnalyzeData(client: X402Client, args: unknown): Promise<string> {
  const input = AnalyzeDataInput.parse(args);
  const result = await client.analyzeData(input);

  const data = result.data as { analysis: string; insights: string[] };

  let output = `Analysis complete!

Question: "${input.question}"
Cost: $${result.cost.toFixed(4)}

--- ANALYSIS ---
${data.analysis}
--- END ANALYSIS ---`;

  if (data.insights && data.insights.length > 0) {
    output += '\n\n--- KEY INSIGHTS ---';
    for (const insight of data.insights) {
      output += `\n- ${insight}`;
    }
    output += '\n--- END INSIGHTS ---';
  }

  return output;
}

// =============================================================================
// Handler Map
// =============================================================================

export const dataHandlers: Record<string, (client: X402Client, args: unknown) => Promise<string>> = {
  x402_scrape_url: handleScrapeUrl,
  x402_scrape_search: handleScrapeSearch,
  x402_extract_data: handleExtractData,
  x402_analyze_data: handleAnalyzeData,
};
