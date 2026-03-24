import { io, Socket } from "socket.io-client";
import { state } from "./state";
import type { CliverInboundMessage } from "./inbound";

export interface MessageHandler {
  (message: CliverInboundMessage): void;
}

let messageHandlers: MessageHandler[] = [];

export function onMessage(handler: MessageHandler) {
  messageHandlers.push(handler);
  return () => {
    messageHandlers = messageHandlers.filter(h => h !== handler);
  };
}

export async function connectWebSocket(): Promise<void> {
  if (state.socket) return;
  if (!state.apiKey) {
    state.runtime?.logger.info("[Cliver] No API key - skipping WebSocket connection");
    return;
  }

  state.runtime?.logger.info(`[Cliver] Connecting WebSocket to ${state.chatUrl}...`);

  // Create socket and assign to state immediately to prevent duplicate connections
  // from race conditions when register() is called multiple times
  const socket: Socket = io(state.chatUrl, {
    transports: ["websocket", "polling"],
    auth: { apiKey: state.apiKey },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  });
  state.socket = socket;

  socket.on("connect", () => {
    state.runtime?.logger.info("[Cliver] WebSocket connected");
    socket.emit("auth", { apiKey: state.apiKey });
  });

  socket.on("connect_error", (err: Error) => {
    state.runtime?.logger.warn(`[Cliver] Connection error: ${err.message}`);
  });

  socket.on("auth_success", async (data: { agentId?: string }) => {
    state.runtime?.logger.info(`[Cliver] Authenticated! Agent: ${data.agentId || "unknown"}`);
    state.agentId = data.agentId || null;

    // Re-subscribe to any previously tracked conversations
    for (const convId of state.subscribedConversations) {
      socket.emit("join_conversation", { conversationId: convId });
    }

    // Auto-subscribe to all agent's conversations
    try {
      const response = await fetch(`${state.chatUrl}/api/chats`, {
        headers: {
          "X-API-Key": state.apiKey || "",
        },
      });
      if (response.ok) {
        const convos = await response.json();
        const conversations = convos.conversations || convos || [];
        for (const conv of conversations) {
          if (conv.id && !state.subscribedConversations.has(conv.id)) {
            socket.emit("join_conversation", { conversationId: conv.id });
            state.subscribedConversations.add(conv.id);
            state.runtime?.logger.info(`[Cliver] Auto-subscribed to conversation ${conv.id}`);
          }
        }
        state.runtime?.logger.info(`[Cliver] Subscribed to ${conversations.length} conversations`);
      }
    } catch (e) {
      state.runtime?.logger.warn(`[Cliver] Failed to auto-subscribe to conversations: ${e}`);
    }
  });

  socket.on("auth_error", (err: { message?: string }) => {
    state.runtime?.logger.warn(`[Cliver] Auth failed: ${err.message || "unknown error"}`);
  });

  socket.on("new_message", (message: CliverInboundMessage) => {
    // Only process messages from humans (not our own messages)
    if (message.senderType === "human") {
      state.runtime?.logger.info(`[Cliver] New message from ${message.senderName || message.senderId}: "${message.content?.substring(0, 50)}..."`);

      // Buffer the message
      const convId = message.conversationId;
      if (!state.messageBuffer.has(convId)) {
        state.messageBuffer.set(convId, []);
      }
      state.messageBuffer.get(convId)!.push(message);

      // Notify handlers
      for (const handler of messageHandlers) {
        try {
          handler(message);
        } catch (e) {
          state.runtime?.logger.warn(`[Cliver] Message handler error: ${e}`);
        }
      }
    }
  });

  // Auto-subscribe when a new conversation is created for this agent
  socket.on("conversation_created", (conversation: { id: string; gigId?: string }) => {
    if (conversation.id && !state.subscribedConversations.has(conversation.id)) {
      socket.emit("join_conversation", { conversationId: conversation.id });
      state.subscribedConversations.add(conversation.id);
      state.runtime?.logger.info(`[Cliver] Auto-subscribed to new conversation ${conversation.id} (gig: ${conversation.gigId || "none"})`);
    }
  });

  socket.on("disconnect", (reason: string) => {
    state.runtime?.logger.info(`[Cliver] WebSocket disconnected: ${reason}`);
  });

  socket.on("reconnect", (attempt: number) => {
    state.runtime?.logger.info(`[Cliver] Reconnected after ${attempt} attempts`);
    socket.emit("auth", { apiKey: state.apiKey });
  });

  // Already set above before async operations, but ensure it's assigned
  state.socket = socket;
}

export function disconnectWebSocket(): void {
  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }
  state.subscribedConversations.clear();
  state.agentId = null;
}
