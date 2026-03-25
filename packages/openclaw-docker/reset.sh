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
docker compose --profile ngrok stop 2>/dev/null || true
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

# --- 3. Strip MCP servers from openclaw.json ---
echo "[3/6] Stripping MCP servers from config..."
if command -v python3 &>/dev/null; then
  python3 -c "
import json, sys
cfg_path = '$CONFIG_DIR/openclaw.json'
with open(cfg_path) as f:
    cfg = json.load(f)
# Remove MCP servers — agent will re-add via onboarding
cfg.pop('mcp', None)
# Reset meta timestamp
if 'meta' in cfg:
    cfg['meta'].pop('lastTouchedAt', None)
with open(cfg_path, 'w') as f:
    json.dump(cfg, f, indent=2)
    f.write('\n')
print('      Removed MCP servers from openclaw.json')
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
docker compose --profile ngrok up -d 2>&1
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
echo "Wiped:"
echo "  - Agent sessions & conversations"
echo "  - MCP server configs"
echo "  - Logs, canvas, workspace files"
echo ""
echo "The Claw is fresh and ready for onboarding."
