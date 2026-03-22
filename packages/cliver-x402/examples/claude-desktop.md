# Claude Desktop Setup Guide

This guide walks you through setting up @cliver-x402 with Claude Desktop.

## Prerequisites

1. [Claude Desktop](https://claude.ai/desktop) installed
2. [Node.js](https://nodejs.org/) v18 or higher
3. A Cliver API key (get one free at [cliver.ai](https://cliver.ai))

## Step 1: Get Your API Key

1. Visit [cliver.ai](https://cliver.ai)
2. Create an account (no credit card required)
3. Go to **Dashboard -> API Keys**
4. Click **Create New Key**
5. Copy your key (it looks like `cliver_sk_abc123...`)

You get **3 FREE API calls** to test!

## Step 2: Configure Claude Desktop

### Option A: Using npx (Recommended)

This method auto-updates the package.

Find your config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Create or edit the file:

```json
{
  "mcpServers": {
    "x402": {
      "command": "npx",
      "args": ["@cliver-x402", "cliver_sk_your_api_key_here"]
    }
  }
}
```

### Option B: Global Install

If you prefer a global installation:

```bash
npm install -g @cliver-x402
```

Then configure:

```json
{
  "mcpServers": {
    "x402": {
      "command": "x402-mcp",
      "args": ["cliver_sk_your_api_key_here"]
    }
  }
}
```

### Option C: Environment Variable

Keep your API key in environment:

```json
{
  "mcpServers": {
    "x402": {
      "command": "npx",
      "args": ["@cliver-x402"],
      "env": {
        "CLIVER_API_KEY": "cliver_sk_your_api_key_here"
      }
    }
  }
}
```

## Step 3: Restart Claude Desktop

After saving the config file:
1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. The X.402 tools should now be available

## Step 4: Verify Setup

In Claude Desktop, try asking:

> "Check my X.402 balance using x402_get_balance"

You should see your account status with free calls remaining.

## Using X.402 Tools

Now you can ask Claude to use any of the 30+ tools:

### Generate Images
> "Generate an image of a cozy coffee shop interior using x402_generate_image"

### Research Topics
> "Research the latest developments in AI using x402_research_web"

### Convert Text to Speech
> "Convert this text to speech: 'Hello, this is a test'"

### Transcribe Audio
> "Transcribe this audio file: [URL]"

### And Much More!

See the full list of tools in the main [README](../README.md).

## Troubleshooting

### "MCP server not found"

Make sure Node.js is installed and in your PATH:
```bash
node --version  # Should show v18 or higher
```

### "Invalid API key"

Double-check your API key:
- Must start with `cliver_sk_` or `cliver_pk_`
- No extra spaces or characters
- Key is active in your dashboard

### "Connection refused"

The server might be blocked by firewall. Ensure you can reach:
```bash
curl https://api.cliver.ai/health
```

### Still having issues?

1. Check Claude Desktop logs
2. Try running the server manually: `npx @cliver-x402 --help`
3. Contact support at [hello@cliver.ai](mailto:hello@cliver.ai)

## Security Best Practices

1. **Never share your API key publicly**
2. **Use environment variables** in production
3. **Rotate keys regularly** in your dashboard
4. **Monitor usage** to detect unauthorized access

## Next Steps

- Explore all [available tools](../README.md#available-tools-30)
- Check out [workflow examples](./workflows/)
- Join our [Discord community](https://discord.gg/cliver)
