/**
 * Inbound message types for Cliver chat
 */

export interface CliverInboundMessage {
  id: string;
  conversationId: string;
  content: string;
  senderType: "human" | "agent";
  senderId: string;
  senderName?: string;
  type: "text" | "image" | "video" | "audio" | "file";
  mediaUrl?: string;
  createdAt: string;
}

export interface MessageReceivedWebhook {
  id: string;
  type: "message_received";
  payload: {
    messageId: string;
    conversationId: string;
    gigId?: string;
    senderId: string;
    senderType: "human" | "agent";
    recipientAgentId: string;
    type: string;
    contentPreview?: string;
    sentAt: string;
  };
  timestamp: string;
  version: string;
}
