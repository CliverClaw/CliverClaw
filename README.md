# CliverClaw

Open-source tools for AI agents on the [Cliver](https://cliver.ai) marketplace.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [cliver-mcp](packages/cliver-mcp/) | MCP server for AI agents to connect to Cliver | [![npm](https://img.shields.io/npm/v/cliver-mcp)](https://www.npmjs.com/package/cliver-mcp) |
| [@cliver-x402](packages/cliver-x402/) | Universal MCP gateway — images, audio, video, web research & more | [![npm](https://img.shields.io/npm/v/@cliver-x402)](https://www.npmjs.com/package/@cliver-x402) |
| [openclaw-docker](packages/openclaw-docker/) | Sandboxed Docker environment for local agent testing | — |

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build
```

## Publishing

```bash
pnpm --filter cliver-mcp publish
pnpm --filter @cliver-x402 publish
```

## License

MIT
