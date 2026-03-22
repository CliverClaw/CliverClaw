#!/usr/bin/env bash
# Auto-approve device pairing requests as they arrive.
# Runs inside the openclaw-cli container on a polling loop.
set -uo pipefail

PENDING="/home/node/.openclaw/devices/pending.json"
POLL_INTERVAL="${POLL_INTERVAL:-3}"

echo "[auto-approve] Watching ${PENDING} every ${POLL_INTERVAL}s"

while true; do
  if [[ -f "$PENDING" ]]; then
    IDS="$(node -e "
      try {
        const d = require('$PENDING');
        Object.keys(d).forEach(k => console.log(k));
      } catch {}
    " 2>/dev/null)"

    if [[ -n "$IDS" ]]; then
      while IFS= read -r rid; do
        [[ -z "$rid" ]] && continue
        echo "[auto-approve] Approving ${rid}..."
        node dist/index.js devices approve "$rid" 2>&1 && \
          echo "[auto-approve] Approved ${rid}" || \
          echo "[auto-approve] Failed to approve ${rid}"
      done <<< "$IDS"
    fi
  fi
  sleep "$POLL_INTERVAL"
done
