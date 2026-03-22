import { state, chatRequest } from "./state";

export interface OutboundContext {
  to: string;
  text?: string;
  media?: { url: string; contentType?: string };
  replyTo?: string;
  accountId?: string;
}

export interface OutboundResult {
  channel: string;
  ok: boolean;
  messageId?: string;
  error?: string;
}

export async function sendCliverMessage(ctx: OutboundContext): Promise<OutboundResult> {
  try {
    // Send typing indicator
    chatRequest("POST", `/api/chats/${ctx.to}/typing`, { isTyping: true }).catch(() => {});

    const response = await chatRequest("POST", `/api/chats/${ctx.to}/messages`, {
      content: ctx.text,
      type: "text",
    });

    // Subscribe to conversation for future updates
    if (!state.subscribedConversations.has(ctx.to)) {
      state.subscribedConversations.add(ctx.to);
      state.socket?.emit("join_conversation", { conversationId: ctx.to });
      state.runtime?.logger.info(`[Cliver] Subscribed to conversation ${ctx.to}`);
    }

    return {
      channel: "cliver",
      ok: true,
      messageId: response.id,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    state.runtime?.logger.warn(`[Cliver] Failed to send message: ${error}`);
    return {
      channel: "cliver",
      ok: false,
      error,
    };
  }
}

export async function sendCliverMedia(ctx: OutboundContext): Promise<OutboundResult> {
  try {
    if (!ctx.media?.url) {
      return {
        channel: "cliver",
        ok: false,
        error: "No media URL provided",
      };
    }

    // Send typing indicator
    chatRequest("POST", `/api/chats/${ctx.to}/typing`, { isTyping: true }).catch(() => {});

    // Determine media type from contentType or URL
    let mediaType = "file";
    const contentType = ctx.media.contentType || "";
    if (contentType.startsWith("image/")) mediaType = "image";
    else if (contentType.startsWith("video/")) mediaType = "video";
    else if (contentType.startsWith("audio/")) mediaType = "audio";

    const response = await chatRequest("POST", `/api/chats/${ctx.to}/messages`, {
      content: ctx.text || "",
      type: mediaType,
      mediaUrl: ctx.media.url,
    });

    // Subscribe to conversation
    if (!state.subscribedConversations.has(ctx.to)) {
      state.subscribedConversations.add(ctx.to);
      state.socket?.emit("join_conversation", { conversationId: ctx.to });
    }

    return {
      channel: "cliver",
      ok: true,
      messageId: response.id,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    state.runtime?.logger.warn(`[Cliver] Failed to send media: ${error}`);
    return {
      channel: "cliver",
      ok: false,
      error,
    };
  }
}

export const cliverOutbound = {
  deliveryMode: "direct" as const,
  textChunkLimit: 4000,
  sendText: sendCliverMessage,
  sendMedia: sendCliverMedia,
};
