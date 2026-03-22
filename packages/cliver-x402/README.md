# @cliver-x402

**Mission: Provide AI agents with access to ANY service or data they need.**

Open-source MCP server that acts as a universal gateway for AI agents. Generate images, audio, video, research the web, run compute jobs, and more - all at the actual API cost with minimal markup (0.5%).

> **Human in the Loop**: If your agent needs access to any API service that isn't supported yet, just request it! We continuously add new integrations based on what agents need.

## Quick Start

### MCP Mode (for Claude Desktop, Cursor, etc.)

```bash
# Install globally
npm install -g @cliver-x402

# Run (3 free calls, no credit card needed)
x402-mcp cliver_sk_your_api_key

# Or run directly with npx (no install)
npx @cliver-x402 cliver_sk_your_api_key
```

### HTTP Mode (REST API with x402 Protocol)

```bash
# Start HTTP server on port 3402
x402-mcp --http --port 3402

# With x402 crypto payments enabled
x402-mcp --http --port 3402 --wallet 0xYourWalletAddress
```

## Two Authentication Modes

### 1. Cliver API Key (Recommended)

The easiest way to get started. No crypto knowledge required.

1. Visit [cliver.ai](https://cliver.ai)
2. Create an account (no credit card required)
3. Go to Dashboard -> API Keys
4. Create a new key

**You get 3 FREE API calls to test everything!**

### 2. x402 Protocol (Crypto Payments)

For agents with crypto wallets, the server supports the [x402 protocol](https://x402.org) for direct USDC payments on Base.

```bash
# Start with x402 payments enabled
x402-mcp --http --wallet 0xYourReceivingWallet
```

## Available Tools (35+)

### Visual (5 tools)
| Tool | Description | Cost |
|------|-------------|------|
| `x402_generate_image` | Generate images using AI | ~$0.03/image |
| `x402_upscale_image` | Upscale images 2x or 4x | ~$0.01/image |
| `x402_edit_image` | Edit images with AI | ~$0.04/edit |
| `x402_optimize_image` | Optimize images for web | ~$0.005/image |
| `x402_remove_background` | Remove image backgrounds | ~$0.02/image |

### Audio (5 tools)
| Tool | Description | Cost |
|------|-------------|------|
| `x402_text_to_speech` | Convert text to natural speech | ~$0.02/1000 chars |
| `x402_transcribe` | Transcribe audio to text | ~$0.001/minute |
| `x402_clone_voice` | Clone a voice from samples | ~$1.00/voice |
| `x402_audio_cleanup` | Remove noise, normalize audio | ~$0.01/minute |
| `x402_music_generate` | Generate music from prompts | ~$0.05/30 sec |

### Video (4 tools)
| Tool | Description | Cost |
|------|-------------|------|
| `x402_generate_video` | Generate video from prompts | ~$0.05/second |
| `x402_edit_video` | Edit video with AI instructions | ~$0.10/video |
| `x402_video_to_gif` | Convert video to GIF | ~$0.01/conversion |
| `x402_add_subtitles` | Add subtitles to video | ~$0.03/minute |

### Content (5 tools)
| Tool | Description | Cost |
|------|-------------|------|
| `x402_generate_text` | Generate text with AI | ~$0.01/1000 tokens |
| `x402_research_web` | Research topics with Perplexity | ~$0.02/query |
| `x402_summarize` | Summarize text or URLs | ~$0.01/summary |
| `x402_translate` | Translate text | ~$0.01/1000 chars |
| `x402_grammar_check` | Check and correct grammar | ~$0.01/check |

### Data (4 tools)
| Tool | Description | Cost |
|------|-------------|------|
| `x402_scrape_url` | Scrape content from URLs | ~$0.01/page |
| `x402_scrape_search` | Scrape search results | ~$0.02/search |
| `x402_extract_data` | Extract structured data | ~$0.01/extraction |
| `x402_analyze_data` | Analyze data with AI | ~$0.02/analysis |

### Social (4 tools)
| Tool | Description | Cost |
|------|-------------|------|
| `x402_analyze_tiktok` | Analyze TikTok content | ~$0.03/analysis |
| `x402_analyze_twitter` | Analyze Twitter/X content | ~$0.03/analysis |
| `x402_analyze_youtube` | Analyze YouTube content | ~$0.03/analysis |
| `x402_trending_topics` | Get trending topics | ~$0.02/query |

### Communication (4 tools)
| Tool | Description | Cost |
|------|-------------|------|
| `x402_send_sms` | Send SMS messages | ~$0.008/message |
| `x402_make_call` | Make voice calls | ~$0.014/minute |
| `x402_verify_phone` | Start phone verification | ~$0.05/attempt |
| `x402_verify_check` | Check verification code | Free |

### Compute (2 tools)
| Tool | Description | Cost |
|------|-------------|------|
| `x402_execute_code` | Run code in sandbox | ~$0.0001/second |
| `x402_run_serverless` | Run GPU code | ~$0.0002-0.002/second |

### Account (4 tools)
| Tool | Description | Cost |
|------|-------------|------|
| `x402_get_balance` | Check your balance | Free |
| `x402_get_usage` | View usage history | Free |
| `x402_estimate_cost` | Estimate operation cost | Free |
| `x402_service_status` | Check service status | Free |

## Setup with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "x402": {
      "command": "npx",
      "args": ["@cliver-x402", "cliver_sk_your_api_key"]
    }
  }
}
```

**Config file locations:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Or with environment variable:**

```json
{
  "mcpServers": {
    "x402": {
      "command": "npx",
      "args": ["@cliver-x402"],
      "env": {
        "CLIVER_API_KEY": "cliver_sk_your_api_key"
      }
    }
  }
}
```

## Setup with Cursor

In Cursor, add the MCP server via settings:

1. Open Cursor Settings
2. Go to Features -> MCP Servers
3. Add server with command: `npx @cliver-x402 cliver_sk_your_api_key`

## HTTP Mode Usage

Start the HTTP server for direct REST API access:

```bash
# Basic HTTP mode
x402-mcp --http --port 3402

# With x402 payments
x402-mcp --http --port 3402 --wallet 0xYourWalletAddress
```

### HTTP API Endpoints

```bash
# Health check
curl http://localhost:3402/health

# List all tools
curl http://localhost:3402/tools

# Get tool details
curl http://localhost:3402/tools/x402_generate_image

# Execute a tool (with API key)
curl -X POST http://localhost:3402/tools/x402_generate_image \
  -H "Content-Type: application/json" \
  -H "X-API-Key: cliver_sk_your_key" \
  -d '{"prompt": "A beautiful sunset"}'
```

### x402 Payment Flow

When x402 mode is enabled (with `--wallet`), the server returns 402 Payment Required for paid tools:

```json
{
  "error": "Payment Required",
  "pricing": {
    "amount": "0.030015",
    "asset": "USDC",
    "network": "base",
    "payTo": "0xYourWalletAddress"
  }
}
```

Clients can then pay with USDC on Base and include the payment proof in subsequent requests.

## Programmatic Usage

```typescript
import { createServer, startServer, X402Client } from '@cliver-x402';

// Start as MCP server
await startServer('your-api-key');

// Or use the client directly
const client = new X402Client('your-api-key');

// Generate an image
const result = await client.generateImage({
  prompt: 'A beautiful sunset over mountains',
  style: 'photorealistic',
  size: '1024x1024',
});

console.log(result.data.imageUrl);
console.log(`Cost: $${result.cost}`);
```

### HTTP Server Programmatic Usage

```typescript
import { startHttpServer, createHttpApp } from '@cliver-x402';

// Start HTTP server
startHttpServer({
  port: 3402,
  apiKey: 'cliver_sk_your_key',
  receivingWallet: '0xYourWallet', // Optional: enable x402 payments
});

// Or create Express app for custom integration
const app = createHttpApp({
  port: 3402,
  apiKey: 'cliver_sk_your_key',
});

app.listen(3402);
```

## Pricing

**All services are charged at cost + 0.5% (50 basis points)**

- **Free tier**: 3 API calls to test (no credit card required)
- **Credits**: Buy credits starting at $5
- **No subscription**: Pay only for what you use
- **No expiry**: Credits never expire

Example costs:
- Generate an image: ~$0.03
- 5 minutes of transcription: ~$0.005
- Research query: ~$0.02
- Generate 4-second video: ~$0.20

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLIVER_API_KEY` | Your API key | Required for MCP mode |
| `CLIVER_API_URL` | API base URL | `https://api.cliver.ai` |
| `X402_RECEIVING_WALLET` | Wallet for x402 payments | Optional |
| `X402_FACILITATOR_URL` | x402 facilitator URL | `https://x402.org/facilitator` |

## CLI Options

```
x402-mcp [options] [api-key]

Options:
  --http              Start in HTTP mode instead of MCP mode
  --port <number>     HTTP server port (default: 3402)
  --wallet <address>  x402 receiving wallet address
  --help, -h          Show help message
  --version, -v       Show version number
```

## Error Handling

The server provides helpful error messages:

```
Error: Insufficient funds. This operation costs $0.03 but your balance is $0.00.

To continue:
1. Add credits at https://cliver.ai/dashboard/wallet
2. Minimum purchase: $5.00
3. Credits never expire
```

```
Error: Free tier exhausted! You've used all 3 free API calls.

Add credits to continue:
1. Visit https://cliver.ai/dashboard/wallet
2. Add credits (minimum $5.00)
3. All services at COST - no markup!
```

## Development

```bash
# Clone the repo
git clone https://github.com/CliverClaw/x402-mcp.git
cd x402-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run locally (MCP mode)
npm start -- your-api-key

# Run locally (HTTP mode)
npm start -- --http --port 3402
```

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

## License

MIT - Use however you want.

## Links

- [Documentation](https://docs.cliver.ai/x402-mcp)
- [API Dashboard](https://cliver.ai/dashboard)
- [x402 Protocol](https://x402.org)
- [GitHub Issues](https://github.com/CliverClaw/x402-mcp/issues)
- [Discord Community](https://discord.gg/cliver)

---

Made with love by [Cliver AI](https://cliver.ai)
