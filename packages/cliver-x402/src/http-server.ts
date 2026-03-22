/**
 * HTTP Server with x402 Protocol Support
 *
 * Express server that exposes x402 tools over HTTP with x402 payment protocol.
 * This is an alternative to the MCP stdio mode - useful for direct HTTP access
 * and x402 protocol compatibility.
 */

import express, { Request, Response, NextFunction } from 'express';
import { X402Client } from './client.js';
import { executeTool, allTools, hasTool } from './tools/index.js';
import { toolPricing, isFreeTool, getToolPricing, type X402Pricing } from './payment/pricing.js';

/**
 * HTTP server configuration
 */
export interface HttpServerConfig {
  /** Port to listen on (default: 3402) */
  port: number;
  /** Cliver API key for backend calls */
  apiKey?: string;
  /** x402 receiving wallet address (required for x402 mode) */
  receivingWallet?: string;
  /** Facilitator URL for x402 protocol */
  facilitatorUrl?: string;
  /** Enable CORS (default: true) */
  cors?: boolean;
  /** Network for x402 payments (default: 'base-mainnet') */
  network?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<HttpServerConfig, 'apiKey' | 'receivingWallet'>> & { apiKey?: string; receivingWallet?: string } = {
  port: 3402,
  apiKey: undefined,
  receivingWallet: undefined,
  facilitatorUrl: 'https://x402.org/facilitator',
  cors: true,
  network: 'base-mainnet',
};

/**
 * x402 route configuration for a single tool
 */
interface X402RouteConfig {
  accepts: {
    scheme: string;
    payTo: string;
    price: string;
    network: string;
  };
  resource: string;
  description: string;
}

/**
 * x402 routes configuration map
 */
type X402RoutesConfig = Record<string, X402RouteConfig>;

/**
 * Build routes config for x402 middleware
 */
function buildRoutesConfig(receivingWallet: string, network: string): X402RoutesConfig {
  const routes: X402RoutesConfig = {};

  // Create route config for each paid tool
  for (const tool of allTools) {
    const pricing = getToolPricing(tool.name);

    // Skip free tools
    if (!pricing || pricing.amount === '0') {
      continue;
    }

    const routePattern = `POST /tools/${tool.name}`;
    routes[routePattern] = {
      accepts: {
        scheme: 'exact',
        payTo: receivingWallet,
        price: pricing.amount,
        network: network,
      },
      resource: `/tools/${tool.name}`,
      description: tool.description.split('\n')[0],
    };
  }

  return routes;
}

/**
 * Create Express app with x402 paywall
 */
export function createHttpApp(config: Partial<HttpServerConfig> = {}): express.Application {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const app = express();

  // Middleware
  app.use(express.json());

  // CORS if enabled
  if (finalConfig.cors) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Payment, X-Payment-Response');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });
  }

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      mode: finalConfig.receivingWallet ? 'x402' : 'api-key',
    });
  });

  // List all available tools
  app.get('/tools', (_req: Request, res: Response) => {
    const tools = allTools.map(tool => ({
      name: tool.name,
      description: tool.description.split('\n')[0], // First line only
      pricing: getToolPricing(tool.name),
      free: isFreeTool(tool.name),
    }));

    res.json({
      tools,
      count: tools.length,
      paymentModes: {
        x402: !!finalConfig.receivingWallet,
        apiKey: true,
      },
    });
  });

  // Get tool details
  app.get('/tools/:tool', (req: Request, res: Response) => {
    const toolName = req.params.tool;
    const tool = allTools.find(t => t.name === toolName);

    if (!tool) {
      res.status(404).json({
        error: 'Tool not found',
        tool: toolName,
        available: allTools.map(t => t.name),
      });
      return;
    }

    res.json({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      pricing: getToolPricing(tool.name),
      free: isFreeTool(tool.name),
    });
  });

  // x402 payment middleware (only if wallet is configured)
  // Note: For a full x402 implementation, you would need to configure the
  // EVM scheme server with your private key. For now, we support API key auth
  // and manual x402 header verification.
  //
  // To enable full x402 with @x402/express:
  // import { paymentMiddlewareFromConfig } from '@x402/express';
  // import { ExactEvmScheme } from '@x402/evm';
  // const evmScheme = new ExactEvmScheme(privateKey);
  // const routes = getX402RoutesConfig(wallet, network);
  // app.use('/tools/:tool', paymentMiddlewareFromConfig(
  //   routes,
  //   undefined,
  //   [{ network: 'base-mainnet', server: evmScheme }]
  // ));

  // Execute tool endpoint
  app.post('/tools/:tool', async (req: Request, res: Response) => {
    const toolName = req.params.tool;

    // Check if tool exists
    if (!hasTool(toolName)) {
      res.status(404).json({
        error: 'Tool not found',
        tool: toolName,
      });
      return;
    }

    // Get pricing for this tool
    const pricing = getToolPricing(toolName);

    // Determine authentication method
    const apiKey = req.headers['x-api-key'] as string | undefined;
    const hasX402Payment = req.headers['x-payment'] || req.headers['x-payment-response'];

    // Free tools - no auth required
    if (pricing && pricing.amount === '0') {
      await executeToolRequest(req, res, toolName, apiKey);
      return;
    }

    // API key authentication (primary method)
    if (apiKey && apiKey.startsWith('cliver_')) {
      await executeToolRequest(req, res, toolName, apiKey);
      return;
    }

    // x402 payment authentication (secondary method)
    // In production, the x402 middleware would verify the payment
    // For now, we trust headers if they exist (middleware should validate)
    if (finalConfig.receivingWallet && hasX402Payment) {
      await executeToolRequest(req, res, toolName, finalConfig.apiKey);
      return;
    }

    // No valid authentication - return 402 with pricing info
    if (finalConfig.receivingWallet && pricing) {
      res.status(402).json({
        error: 'Payment Required',
        message: 'This tool requires payment via x402 protocol or Cliver API key',
        pricing: {
          amount: pricing.amount,
          asset: pricing.asset,
          network: pricing.network,
          payTo: finalConfig.receivingWallet,
        },
        alternatives: {
          apiKey: 'Include X-API-Key header with your Cliver API key',
          signup: 'Get an API key at https://cliver.ai/dashboard/api-keys',
        },
      });
      return;
    }

    // No x402 configured, require API key
    res.status(401).json({
      error: 'Authentication Required',
      message: 'Include X-API-Key header with your Cliver API key',
      signup: 'Get an API key at https://cliver.ai/dashboard/api-keys',
    });
  });

  return app;
}

/**
 * Execute a tool and send response
 */
async function executeToolRequest(
  req: Request,
  res: Response,
  toolName: string,
  apiKey?: string
): Promise<void> {
  try {
    // Create client - for free tools or x402 mode, use server's API key
    const effectiveApiKey = apiKey || process.env.CLIVER_API_KEY;

    if (!effectiveApiKey) {
      res.status(500).json({
        success: false,
        error: 'Server configuration error',
        message: 'No API key configured for backend calls',
      });
      return;
    }

    const client = new X402Client(effectiveApiKey);

    // Execute the tool
    const result = await executeTool(client, toolName, req.body);

    // Return result
    res.json({
      success: true,
      tool: toolName,
      result,
    });
  } catch (error) {
    handleToolError(res, error);
  }
}

/**
 * Handle tool execution errors
 */
function handleToolError(res: Response, error: unknown): void {
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('Insufficient funds')) {
      res.status(402).json({
        success: false,
        error: 'Insufficient funds',
        message: error.message,
        addCredits: 'https://cliver.ai/dashboard/wallet',
      });
      return;
    }

    if (error.message.includes('Invalid API key') || error.message.includes('Authentication')) {
      res.status(401).json({
        success: false,
        error: 'Authentication error',
        message: error.message,
      });
      return;
    }

    if (error.message.includes('Rate limit')) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: error.message,
      });
      return;
    }

    // Validation errors
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.message,
      });
      return;
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: 'Tool execution failed',
      message: error.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Unknown error',
    message: String(error),
  });
}

/**
 * Start the HTTP server
 */
export function startHttpServer(config: Partial<HttpServerConfig> = {}): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const app = createHttpApp(finalConfig);

  app.listen(finalConfig.port, () => {
    console.log(`
================================================================================
                         X.402 MCP HTTP Server
================================================================================

  Server running at: http://localhost:${finalConfig.port}

  Endpoints:
    GET  /health         - Health check
    GET  /tools          - List all available tools
    GET  /tools/:tool    - Get tool details
    POST /tools/:tool    - Execute a tool

  Authentication:
    ${finalConfig.receivingWallet
      ? `x402 Protocol: Enabled (wallet: ${finalConfig.receivingWallet.slice(0, 10)}...)`
      : 'x402 Protocol: Disabled (set --wallet or X402_RECEIVING_WALLET to enable)'}
    API Key: Include X-API-Key header with your Cliver API key

  Example:
    curl -X POST http://localhost:${finalConfig.port}/tools/x402_generate_image \\
      -H "Content-Type: application/json" \\
      -H "X-API-Key: cliver_sk_your_key_here" \\
      -d '{"prompt": "A beautiful sunset"}'

================================================================================
`);
  });
}

/**
 * Get x402 routes configuration for a tool
 * This is useful for integrating with @x402/express middleware
 */
export function getX402RoutesConfig(
  receivingWallet: string,
  network: string = 'base-mainnet'
): X402RoutesConfig {
  return buildRoutesConfig(receivingWallet, network);
}
