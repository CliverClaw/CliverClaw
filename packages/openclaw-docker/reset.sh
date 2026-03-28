#!/usr/bin/env bash
#
# reset.sh — Reset the OpenClaw Claw to a fresh state
#
# Preserves:
#   - openclaw.json (gateway config, auth profiles, model settings)
#   - agents/main/agent/auth-profiles.json (Gemini API key)
#   - identity/ (device identity so owner stays paired)
#   - devices/ (paired devices so owner can reconnect)
#
# Wipes:
#   - Agent sessions/conversations
#   - MCP server configs (from openclaw.json)
#   - Logs
#   - Workspace files
#   - Canvas
#   - Backups

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$SCRIPT_DIR/data"
CONFIG_DIR="$DATA_DIR/config"

if [ ! -d "$DATA_DIR" ]; then
  echo "Error: data directory not found at $DATA_DIR"
  exit 1
fi

echo "=== OpenClaw Reset ==="
echo "Data dir: $DATA_DIR"
echo ""

# --- 1. Stop containers ---
echo "[1/6] Stopping containers..."
cd "$SCRIPT_DIR"
# Clear persisted cliver MCP config (API keys from previous onboarding) before stopping
docker exec openclaw-docker-openclaw-gateway-1 rm -rf /home/node/.cliver 2>/dev/null || true
docker compose stop 2>/dev/null || true
echo "      Done."

# --- 2. Clean root-owned files via Docker ---
echo "[2/6] Cleaning root-owned files..."
docker run --rm -v "$DATA_DIR:/data" alpine sh -c '
  # Wipe sessions
  rm -rf /data/config/agents/*/sessions
  # Wipe logs
  rm -rf /data/config/logs
  # Wipe canvas
  rm -rf /data/config/canvas
  # Wipe workspace content (but keep the dir)
  rm -rf /data/workspace/*
  rm -rf /data/workspace/.git
  rm -rf /data/workspace/.openclaw
  # Wipe backups
  rm -f /data/config/openclaw.json.bak*
  # Wipe update check
  rm -f /data/config/update-check.json
  # Wipe cron
  rm -rf /data/config/cron
'
echo "      Done."

# Re-seed HEARTBEAT.md for polling fallback
docker run --rm -i -v "$DATA_DIR:/data" alpine sh -c 'mkdir -p /data/workspace && cat > /data/workspace/HEARTBEAT.md' << 'HBEOF'
# Cliver Marketplace Polling

Poll for new Cliver gigs and messages every 30 seconds when idle, every 10 seconds when you have active conversations.

## Tasks

- Check for pending gigs: `cliver_get_my_gigs({ status: "pending" })`
- Check for new messages: `cliver_get_new_messages({})`
- If you have active gigs, check their status and respond to buyers promptly

## Image Generation & Delivery

When a buyer requests an image, use the Cliver Gateway API:

### Step 1: Generate image via Fal/Flux
```bash
curl -s -X POST http://172.17.0.1:7000/gateway/fal/execute \
  -H "X-API-Key: $(cat ~/.cliver/config.json | grep apiKey | cut -d'"' -f4)" \
  -H "Content-Type: application/json" \
  -d '{"action":"generate-image","prompt":"YOUR PROMPT","model":"fal-ai/flux/schnell","imageSize":"landscape_16_9"}'
```
This returns a jobId. Poll for the result:

### Step 2: Check status and get image URL
```bash
curl -s http://172.17.0.1:7000/gateway/fal/status/JOB_ID \
  -H "X-API-Key: $(cat ~/.cliver/config.json | grep apiKey | cut -d'"' -f4)"
```
When complete, this returns a result with an image URL.

### Step 3: Download the image
```bash
curl -sL -o /tmp/generated-image.png "IMAGE_URL_FROM_RESULT"
```

### Step 4: Upload to chat
Use `cliver_upload_chat_file({ conversationId: "...", filePath: "/tmp/generated-image.png", caption: "Here's your image!" })`

**IMPORTANT:** Always download and upload the actual file. Never send raw URLs to the buyer.

## Notes

- When a new gig appears, accept it and message the buyer
- Always respond to buyer messages within a few seconds
- Use cliver_send_message to reply in conversations
- Use cliver_upload_chat_file to send deliverables
HBEOF

# --- 3. Set Cliver MCP server in openclaw.json ---
echo "[3/6] Configuring Cliver MCP server..."
CLIVER_API_URL="${CLIVER_API_URL:-http://172.17.0.1:7000}"
if command -v python3 &>/dev/null; then
  python3 -c "
import json, sys
cfg_path = '$CONFIG_DIR/openclaw.json'
api_url = '$CLIVER_API_URL'
with open(cfg_path) as f:
    cfg = json.load(f)
# Set Cliver MCP server (pre-configured so agent has tools on boot)

# Read Gemini API key from auth-profiles
gemini_key = ''
try:
    auth_path = '$CONFIG_DIR/agents/main/agent/auth-profiles.json'
    with open(auth_path) as af:
        auth = json.load(af)
    for p in auth.get('profiles', {}).values():
        if p.get('provider') == 'google' and p.get('key'):
            gemini_key = p['key']
            break
except: pass

cfg['mcp'] = {
    'servers': {
        'cliver': {
            'command': 'npx',
            'args': ['-y', 'cliver-mcp'],
            'env': {'CLIVER_API_URL': api_url, 'CLIVER_CHAT_URL': api_url.replace(':7000', ':7001')}
        },
        'nano-banana': {
            'command': 'npx',
            'args': ['-y', 'nano-banana-mcp'],
            'env': {'GOOGLE_AI_API_KEY': gemini_key}
        }
    }
}
# Reset meta timestamp
if 'meta' in cfg:
    cfg['meta'].pop('lastTouchedAt', None)
with open(cfg_path, 'w') as f:
    json.dump(cfg, f, indent=2)
    f.write('\n')
print(f'      Cliver MCP configured (API: {api_url})')
"
else
  echo "      Warning: python3 not found, skipping MCP cleanup"
fi

# --- 4. Verify auth-profiles.json exists ---
echo "[4/6] Verifying auth credentials..."
AUTH_FILE="$CONFIG_DIR/agents/main/agent/auth-profiles.json"
if [ -f "$AUTH_FILE" ]; then
  echo "      Gemini auth-profiles.json: OK"
else
  echo "      Warning: auth-profiles.json missing!"
  echo "      Creating from template..."
  mkdir -p "$(dirname "$AUTH_FILE")"
  cat > "$AUTH_FILE" << 'AUTHEOF'
{
  "version": 1,
  "profiles": {
    "google:default": {
      "type": "api_key",
      "provider": "google",
      "key": "AIzaSyDFiemMXL2BnHbS2Jwp-0sRi0ObTwZ58bI"
    }
  },
  "lastGood": {
    "google": "google:default"
  }
}
AUTHEOF
  chmod 644 "$AUTH_FILE"
  echo "      Created auth-profiles.json with Gemini key"
fi

# --- 5. Verify identity/devices exist ---
echo "[5/6] Verifying device identity..."
if [ -f "$CONFIG_DIR/identity/device.json" ]; then
  echo "      Device identity: OK"
else
  echo "      Warning: No device identity found (owner will need to re-pair)"
fi
if [ -f "$CONFIG_DIR/devices/paired.json" ]; then
  echo "      Paired devices: OK"
else
  echo "      Warning: No paired devices (owner will need to re-pair)"
fi

# --- 6. Restart containers ---
echo "[6/6] Starting containers..."
# Note: ngrok is managed by host systemd service (cliver-ngrok.service), not Docker
docker compose up -d 2>&1
echo ""

# Wait for health
echo "Waiting for gateway to be healthy..."
for i in $(seq 1 30); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' openclaw-docker-openclaw-gateway-1 2>/dev/null || echo "unknown")
  if [ "$STATUS" = "healthy" ]; then
    echo "Gateway: healthy"
    break
  fi
  sleep 2
done

echo ""
echo "=== Reset Complete ==="
echo ""
echo "Preserved:"
echo "  - Gateway config (openclaw.json)"
echo "  - Gemini API key (auth-profiles.json)"
echo "  - Device identity & paired devices"
echo ""
echo "Configured:"
echo "  - Cliver MCP server (cliver-mcp via npx)"
echo ""
echo "Wiped:"
echo "  - Agent sessions & conversations"
echo "  - Logs, canvas, workspace files"
echo ""
echo "The Claw is fresh and ready for onboarding."
