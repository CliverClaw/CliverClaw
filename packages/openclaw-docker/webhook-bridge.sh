#!/usr/bin/env bash
# Webhook bridge that receives HTTP webhooks and triggers OpenClaw agent via CLI.
# Runs inside the openclaw container using Node's built-in HTTP server.
# Uses execFile (not exec) for safe process spawning — no shell injection risk
# since all arguments are passed as array elements, not interpolated into a shell string.
set -uo pipefail

PORT="${BRIDGE_PORT:-7002}"

echo "[Bridge] Starting webhook bridge on port ${PORT}"

node -e "
const http = require('http');
const { execFile } = require('child_process');

let processing = false;
const queue = [];

function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;

  const { conversationId, senderName, preview, gigId } = queue.shift();

  const prompt = '[Cliver Message from ' + senderName + ']' +
    (gigId ? ' (Gig: ' + gigId + ')' : '') +
    '\nConversation: ' + conversationId + '\n\n\"' + preview + '\"\n\n' +
    'Please use cliver_get_new_messages to read and respond to ALL unread messages in conversation \"' + conversationId + '\" using cliver_send_message.';

  const args = ['dist/index.js', 'agent', '--agent', 'main', '--message', prompt];

  console.log('[Bridge] Triggering agent for conversation', conversationId, '(queue:', queue.length, 'remaining)');
  execFile('node', args, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    processing = false;
    if (err) {
      console.error('[Bridge] Agent error:', err.message);
      if (stdout) console.log('[Bridge] stdout:', stdout.slice(0, 500));
      if (stderr) console.log('[Bridge] stderr:', stderr.slice(0, 500));
    } else {
      console.log('[Bridge] Agent completed. Output:', (stdout || '').slice(0, 300));
    }
    // Process next in queue
    processQueue();
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mode: 'cli-bridge', processing, queueLength: queue.length }));
    return;
  }

  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        console.log('[Bridge] Webhook received:', event.type);

        if (event.type !== 'message_received') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ignored', reason: 'not message_received' }));
          return;
        }

        const payload = event.payload;
        if (payload.senderType !== 'human') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ignored', reason: 'not human message' }));
          return;
        }

        // Deduplicate: skip if same conversation is already queued
        const conversationId = payload.conversationId;
        const alreadyQueued = queue.some(q => q.conversationId === conversationId);

        if (!alreadyQueued) {
          queue.push({
            conversationId,
            senderName: payload.senderName || payload.senderId,
            preview: payload.contentPreview || 'New message',
            gigId: payload.gigId || '',
          });
          console.log('[Bridge] Queued message for conversation', conversationId);
        } else {
          console.log('[Bridge] Conversation', conversationId, 'already queued, deduplicating');
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'queued' }));

        processQueue();
      } catch (err) {
        console.error('[Bridge] Parse error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(${PORT}, '0.0.0.0', () => {
  console.log('[Bridge] Listening on port ${PORT}');
  console.log('[Bridge] POST /webhook - receive Cliver webhooks');
  console.log('[Bridge] GET /health - health check');
});
"
