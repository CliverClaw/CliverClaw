# Custom Agent Integration Guide

This guide shows how to integrate @cliver-x402 with your own AI agent or application.

## Installation

```bash
npm install @cliver-x402
```

## Using the API Client Directly

For custom integrations, you can use the X402Client directly:

```typescript
import { X402Client } from '@cliver-x402';

const client = new X402Client('cliver_sk_your_api_key', {
  baseUrl: 'https://api.cliver.ai',  // Optional, this is default
  timeout: 30000,                     // Request timeout in ms
  maxRetries: 3,                      // Retry attempts for network errors
});

// Check balance
const balance = await client.getBalance();
console.log(`Balance: $${balance.balance}`);
console.log(`Free calls remaining: ${balance.freeCallsRemaining}`);

// Generate an image
const result = await client.generateImage({
  prompt: 'A futuristic city at night',
  style: 'photorealistic',
  size: '1024x1024',
});

console.log(`Image URL: ${result.data.imageUrl}`);
console.log(`Cost: $${result.cost}`);
```

## Creating a Custom MCP Server

You can create a customized MCP server with your own configuration:

```typescript
import { createServer, allTools } from '@cliver-x402';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create server with custom options
const server = createServer('cliver_sk_your_api_key', {
  name: 'my-custom-x402',
  version: '1.0.0',
  baseUrl: 'https://api.cliver.ai',
});

// Connect to transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Integrating with LangChain

```typescript
import { X402Client } from '@cliver-x402';
import { Tool } from 'langchain/tools';

const client = new X402Client('cliver_sk_your_api_key');

// Create LangChain tools
const generateImageTool = new Tool({
  name: 'x402_generate_image',
  description: 'Generate an image using AI',
  func: async (input: string) => {
    const params = JSON.parse(input);
    const result = await client.generateImage(params);
    return JSON.stringify(result);
  },
});

// Use with agent
const tools = [generateImageTool, /* ... */];
```

## Integrating with OpenAI Function Calling

```typescript
import OpenAI from 'openai';
import { X402Client, allTools } from '@cliver-x402';

const openai = new OpenAI();
const x402Client = new X402Client('cliver_sk_your_api_key');

// Convert X.402 tools to OpenAI function format
const functions = allTools.map(tool => ({
  name: tool.name,
  description: tool.description,
  parameters: tool.inputSchema,
}));

// Chat completion with tools
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [
    { role: 'user', content: 'Generate an image of a sunset' },
  ],
  functions,
  function_call: 'auto',
});

// Handle function calls
if (response.choices[0].message.function_call) {
  const { name, arguments: args } = response.choices[0].message.function_call;

  // Execute via X.402 client
  const params = JSON.parse(args);
  const result = await x402Client.execute('image', 'generate', params);

  console.log(result);
}
```

## Error Handling

```typescript
import {
  X402Client,
  X402Error,
  InsufficientFundsError,
  FreeTierExhaustedError,
  RateLimitError,
} from '@cliver-x402';

const client = new X402Client('cliver_sk_your_api_key');

try {
  const result = await client.generateImage({ prompt: 'test' });
} catch (error) {
  if (error instanceof InsufficientFundsError) {
    console.log(`Need $${error.required}, have $${error.balance}`);
    console.log(`Add credits: ${error.addCreditsUrl}`);
  } else if (error instanceof FreeTierExhaustedError) {
    console.log('Free tier exhausted, please add credits');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited, retry after ${error.retryAfter} seconds`);
  } else if (error instanceof X402Error) {
    console.log(`API error: ${error.message}`);
  }
}
```

## Streaming Responses (Coming Soon)

For long-running operations like video generation:

```typescript
// Coming in v2.0
const stream = await client.generateVideoStream({
  prompt: 'A sunset timelapse',
  duration: 10,
});

for await (const update of stream) {
  console.log(`Progress: ${update.progress}%`);
}

console.log(`Video ready: ${stream.result.videoUrl}`);
```

## Rate Limiting

The client handles rate limiting automatically with exponential backoff:

```typescript
const client = new X402Client('cliver_sk_your_api_key', {
  maxRetries: 5,        // More retries
  retryDelay: 2000,     // Start with 2 second delay
});
```

## Monitoring Usage

```typescript
// Get recent usage
const usage = await client.getUsage(
  new Date('2024-01-01'),  // Since date
  100                       // Limit
);

console.log(`Total cost: $${usage.totalCost}`);

for (const record of usage.records) {
  console.log(`${record.service}/${record.action}: $${record.cost}`);
}
```

## Cost Estimation

Always estimate before expensive operations:

```typescript
// Estimate video generation cost
const estimate = await client.estimateCost('video', 'generate', {
  prompt: 'A 10 second animation',
  duration: 10,
});

console.log(`Estimated cost: $${estimate.estimatedCost}`);

// Check if affordable
const balance = await client.getBalance();
if (balance.balance >= estimate.estimatedCost) {
  // Proceed with generation
}
```

## Webhook Integration (Coming Soon)

For async operations, configure webhooks:

```typescript
// Coming in v2.0
const job = await client.generateVideoAsync({
  prompt: 'Long video generation',
  duration: 60,
  webhookUrl: 'https://your-app.com/webhooks/x402',
});

console.log(`Job ID: ${job.id}`);
// Webhook will be called when complete
```

## TypeScript Types

All types are exported for full TypeScript support:

```typescript
import type {
  GenerateImageParams,
  GenerateImageResult,
  BalanceResponse,
  CostEstimate,
  ToolDefinition,
} from '@cliver-x402';

function generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
  // ...
}
```

## Next Steps

- Browse the [source code](https://github.com/cliver-ai/x402-mcp)
- Read the [API reference](https://docs.cliver.ai/api)
- Join [Discord](https://discord.gg/cliver) for help
