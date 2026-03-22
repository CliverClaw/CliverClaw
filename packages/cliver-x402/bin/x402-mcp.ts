#!/usr/bin/env node
/**
 * X.402 MCP Server CLI
 *
 * Usage:
 *   MCP Mode:  x402-mcp <api-key>
 *   HTTP Mode: x402-mcp --http [--port 3402]
 */

import { startServer, getToolSummary } from '../src/index.js';
import { startHttpServer } from '../src/http-server.js';

const HELP_TEXT = `
X.402 MCP Server - Access 30+ AI services at cost

USAGE:
  MCP Mode (default):
    x402-mcp <api-key>
    CLIVER_API_KEY=<api-key> x402-mcp

  HTTP Mode:
    x402-mcp --http [--port 3402]
    x402-mcp --http --port 3402 --wallet 0x...

DESCRIPTION:
  MCP server that provides AI agents with access to:
  - Image generation and editing
  - Text-to-speech and transcription
  - Video generation
  - Web research and scraping
  - And much more!

MODES:
  MCP Mode (default)
    Runs as an MCP server over stdio. Use this with Claude Desktop,
    Cursor, or any MCP-compatible client. Requires Cliver API key.

  HTTP Mode (--http)
    Runs as an HTTP server with REST API. Supports both Cliver API
    key authentication and x402 protocol payments.

GET API KEY:
  1. Visit https://cliver.ai
  2. Create an account (no credit card required)
  3. Go to Dashboard -> API Keys
  4. Create a new key

  You get 3 FREE API calls to test!
  After that, add credits (minimum $5, no expiry).

SETUP WITH CLAUDE DESKTOP:
  Add to your claude_desktop_config.json:

  {
    "mcpServers": {
      "x402": {
        "command": "npx",
        "args": ["@cliver-x402", "YOUR_API_KEY"]
      }
    }
  }

  On macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
  On Windows: %APPDATA%\\Claude\\claude_desktop_config.json

ENVIRONMENT VARIABLES:
  CLIVER_API_KEY         Your API key (alternative to CLI argument)
  CLIVER_API_URL         API base URL (default: https://api.cliver.ai)
  X402_RECEIVING_WALLET  Wallet address for x402 payments (HTTP mode)
  X402_FACILITATOR_URL   x402 facilitator URL (default: https://x402.org/facilitator)

OPTIONS:
  --http                 Start in HTTP mode instead of MCP mode
  --port <number>        HTTP server port (default: 3402)
  --wallet <address>     x402 receiving wallet address
  --help, -h             Show this help message
  --version, -v          Show version number

EXAMPLES:
  # MCP Mode - run directly
  x402-mcp cliver_sk_abc123def456

  # MCP Mode - with environment variable
  export CLIVER_API_KEY=cliver_sk_abc123def456
  x402-mcp

  # MCP Mode - with npx (no install needed)
  npx @cliver-x402 cliver_sk_abc123def456

  # HTTP Mode - basic
  x402-mcp --http --port 3402

  # HTTP Mode - with x402 payments
  x402-mcp --http --port 3402 --wallet 0xYourWalletAddress

PRICING:
  Image generation    ~$0.03/image
  Text-to-speech      ~$0.02/1000 chars
  Transcription       ~$0.001/minute
  Video generation    ~$0.05/second
  Web research        ~$0.02/query

MORE INFO:
  Documentation: https://github.com/CliverClaw/x402-mcp
  API Dashboard: https://cliver.ai/dashboard
  Support: hello@cliver.ai
`;

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): {
  httpMode: boolean;
  port: number;
  wallet?: string;
  apiKey?: string;
  showHelp: boolean;
  showVersion: boolean;
} {
  const result = {
    httpMode: false,
    port: 3402,
    wallet: undefined as string | undefined,
    apiKey: undefined as string | undefined,
    showHelp: false,
    showVersion: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.showHelp = true;
    } else if (arg === '--version' || arg === '-v') {
      result.showVersion = true;
    } else if (arg === '--http') {
      result.httpMode = true;
    } else if (arg === '--port' && args[i + 1]) {
      result.port = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--wallet' && args[i + 1]) {
      result.wallet = args[i + 1];
      i++;
    } else if (!arg.startsWith('-') && !result.apiKey) {
      result.apiKey = arg;
    }
  }

  return result;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  // Check for help flag
  if (parsed.showHelp) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Check for version flag
  if (parsed.showVersion) {
    console.log('1.0.0');
    process.exit(0);
  }

  // HTTP Mode
  if (parsed.httpMode) {
    const wallet = parsed.wallet || process.env.X402_RECEIVING_WALLET;
    const facilitatorUrl = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
    const apiKey = parsed.apiKey || process.env.CLIVER_API_KEY;

    startHttpServer({
      port: parsed.port,
      apiKey,
      receivingWallet: wallet,
      facilitatorUrl,
    });
    return;
  }

  // MCP Mode (default)
  const apiKey = parsed.apiKey || process.env.CLIVER_API_KEY;

  if (!apiKey) {
    console.error('Error: API key required\n');
    console.error('Usage: x402-mcp <api-key>');
    console.error('   or: CLIVER_API_KEY=xxx x402-mcp\n');
    console.error('Get your free API key at https://cliver.ai/dashboard/api-keys');
    console.error('(3 free calls included, no credit card needed)\n');
    console.error('Run "x402-mcp --help" for more information.');
    process.exit(1);
  }

  // Validate API key format
  if (!apiKey.startsWith('cliver_sk_') && !apiKey.startsWith('cliver_pk_')) {
    console.error('Warning: API key format looks incorrect.');
    console.error('Expected format: cliver_sk_xxxxx or cliver_pk_xxxxx\n');
  }

  // Get optional base URL
  const baseUrl = process.env.CLIVER_API_URL;

  // Print startup info
  const summary = getToolSummary();
  console.error('');
  console.error('==========================================');
  console.error('  X.402 MCP Server v1.0.0');
  console.error('==========================================');
  console.error(`  Tools: ${summary.total} total`);
  console.error(`    - Visual:  ${summary.byCategory.visual} tools`);
  console.error(`    - Audio:   ${summary.byCategory.audio} tools`);
  console.error(`    - Video:   ${summary.byCategory.video} tools`);
  console.error(`    - Content: ${summary.byCategory.content} tools`);
  console.error(`    - Data:    ${summary.byCategory.data} tools`);
  console.error(`    - Social:  ${summary.byCategory.social} tools`);
  console.error(`    - Communication: ${summary.byCategory.communication} tools`);
  console.error(`    - Compute: ${summary.byCategory.compute} tools`);
  console.error(`    - Account: ${summary.byCategory.account} tools`);
  console.error('');
  console.error(`  API: ${baseUrl || 'https://api.cliver.ai'}`);
  console.error(`  Key: ${apiKey.slice(0, 15)}...`);
  console.error('==========================================');
  console.error('  Ready for connections');
  console.error('==========================================');
  console.error('');

  // Start the server
  try {
    await startServer(apiKey, { baseUrl });
  } catch (error) {
    console.error('Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\nShutting down X.402 MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\nShutting down X.402 MCP server...');
  process.exit(0);
});

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
