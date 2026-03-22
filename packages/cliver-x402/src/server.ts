/**
 * X.402 MCP Server
 *
 * MISSION: Provide AI agents with access to ANY service or data they need.
 *
 * This MCP server acts as a universal gateway for AI agents to access external
 * services - image generation, audio synthesis, video creation, web research,
 * compute infrastructure, and more. The human is in the loop: if your agent
 * needs access to any API service, just request it and we'll add it.
 *
 * Current capabilities: 30+ tools across visual, audio, video, content, data,
 * social, and compute categories. All services charged at cost with no markup.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';

import { X402Client, X402ClientOptions } from './client.js';
import { X402Error, ValidationError } from './errors.js';
import { allTools, executeTool, getToolSummary } from './tools/index.js';

/**
 * Server configuration options
 */
export interface X402ServerOptions extends X402ClientOptions {
  /** Server name (default: x402-mcp) */
  name?: string;
  /** Server version (default: 1.0.0) */
  version?: string;
}

/**
 * Create an X.402 MCP server instance
 */
export function createServer(apiKey: string, options: X402ServerOptions = {}): Server {
  const {
    name = 'x402-mcp',
    version = '1.0.0',
    ...clientOptions
  } = options;

  // Create the API client
  const client = new X402Client(apiKey, clientOptions);

  // Create the MCP server
  const server = new Server(
    {
      name,
      version,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const summary = getToolSummary();
    console.error(`X.402 MCP: Serving ${summary.total} tools`);

    return {
      tools: allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name: toolName, arguments: args } = request.params;

    console.error(`X.402 MCP: Executing ${toolName}`);

    try {
      const result = await executeTool(client, toolName, args || {});

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      // Format error for MCP response
      let errorMessage: string;

      if (error instanceof ZodError) {
        // Format Zod validation errors nicely
        const issues = error.issues.map(i => `- ${i.path.join('.')}: ${i.message}`).join('\n');
        errorMessage = `Validation Error:\n${issues}`;
      } else if (error instanceof X402Error) {
        errorMessage = error.toMCPError();
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      } else {
        errorMessage = 'Unknown error occurred';
      }

      console.error(`X.402 MCP: Error in ${toolName}:`, errorMessage);

      return {
        content: [
          {
            type: 'text',
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start the server with stdio transport
 */
export async function startServer(apiKey: string, options: X402ServerOptions = {}): Promise<void> {
  // Dynamic import for ESM compatibility
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');

  const server = createServer(apiKey, options);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  const summary = getToolSummary();
  console.error(`X.402 MCP server running with ${summary.total} tools`);
  console.error(`Categories: ${Object.entries(summary.byCategory).map(([k, v]) => `${k}(${v})`).join(', ')}`);
}
