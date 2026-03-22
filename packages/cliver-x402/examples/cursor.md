# Cursor Setup Guide

This guide walks you through setting up @cliver-x402 with Cursor IDE.

## Prerequisites

1. [Cursor](https://cursor.sh/) installed
2. [Node.js](https://nodejs.org/) v18 or higher
3. A Cliver API key (get one free at [cliver.ai](https://cliver.ai))

## Step 1: Get Your API Key

1. Visit [cliver.ai](https://cliver.ai)
2. Create an account (no credit card required)
3. Go to **Dashboard -> API Keys**
4. Click **Create New Key**
5. Copy your key (it looks like `cliver_sk_abc123...`)

You get **3 FREE API calls** to test!

## Step 2: Configure Cursor

### Via Settings UI

1. Open Cursor
2. Press `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux) to open Settings
3. Search for "MCP" or go to **Features -> MCP Servers**
4. Click **Add Server**
5. Enter:
   - Name: `x402`
   - Command: `npx`
   - Arguments: `@cliver-x402 cliver_sk_your_api_key_here`

### Via JSON Configuration

Alternatively, add to your Cursor config:

```json
{
  "mcp.servers": {
    "x402": {
      "command": "npx",
      "args": ["@cliver-x402", "cliver_sk_your_api_key_here"]
    }
  }
}
```

### With Environment Variable

For better security:

```json
{
  "mcp.servers": {
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

## Step 3: Restart Cursor

After configuration:
1. Close all Cursor windows
2. Reopen Cursor
3. X.402 tools should now be available to the AI

## Step 4: Verify Setup

In Cursor's AI chat, try:

> "Use the x402_get_balance tool to check my balance"

You should see your account status.

## Using X.402 Tools in Cursor

X.402 tools enhance your coding workflow:

### Generate Code Documentation Images
> "Create a diagram for this architecture using x402_generate_image"

### Research API Documentation
> "Research the latest React 19 features using x402_research_web"

### Transcribe Code Review Sessions
> "Transcribe this recording from my code review: [URL]"

### Extract Data from Screenshots
> "Extract the error message from this screenshot and analyze it"

### Summarize Long Documents
> "Summarize this RFC document: [URL]"

## Integration Examples

### Generating README Images

```
Can you generate a banner image for my README using x402_generate_image?
The project is a TypeScript library for data validation.
Style should be modern and professional.
```

### Researching Dependencies

```
I need to choose between Zod and Yup for validation.
Use x402_research_web to find recent comparisons and recommendations.
```

### Creating Documentation Voice Overs

```
Convert this documentation section to speech for a video tutorial:
[paste section]
Use x402_text_to_speech with a professional voice.
```

## Tips for Cursor

1. **Be specific** - Tell Cursor exactly which X.402 tool to use
2. **Chain tools** - Use multiple tools in sequence for complex tasks
3. **Check balance first** - Use `x402_get_balance` before expensive operations
4. **Estimate costs** - Use `x402_estimate_cost` for video/audio generation

## Troubleshooting

### Tools not appearing

1. Check MCP server is enabled in settings
2. Verify Node.js is installed: `node --version`
3. Try restarting Cursor

### "Permission denied"

Run in terminal to test:
```bash
npx @cliver-x402 --help
```

### Slow responses

Some operations (video generation) take 30-120 seconds. This is normal.

### API errors

1. Check your API key is correct
2. Verify your balance: `x402_get_balance`
3. Check network connectivity

## Security in Cursor

1. **Use environment variables** for API keys
2. **Don't commit** API keys to version control
3. **Add to .gitignore**: `*.env.local`

## Next Steps

- Explore [all available tools](../README.md#available-tools-30)
- Check out [workflow examples](./workflows/)
- Join [Discord](https://discord.gg/cliver) for help
