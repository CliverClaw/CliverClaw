#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  Cliver Agent — Fully Automated Fresh Install
#  Registers on the Cliver marketplace, configures LLM, and starts
#  the OpenClaw gateway with the Cliver plugin pre-configured.
#  No manual steps needed after running this script.
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
DATA_DIR="$ROOT_DIR/data"
CONFIG_DIR="$DATA_DIR/config"
WORKSPACE_DIR="$DATA_DIR/workspace"

fail() { echo "ERROR: $*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing dependency: $1"
}

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

# Run CLI commands directly (no compose networking required).
cli_run() {
  docker run --rm \
    -v "$CONFIG_DIR:/home/node/.openclaw" \
    -v "$WORKSPACE_DIR:/home/node/.openclaw/workspace" \
    -e HOME=/home/node \
    -e TERM=xterm-256color \
    --entrypoint "node" \
    "$OPENCLAW_IMAGE" \
    dist/index.js "$@"
}

require_cmd docker
require_cmd curl
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 required (try: docker compose version)"

# ── Parse flags ────────────────────────────────────────────────
INTERACTIVE=false
for arg in "$@"; do
  case "$arg" in
    --interactive|-i) INTERACTIVE=true ;;
  esac
done
export INTERACTIVE

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Cliver Agent — Automated Fresh Install"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── Detect platform ──────────────────────────────────────────────
OS="$(uname -s)"
case "$OS" in
  Linux*)  PLATFORM="linux"  ;;
  Darwin*) PLATFORM="macos"  ;;
  *)       fail "Unsupported platform: $OS" ;;
esac
echo "Platform: $PLATFORM"

if [[ "$PLATFORM" == "linux" ]]; then
  CLIVER_HOST="${CLIVER_HOST:-172.17.0.1}"
else
  CLIVER_HOST="${CLIVER_HOST:-host.docker.internal}"
fi
echo "Docker host address: $CLIVER_HOST"

# ── Tear down any existing instance ─────────────────────────────
compose down 2>/dev/null || true

# ── Load .env if it exists ───────────────────────────────────────
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

export OPENCLAW_GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-28789}"
export OPENCLAW_GATEWAY_BIND="${OPENCLAW_GATEWAY_BIND:-lan}"
export OPENCLAW_IMAGE="${OPENCLAW_IMAGE:-ghcr.io/openclaw/openclaw:latest}"
export OPENCLAW_ALLOW_INSECURE_PRIVATE_WS="${OPENCLAW_ALLOW_INSECURE_PRIVATE_WS:-1}"
export OPENCLAW_TZ="${OPENCLAW_TZ:-}"
export OPENCLAW_CONFIG_DIR="$ROOT_DIR"
export OPENCLAW_WORKSPACE_DIR="$ROOT_DIR"

# ── Resolve Cliver URLs (auto-detect or prompt) ──────────────────
echo ""
CLIVER_API_DEFAULT="http://${CLIVER_HOST}:7000"
CLIVER_CHAT_DEFAULT="http://${CLIVER_HOST}:7001"

# Use env vars / .env values if already set, otherwise use defaults.
# Only prompt interactively if --interactive is passed.
CLIVER_API_URL="${CLIVER_API_URL:-$CLIVER_API_DEFAULT}"
CLIVER_CHAT_URL="${CLIVER_CHAT_URL:-$CLIVER_CHAT_DEFAULT}"

if [[ "${INTERACTIVE:-false}" == "true" ]]; then
  read -rp "Cliver API URL [${CLIVER_API_URL}]: " _input
  CLIVER_API_URL="${_input:-$CLIVER_API_URL}"
  read -rp "Cliver Chat URL [${CLIVER_CHAT_URL}]: " _input
  CLIVER_CHAT_URL="${_input:-$CLIVER_CHAT_URL}"
fi

export CLIVER_API_URL
export CLIVER_CHAT_URL

echo "  API URL:  $CLIVER_API_URL"
echo "  Chat URL: $CLIVER_CHAT_URL"

# ── Probe Cliver health ─────────────────────────────────────────
echo ""
echo -n "Checking Cliver health at ${CLIVER_API_URL}/health..."
# For the health check we need to reach Cliver from the HOST, not from Docker.
# Replace Docker-internal addresses with localhost for the probe.
PROBE_URL="$CLIVER_API_URL"
if [[ "$CLIVER_HOST" == "172.17.0.1" || "$CLIVER_HOST" == "host.docker.internal" ]]; then
  PROBE_URL="$(echo "$CLIVER_API_URL" | sed "s|${CLIVER_HOST}|127.0.0.1|g")"
fi

if curl -fsS "${PROBE_URL}/health" >/dev/null 2>&1; then
  echo " OK"
else
  echo " FAILED"
  echo ""
  echo "  Cliver is not running at ${PROBE_URL}"
  echo "  Please start Cliver first:  cd ../cliver && npm run dev"
  echo ""
  read -rp "Continue anyway? (y/N): " CONTINUE
  [[ "$CONTINUE" =~ ^[Yy] ]] || exit 1
fi

# ── Resolve agent name ────────────────────────────────────────
echo ""
AGENT_NAME="${AGENT_NAME:-OpenClaw Agent}"
if [[ "$INTERACTIVE" == "true" ]]; then
  read -rp "Agent name for the marketplace [${AGENT_NAME}]: " _input
  AGENT_NAME="${_input:-$AGENT_NAME}"
fi
echo "  Agent name: $AGENT_NAME"

# ── Auto-register on Cliver ─────────────────────────────────────
echo ""
if [[ -n "${CLIVER_API_KEY:-}" ]]; then
  echo "  Using existing API key: ${CLIVER_API_KEY:0:16}..."
else
  echo "==> Registering agent '${AGENT_NAME}' on Cliver..."

  REGISTER_RESPONSE="$(curl -s -X POST "${PROBE_URL}/auth/open-register" \
    -H "Content-Type: application/json" \
    -d "$(cat <<ENDJSON
{
  "name": "${AGENT_NAME}",
  "skills": ["image-generation", "writing", "coding", "research"],
  "bio": "AI agent on the Cliver marketplace, powered by OpenClaw"
}
ENDJSON
)" 2>&1)" || true

  # Extract API key from response
  CLIVER_API_KEY="$(echo "$REGISTER_RESPONSE" | python3 -c "
import json, sys
try:
  data = json.load(sys.stdin)
  if 'apiKey' in data:
    print(data['apiKey'], end='')
  elif 'error' in data:
    print('ERROR:' + data['error'], end='', file=sys.stderr)
    sys.exit(1)
  else:
    print('ERROR:unexpected response', file=sys.stderr)
    sys.exit(1)
except Exception as e:
  print(f'ERROR:{e}', file=sys.stderr)
  sys.exit(1)
" 2>&1)"

  if [[ "$CLIVER_API_KEY" == ERROR:* ]]; then
    echo "  Registration failed: ${CLIVER_API_KEY#ERROR:}"
    echo ""
    read -rp "Enter existing Cliver API key manually (or Ctrl+C to abort): " CLIVER_API_KEY
    if [[ -z "$CLIVER_API_KEY" ]]; then
      fail "No API key provided"
    fi
  else
    echo "  Registered successfully!"
    echo "  API Key: ${CLIVER_API_KEY}"
    # Show starter credits if available
    STARTER_CREDITS="$(echo "$REGISTER_RESPONSE" | python3 -c "
import json, sys
try:
  data = json.load(sys.stdin)
  print(data.get('starterCredits', 0), end='')
except: print('0', end='')
" 2>/dev/null || echo "0")"
    if [[ "$STARTER_CREDITS" != "0" ]]; then
      echo "  Starter credits: \$${STARTER_CREDITS}"
    fi
  fi
fi

# ── Resolve Google AI API key ─────────────────────────────────
echo ""
if [[ -z "${GOOGLE_API_KEY:-}" ]]; then
  if [[ "$INTERACTIVE" == "true" ]]; then
    echo "The agent needs a Google AI API key to power its brain (LLM)."
    echo "Get one at: https://aistudio.google.com/apikey"
    echo ""
    read -rp "Google AI API key: " GOOGLE_API_KEY
  fi
  if [[ -z "${GOOGLE_API_KEY:-}" ]]; then
    fail "Google AI API key is required. Set GOOGLE_API_KEY in .env or pass --interactive."
  fi
else
  echo "  Google AI key: ${GOOGLE_API_KEY:0:8}...${GOOGLE_API_KEY: -4} (from env)"
fi

# ── Resolve ngrok config ─────────────────────────────────────────
echo ""
ENABLE_NGROK="${ENABLE_NGROK:-n}"
NGROK_DOMAIN="${NGROK_DOMAIN:-}"

# Auto-detect: if ngrok.yml exists and NGROK_DOMAIN is set, enable automatically
if [[ -f "$ROOT_DIR/ngrok.yml" ]] && [[ -n "$NGROK_DOMAIN" ]]; then
  ENABLE_NGROK="y"
  echo "  ngrok: enabled (domain: $NGROK_DOMAIN, from env)"
elif [[ "$INTERACTIVE" == "true" ]]; then
  read -rp "Enable ngrok for remote access? (y/N): " ENABLE_NGROK
  ENABLE_NGROK="${ENABLE_NGROK:-n}"
  if [[ "$ENABLE_NGROK" =~ ^[Yy] ]]; then
    read -rp "ngrok domain (leave blank for random): " NGROK_DOMAIN
    if [[ ! -f "$ROOT_DIR/ngrok.yml" ]]; then
      echo ""
      echo "  WARNING: ngrok.yml not found at $ROOT_DIR/ngrok.yml"
      echo "  You need to create it with your ngrok authtoken."
      echo "  See: https://dashboard.ngrok.com/get-started/your-authtoken"
      echo ""
      read -rp "Continue without ngrok config? (y/N): " SKIP_NGROK
      if [[ ! "$SKIP_NGROK" =~ ^[Yy] ]]; then
        fail "Create ngrok.yml first, then re-run setup"
      fi
      ENABLE_NGROK="n"
    fi
  fi
else
  echo "  ngrok: disabled (pass --interactive or set ENABLE_NGROK=y and NGROK_DOMAIN in .env)"
fi

# ── Detect LAN IP ───────────────────────────────────────────────
LAN_IP="${LAN_IP:-}"
if [[ -z "$LAN_IP" ]]; then
  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')" || true
  if [[ -z "$LAN_IP" ]]; then
    LAN_IP="$(ip route get 1 2>/dev/null | awk '{print $7; exit}')" || true
  fi
  if [[ -z "$LAN_IP" ]]; then
    LAN_IP="$(ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | head -1 | awk '{print $2}')" || true
  fi
fi
export LAN_IP
echo ""
echo "Detected LAN IP: ${LAN_IP:-none}"

# ── Detect Docker socket GID ────────────────────────────────────
DOCKER_SOCKET="/var/run/docker.sock"
if [[ -S "$DOCKER_SOCKET" ]]; then
  DOCKER_GID="$(stat -c '%g' "$DOCKER_SOCKET" 2>/dev/null || stat -f '%g' "$DOCKER_SOCKET" 2>/dev/null || echo "0")"
else
  DOCKER_GID="0"
  echo "WARNING: Docker socket not found at $DOCKER_SOCKET"
fi
export DOCKER_GID
echo "Docker socket GID: $DOCKER_GID"

# ── Generate or reuse gateway token ─────────────────────────────
if [[ -z "${OPENCLAW_GATEWAY_TOKEN:-}" ]]; then
  OPENCLAW_GATEWAY_TOKEN="$(openssl rand -hex 32)"
  echo "Generated new gateway token."
fi
export OPENCLAW_GATEWAY_TOKEN

# ── Seed host directories ───────────────────────────────────────
echo ""
echo "==> Creating data directories"
mkdir -p "$CONFIG_DIR/identity"
mkdir -p "$CONFIG_DIR/agents/main/agent"
mkdir -p "$CONFIG_DIR/agents/main/sessions"
mkdir -p "$CONFIG_DIR/extensions"
mkdir -p "$WORKSPACE_DIR/skills/cliver-marketplace"

# ── Install extension dependencies ────────────────────────────
EXTENSION_DIR="$CONFIG_DIR/extensions/cliver-marketplace"
if [[ -f "$EXTENSION_DIR/package.json" ]] && [[ ! -d "$EXTENSION_DIR/node_modules" ]]; then
  echo "==> Installing cliver-marketplace extension dependencies"
  (cd "$EXTENSION_DIR" && npm install --omit=dev 2>&1)
fi

# ── Persist env vars ─────────────────────────────────────────────
cat > "$ENV_FILE" <<EOF
OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
CLIVER_API_URL=${CLIVER_API_URL}
CLIVER_CHAT_URL=${CLIVER_CHAT_URL}
CLIVER_API_KEY=${CLIVER_API_KEY}
GOOGLE_API_KEY=${GOOGLE_API_KEY}
AGENT_NAME="${AGENT_NAME}"
ENABLE_NGROK=${ENABLE_NGROK}
NGROK_DOMAIN=${NGROK_DOMAIN}
EOF

# ── Pull gateway image ──────────────────────────────────────────
echo ""
echo "==> Pulling gateway image: $OPENCLAW_IMAGE"
docker pull "$OPENCLAW_IMAGE"

# ── Build sandbox image ─────────────────────────────────────────
echo ""
echo "==> Building sandbox image: openclaw-sandbox:bookworm-slim"
docker build -t "openclaw-sandbox:bookworm-slim" -f "$ROOT_DIR/Dockerfile.sandbox" "$ROOT_DIR"

# ── Fix data-directory permissions ──────────────────────────────
echo ""
echo "==> Fixing data-directory permissions (chown to node:1000)"
docker run --rm \
  -v "$CONFIG_DIR:/home/node/.openclaw" \
  -v "$WORKSPACE_DIR:/home/node/.openclaw/workspace" \
  --user root --entrypoint sh "$OPENCLAW_IMAGE" -c \
  'find /home/node/.openclaw -xdev -exec chown node:node {} +; \
   [ -d /home/node/.openclaw/workspace/.openclaw ] && chown -R node:node /home/node/.openclaw/workspace/.openclaw || true'

# ── Write openclaw.json ─────────────────────────────────────────
echo ""
echo "==> Writing openclaw.json"

# Build allowedOrigins
ALLOWED_ORIGINS="\"http://127.0.0.1:${OPENCLAW_GATEWAY_PORT}\", \"http://localhost:${OPENCLAW_GATEWAY_PORT}\""
if [[ -n "$LAN_IP" ]]; then
  ALLOWED_ORIGINS="${ALLOWED_ORIGINS}, \"http://${LAN_IP}:${OPENCLAW_GATEWAY_PORT}\""
fi
if [[ "$ENABLE_NGROK" =~ ^[Yy] ]] && [[ -n "$NGROK_DOMAIN" ]]; then
  ALLOWED_ORIGINS="${ALLOWED_ORIGINS}, \"https://${NGROK_DOMAIN}\""
fi

cat > "$CONFIG_DIR/openclaw.json" <<ENDJSON
{
  "auth": {
    "profiles": {
      "google:default": {
        "provider": "google",
        "mode": "api_key"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "google/gemini-3.1-pro-preview",
        "fallbacks": ["google/gemini-3.1-pro-preview"]
      },
      "workspace": "/home/node/.openclaw/workspace",
      "sandbox": {
        "mode": "off",
        "workspaceAccess": "none",
        "scope": "agent"
      }
    }
  },
  "tools": {
    "profile": "coding",
    "web": {
      "search": {
        "enabled": true,
        "provider": "gemini",
        "gemini": {
          "apiKey": "${GOOGLE_API_KEY}"
        }
      }
    }
  },
  "commands": {
    "native": "auto",
    "nativeSkills": "auto",
    "restart": true,
    "ownerDisplay": "raw"
  },
  "session": {
    "dmScope": "per-channel-peer"
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "lan",
    "controlUi": {
      "allowedOrigins": [${ALLOWED_ORIGINS}]
    },
    "auth": {
      "mode": "token",
      "token": "${OPENCLAW_GATEWAY_TOKEN}"
    },
    "trustedProxies": [
      "172.18.0.0/16",
      "172.17.0.0/16",
      "10.0.0.0/8",
      "100.64.0.0/10",
      "127.0.0.0/8"
    ]
  },
  "plugins": {
    "load": {
      "paths": ["/home/node/.openclaw/extensions"]
    },
    "entries": {
      "cliver-marketplace": {
        "enabled": true,
        "config": {
          "apiUrl": "${CLIVER_API_URL}",
          "chatUrl": "${CLIVER_CHAT_URL}",
          "apiKey": "${CLIVER_API_KEY}"
        }
      }
    }
  }
}
ENDJSON

# ── Write agent.json ─────────────────────────────────────────────
echo "==> Writing agent.json"
cat > "$CONFIG_DIR/agents/main/agent/agent.json" <<ENDJSON
{
  "model": {
    "primary": "google/gemini-3.1-pro-preview"
  }
}
ENDJSON

# ── Write auth-profiles.json ────────────────────────────────────
echo "==> Writing auth-profiles.json"
cat > "$CONFIG_DIR/agents/main/agent/auth-profiles.json" <<ENDJSON
{
  "version": 1,
  "profiles": {
    "google:default": {
      "type": "api_key",
      "provider": "google",
      "key": "${GOOGLE_API_KEY}"
    }
  }
}
ENDJSON

# ── Generate SKILL.md ───────────────────────────────────────────
echo "==> Generating SKILL.md"
cat > "$WORKSPACE_DIR/skills/cliver-marketplace/SKILL.md" <<ENDSKILL
---
name: cliver-marketplace
description: Connect to the Cliver AI agent marketplace to offer services, accept gigs, chat with buyers, generate images, and earn USDC.
---

# Cliver Marketplace Agent Skill

You are an AI agent on the Cliver marketplace. You accept gigs, chat with buyers, generate images, and deliver work.

## Your Credentials

**API Key:** \`${CLIVER_API_KEY}\`
**API URL:** \`${CLIVER_API_URL}\`
**Chat URL:** \`${CLIVER_CHAT_URL}\`

Use these in ALL curl commands below. Always include \`-H "X-API-Key: ${CLIVER_API_KEY}"\`.

## IMPORTANT: How to Respond to Chat Messages

When you receive a message from a buyer, you are already IN a conversation. The message will tell you the conversation ID. Use \`exec\` with \`curl\` to interact with the APIs below.

## Image Generation (CRITICAL)

When a buyer asks for an image, use the **Service Gateway** to generate it, then **upload it to the chat**.

### Step 1: Generate the image via Google AI (Imagen 4)

\`\`\`bash
curl -s -X POST ${CLIVER_API_URL}/gateway/google-ai/execute \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${CLIVER_API_KEY}" \\
  -d '{"action": "image", "prompt": "YOUR PROMPT HERE"}' \\
  | node -e "const d=require('fs');process.stdin.on('data',c=>{try{const j=JSON.parse(c);const items=JSON.parse(j.data.content);const b64=items[0].dataUrl.split(',')[1];d.writeFileSync('/tmp/generated-image.png',Buffer.from(b64,'base64'));console.log('saved /tmp/generated-image.png')}catch(e){console.error(e.message)}})"
\`\`\`

This generates the image and saves it to \`/tmp/generated-image.png\`.

### Step 2: Upload to chat

\`\`\`bash
curl -s -X POST ${CLIVER_CHAT_URL}/api/chats/{conversationId}/upload \\
  -H "X-API-Key: ${CLIVER_API_KEY}" \\
  -F "file=@/tmp/generated-image.png"
\`\`\`

### Step 3: Send a caption

\`\`\`bash
curl -s -X POST ${CLIVER_CHAT_URL}/api/chats/{conversationId}/messages \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${CLIVER_API_KEY}" \\
  -d '{"content": "Here is your image!", "type": "text"}'
\`\`\`

## Chat API

**Send a text message:**
\`\`\`bash
curl -s -X POST ${CLIVER_CHAT_URL}/api/chats/{conversationId}/messages \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${CLIVER_API_KEY}" \\
  -d '{"content": "Your message here", "type": "text"}'
\`\`\`

**Get conversation messages:**
\`\`\`bash
curl -s ${CLIVER_CHAT_URL}/api/chats/{conversationId}/messages \\
  -H "X-API-Key: ${CLIVER_API_KEY}"
\`\`\`

**Upload a file/image to chat:**
\`\`\`bash
curl -s -X POST ${CLIVER_CHAT_URL}/api/chats/{conversationId}/upload \\
  -H "X-API-Key: ${CLIVER_API_KEY}" \\
  -F "file=@/path/to/file.png"
\`\`\`

## Gig Management

**Check for pending gigs:**
\`\`\`bash
curl -s "${CLIVER_API_URL}/agents/me/gigs?status=pending" \\
  -H "X-API-Key: ${CLIVER_API_KEY}"
\`\`\`

**Accept a gig:**
\`\`\`bash
curl -s -X POST ${CLIVER_API_URL}/agents/me/gigs/{gigId}/accept \\
  -H "X-API-Key: ${CLIVER_API_KEY}"
\`\`\`

**Complete a gig:**
\`\`\`bash
curl -s -X POST ${CLIVER_API_URL}/agents/me/gigs/{gigId}/complete \\
  -H "X-API-Key: ${CLIVER_API_KEY}"
\`\`\`

## Service Gateway (External AI Services)

**List available services:**
\`\`\`bash
curl -s ${CLIVER_API_URL}/gateway \\
  -H "X-API-Key: ${CLIVER_API_KEY}"
\`\`\`

**Execute a service:**
\`\`\`bash
curl -s -X POST ${CLIVER_API_URL}/gateway/{serviceName}/execute \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${CLIVER_API_KEY}" \\
  -d '{"action": "generate", "input": {"prompt": "..."}}'
\`\`\`

You have access to a FULL suite of AI services via the gateway. Run \`GET /gateway\` to discover all available services.

**Key services you can use:**

| Service | Category | Actions | Example Use |
|---------|----------|---------|-------------|
| \`google-ai\` | content/visual | generate, chat, image, embed, code | Image generation (Imagen 4), text generation |
| \`openai\` | content | generate, chat, image, embed, vision, tts | DALL-E images, GPT chat, text-to-speech |
| \`elevenlabs\` | audio | synthesize, list-voices, voice-design | High-quality voice synthesis |
| \`suno\` | audio | generate, extend, remix | AI music generation |
| \`runway-ml\` | video | generate, text-to-video, image-to-video | Video generation |
| \`luma\` | video | generate, extend, interpolate | Video generation |
| \`fal\` | video | generate-image, generate-video, upscale | Fast image/video generation |
| \`replicate\` | visual | generate, sdxl, flux | Open-source image models |
| \`whisper\` | audio | transcribe, translate | Audio transcription |
| \`assemblyai\` | audio | transcribe, summarize, analyze_sentiment | Advanced audio analysis |
| \`perplexity\` | content | search, chat | Web-grounded search |
| \`e2b\` | data | execute, sandbox, upload, download | Code execution sandbox |
| \`apify\` | data | run_actor, scrape | Web scraping |
| \`cloudflare-crawl\` | data | crawl, scrape, screenshot | Web crawling |
| \`deepl\` | content | translate, detect | Professional translation |

**To use any service:**
\`\`\`bash
curl -s -X POST ${CLIVER_API_URL}/gateway/{serviceName}/execute \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${CLIVER_API_KEY}" \\
  -d '{"action": "ACTION_NAME", "prompt": "YOUR INPUT"}'
\`\`\`

**To get details about a specific service:**
\`\`\`bash
curl -s ${CLIVER_API_URL}/gateway/{serviceName} \\
  -H "X-API-Key: ${CLIVER_API_KEY}"
\`\`\`

## Account

**Check balance:**
\`\`\`bash
curl -s ${CLIVER_API_URL}/agents/me/balance \\
  -H "X-API-Key: ${CLIVER_API_KEY}"
\`\`\`

## Workflow Summary

1. Receive message from buyer (automatic via WebSocket)
2. Read the request — use \`exec\` with curl commands above
3. For image requests: generate via gateway -> download -> upload to chat
4. For text requests: send reply via chat API
5. Complete the gig when work is delivered
ENDSKILL

# ── Generate HEARTBEAT.md ─────────────────────────────────────────
echo "==> Generating HEARTBEAT.md"
cat > "$WORKSPACE_DIR/HEARTBEAT.md" <<ENDHEARTBEAT
# Cliver Marketplace Agent

You are an AI agent on the Cliver marketplace. Your job is to accept gigs, chat with buyers, and generate images.

## CRITICAL: Image Generation Rules

**DO NOT use the built-in \`image_generate\` tool.** It saves files locally where the upload tool cannot access them.

**ALWAYS use \`exec\` with curl to generate and deliver images.** This is the ONLY working method:

### Step 1: Generate image and save to file
\`\`\`bash
curl -s -X POST ${CLIVER_API_URL}/gateway/google-ai/execute \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${CLIVER_API_KEY}" \\
  -d '{"action": "image", "prompt": "YOUR PROMPT HERE"}' \\
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const items=JSON.parse(j.data.content);const b64=items[0].dataUrl.split(',')[1];require('fs').writeFileSync('/tmp/generated-image.png',Buffer.from(b64,'base64'));console.log('OK')}catch(e){console.error(e.message)}})"
\`\`\`

### Step 2: Upload image to chat
\`\`\`bash
curl -s -X POST ${CLIVER_CHAT_URL}/api/chats/CONVERSATION_ID/upload \\
  -H "X-API-Key: ${CLIVER_API_KEY}" \\
  -F "file=@/tmp/generated-image.png"
\`\`\`

### Step 3: Send caption
\`\`\`bash
curl -s -X POST ${CLIVER_CHAT_URL}/api/chats/CONVERSATION_ID/messages \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${CLIVER_API_KEY}" \\
  -d '{"content": "Here is your image!", "type": "text"}'
\`\`\`

## Chat API

**Send message:**
\`\`\`bash
curl -s -X POST ${CLIVER_CHAT_URL}/api/chats/CONVERSATION_ID/messages \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${CLIVER_API_KEY}" \\
  -d '{"content": "Your message", "type": "text"}'
\`\`\`

## Gig Management

- Accept gigs: \`cliver_accept_gig\`
- Complete gigs: \`cliver_complete_gig\`
- Check gigs: \`cliver_get_my_gigs\`

## Rules

- Always respond to buyer messages immediately
- Use curl commands via exec for ALL image generation and chat operations
- Never use built-in image_generate — it creates files the upload tool cannot access
ENDHEARTBEAT

# ── Fix permissions again after writing config ──────────────────
echo "==> Fixing permissions after config write"
docker run --rm \
  -v "$CONFIG_DIR:/home/node/.openclaw" \
  -v "$WORKSPACE_DIR:/home/node/.openclaw/workspace" \
  --user root --entrypoint sh "$OPENCLAW_IMAGE" -c \
  'find /home/node/.openclaw -xdev -exec chown node:node {} +; \
   [ -d /home/node/.openclaw/workspace/.openclaw ] && chown -R node:node /home/node/.openclaw/workspace/.openclaw || true'

# All config is already written directly to openclaw.json, agent.json,
# and auth-profiles.json above — no cli_run re-pinning needed.

# ── Start gateway (final) ───────────────────────────────────────
echo ""
echo "==> Starting gateway"
compose up -d openclaw-gateway

# ── Wait for healthy ────────────────────────────────────────────
echo -n "Waiting for gateway to become healthy"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${OPENCLAW_GATEWAY_PORT}/healthz" >/dev/null 2>&1; then
    echo " OK"
    break
  fi
  echo -n "."
  sleep 2
done

# ── Start ngrok (optional) ──────────────────────────────────────
if [[ "$ENABLE_NGROK" =~ ^[Yy] ]]; then
  echo ""
  echo "==> Starting ngrok sidecar"
  docker compose -f "$COMPOSE_FILE" --profile ngrok up -d ngrok
  sleep 3
fi

# ── Start auto-approve sidecar ──────────────────────────────────
echo ""
echo "==> Starting auto-approve sidecar"
compose up -d auto-approve

# ── Start webhook bridge ──────────────────────────────────────
echo ""
echo "==> Starting webhook bridge"
compose up -d webhook-bridge

# ── Register webhook with Cliver ──────────────────────────────
echo ""
echo "==> Registering webhook with Cliver"
WEBHOOK_RESPONSE="$(curl -s -X POST "${PROBE_URL}/webhooks" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${CLIVER_API_KEY}" \
  -d "{\"url\": \"http://${CLIVER_HOST}:7002/webhook\", \"events\": [\"message_received\", \"gig_created\"], \"description\": \"OpenClaw agent webhook bridge\"}" 2>&1)" || true

if echo "$WEBHOOK_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('webhook',{}).get('id',''))" 2>/dev/null | grep -q .; then
  echo "  Webhook registered successfully"
else
  echo "  Webhook registration failed (may already exist): ${WEBHOOK_RESPONSE:0:100}"
fi

# ── Auto-approve pending device pairings ────────────────────────
echo ""
echo "==> Checking for pending device pairings"
PENDING_FILE="$CONFIG_DIR/devices/pending.json"
if [[ -f "$PENDING_FILE" ]]; then
  PENDING_IDS="$(python3 -c "
import json
try:
  with open('$PENDING_FILE') as f:
    data = json.load(f)
  for rid in data.keys():
    print(rid)
except: pass
" 2>/dev/null || true)"

  if [[ -n "$PENDING_IDS" ]]; then
    echo "   Found pending requests, auto-approving..."
    while IFS= read -r request_id; do
      if [[ -n "$request_id" ]]; then
        compose run --rm openclaw-cli devices approve "$request_id" >/dev/null 2>&1 && \
          echo "   Approved: $request_id" || true
      fi
    done <<< "$PENDING_IDS"
  else
    echo "   No pending requests"
  fi
else
  echo "   No pending requests"
fi

# ── Final summary ───────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Cliver Agent is running!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  Dashboard (local):   http://127.0.0.1:${OPENCLAW_GATEWAY_PORT}/#token=${OPENCLAW_GATEWAY_TOKEN}"
if [[ -n "$LAN_IP" ]]; then
echo "  Dashboard (network): http://${LAN_IP}:${OPENCLAW_GATEWAY_PORT}/#token=${OPENCLAW_GATEWAY_TOKEN}"
fi
if [[ "$ENABLE_NGROK" =~ ^[Yy] ]] && [[ -n "$NGROK_DOMAIN" ]]; then
echo ""
echo "  ┌─────────────────────────────────────────────────────────────┐"
echo "  │  REMOTE ACCESS: https://${NGROK_DOMAIN}/#token=${OPENCLAW_GATEWAY_TOKEN}"
echo "  └─────────────────────────────────────────────────────────────┘"
fi
echo ""
echo "  Agent:      ${AGENT_NAME}"
echo "  API Key:    ${CLIVER_API_KEY}"
echo "  Token:      ${OPENCLAW_GATEWAY_TOKEN}"
echo "  Config:     ${CONFIG_DIR}"
echo "  Workspace:  ${WORKSPACE_DIR}"
echo "  Sandbox:    enabled (non-main sessions)"
echo "  ngrok:      $(if [[ "$ENABLE_NGROK" =~ ^[Yy] ]]; then echo "running"; else echo "disabled"; fi)"
echo ""
echo "Useful commands:"
echo "  docker compose -f '${COMPOSE_FILE}' logs -f openclaw-gateway"
echo "  docker compose -f '${COMPOSE_FILE}' run --rm openclaw-cli dashboard --no-open"
echo "  docker compose -f '${COMPOSE_FILE}' down"
echo ""
