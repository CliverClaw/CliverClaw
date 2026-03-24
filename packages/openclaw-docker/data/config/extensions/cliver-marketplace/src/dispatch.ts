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
    gigId ? `Gig ID: ${gigId}` : "",
    `From: ${senderName}`,
    `Message: "${content}"`,
    ``,
    `## Your Workflow`,
    ``,
    `You are a professional AI agent on the Cliver marketplace. A buyer has sent you a message.`,
    ``,
    gigId ? `### IMPORTANT: This is a PAID GIG (${gigId})` : `### Note: No gig attached to this conversation`,
    gigId ? `1. First, check gig details: use cliver_get_gig with gigId "${gigId}" to see the title, requirements, budget, status, and revision count.` : "",
    gigId ? `2. Only do work if the gig status is "in_progress". If it's "pending", use cliver_accept_gig first.` : "",
    gigId ? `3. Do the work the buyer requested (generate images, write content, etc.)` : "",
    gigId ? `4. Send results via cliver_send_message or cliver_generate_image (with conversationId "${conversationId}")` : "",
    gigId ? `5. After delivering results, use cliver_deliver_gig with gigId "${gigId}" to formally mark it as delivered.` : "",
    gigId ? `6. The buyer will then approve (releasing your payment) or request revisions.` : "",
    gigId ? `7. If they request revisions, you'll get another message — revise and deliver again.` : "",
    gigId ? `8. Do NOT use cliver_complete_gig — the buyer approves payment, not you.` : "",
    ``,
    `## Tools Available`,
    `- cliver_send_message: Send text replies (conversationId: "${conversationId}")`,
    `- cliver_generate_image: Generate and auto-upload images`,
    `- cliver_upload_chat_file: Upload files to the conversation`,
    `- cliver_get_gig: Check gig status, requirements, budget`,
    `- cliver_accept_gig: Accept a pending gig`,
    `- cliver_deliver_gig: Mark work as delivered for buyer review`,
    ``,
    `Respond professionally. Be helpful and deliver high-quality work.`,
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

  const unsubscribe = onMessage(async (message) => {
    state.runtime?.logger.info(
      `[Cliver] New message from ${message.senderName || message.senderId}: "${message.content?.substring(0, 50)}..."`
    );

    // Look up gigId from conversation
    let gigId: string | undefined;
    try {
      const conv = await chatRequest("GET", `/api/chats/${message.conversationId}`);
      gigId = conv?.gigId || undefined;
    } catch (e) {
      state.runtime?.logger.warn(`[Cliver] Failed to fetch conversation details: ${e}`);
    }

    triggerCliAgent(
      message.conversationId,
      message.senderName || message.senderId,
      message.content,
      gigId,
    );
  });

  return unsubscribe;
}
