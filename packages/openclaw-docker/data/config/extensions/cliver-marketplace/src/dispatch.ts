import { state, chatRequest } from "./state";
import { onMessage } from "./gateway";

let dispatchStarted = false;
let agentProcessing = false;
const messageQueue: Array<{ conversationId: string; senderName: string; content: string; gigId?: string }> = [];

/**
 * Trigger the full OpenClaw CLI agent, which has access to ALL tools
 * including cliver_generate_image, cliver_upload_chat_file, etc.
 * Uses execFile for safe process spawning.
 */
function triggerCliAgent(conversationId: string, senderName: string, content: string, gigId?: string) {
  if (agentProcessing) {
    // Deduplicate: skip if same conversation already queued
    if (!messageQueue.some(m => m.conversationId === conversationId)) {
      messageQueue.push({ conversationId, senderName, content, gigId });
      state.runtime?.logger.info(`[Cliver] Queued message for ${conversationId} (queue: ${messageQueue.length})`);
    }
    return;
  }
  agentProcessing = true;

  // Send typing indicator immediately so the buyer sees activity
  chatRequest("POST", `/api/chats/${conversationId}/typing`, { isTyping: true })
    .then(() => state.runtime?.logger.info(`[Cliver] Typing indicator sent for ${conversationId}`))
    .catch((e) => state.runtime?.logger.warn(`[Cliver] Typing indicator failed: ${e}`));

  const { execFile } = require("child_process");

  const prompt = [
    `[Cliver Marketplace - Incoming Message]`,
    `Conversation: ${conversationId}`,
    gigId ? `Gig: ${gigId}` : "",
    `From: ${senderName}`,
    `Message: "${content}"`,
    ``,
    `Respond to this buyer using your cliver tools (cliver_send_message, cliver_generate_image, cliver_upload_chat_file).`,
    `Use conversation_id "${conversationId}" for all replies.`,
    `If they want an image, use cliver_generate_image with the prompt and conversationId to auto-upload it.`,
  ].filter(Boolean).join("\n");

  const args = ["dist/index.js", "agent", "--agent", "main", "--message", prompt];

  state.runtime?.logger.info(`[Cliver] Triggering CLI agent for ${conversationId}`);

  execFile("node", args, {
    timeout: 180000,
    maxBuffer: 10 * 1024 * 1024,
  }, (err: any, stdout: string, stderr: string) => {
    agentProcessing = false;

    if (err) {
      state.runtime?.logger.warn(`[Cliver] CLI agent error: ${err.message}`);
      if (stdout) state.runtime?.logger.info(`[Cliver] stdout: ${stdout.slice(0, 300)}`);
    } else {
      state.runtime?.logger.info(`[Cliver] CLI agent completed for ${conversationId}`);
    }

    // Process next in queue
    if (messageQueue.length > 0) {
      const next = messageQueue.shift()!;
      triggerCliAgent(next.conversationId, next.senderName, next.content, next.gigId);
    }
  });
}

/**
 * Start listening for inbound messages via WebSocket and trigger CLI agent.
 */
export function startInboundDispatch() {
  if (dispatchStarted) return;
  dispatchStarted = true;

  state.runtime?.logger.info("[Cliver] Inbound dispatch active — messages will trigger CLI agent with full tool access");

  const unsubscribe = onMessage((message) => {
    state.runtime?.logger.info(
      `[Cliver] New message from ${message.senderName || message.senderId}: "${message.content?.substring(0, 50)}..."`
    );

    triggerCliAgent(
      message.conversationId,
      message.senderName || message.senderId,
      message.content,
    );
  });

  return unsubscribe;
}
