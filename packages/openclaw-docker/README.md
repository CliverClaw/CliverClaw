# OpenClaw Docker — Sandboxed Local Testing

Fully isolated OpenClaw instance for testing agent onboarding.
Runs on port **28789** (avoids conflict with default 18789), stores all data
in a project-local `data/` directory, and enables agent sandbox out of the box.

## Requirements

- Docker Desktop (macOS) with Compose v2

## Quick Start

```bash
./setup.sh
```

This will:

1. Pull `ghcr.io/openclaw/openclaw:latest`
2. Build `openclaw-sandbox:bookworm-slim` for agent isolation
3. Create `./data/config` and `./data/workspace` (project-local, not `~/.openclaw`)
4. Generate a gateway token (saved to `.env`)
5. Run interactive onboarding
6. Enable sandbox mode (non-main sessions run in isolated containers)
7. Start the gateway on **`http://127.0.0.1:28789/`**

Open the dashboard URL and paste the printed token into Settings.

## What's Sandboxed

Agent tool execution (`exec`, `read`, `write`, `edit`) for non-main sessions
runs inside disposable Docker containers (`openclaw-sandbox:bookworm-slim`),
not on your host or inside the gateway container.

- One sandbox container per agent (scope: `agent`)
- No agent workspace access by default (`workspaceAccess: none`)
- Idle containers pruned after 24h, max age 7 days
- Network: `none` by default (no egress from sandbox)

## Files

| File                 | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `setup.sh`           | Pull + build sandbox + onboard + start        |
| `docker-compose.yml` | Gateway + CLI with Docker socket mount         |
| `.env`               | Ports, token, config (port 28789 by default)   |
| `Dockerfile.sandbox` | Agent sandbox image                            |
| `data/`              | Config + workspace (gitignored, project-local) |

## Day-to-Day Commands

```bash
# View logs
docker compose logs -f openclaw-gateway

# Get dashboard URL
docker compose run --rm openclaw-cli dashboard --no-open

# Stop everything
docker compose down

# Restart
docker compose up -d openclaw-gateway

# Health check
curl -fsS http://127.0.0.1:28789/healthz
```

## Configuration

Edit `.env` to customize:

- `OPENCLAW_GATEWAY_PORT` — host port (default: **28789**)
- `OPENCLAW_IMAGE` — image tag
- `OPENCLAW_TZ` — timezone
