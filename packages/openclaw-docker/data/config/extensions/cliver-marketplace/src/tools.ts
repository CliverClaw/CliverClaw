import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { state, apiRequest, chatRequest, initState } from "./state";
import { connectWebSocket } from "./gateway";
import { startInboundDispatch } from "./dispatch";

function ok(text: string, details?: unknown) {
  return { content: [{ type: "text" as const, text }], details: details ?? {} };
}

export function registerTools(api: OpenClawPluginApi) {
  // Initialize state from plugin config
  const cfg = (api as any).pluginConfig ?? {};
  initState(cfg, {
    logger: api.logger,
    config: { get: () => cfg },
  });

  // ─── ONBOARD ───────────────────────────────────────────
  api.registerTool({
    name: "cliver_onboard",
    label: "Cliver Onboard",
    description:
      "Register on Cliver marketplace, get API key and starter credits. " +
      "Optionally create your first service listing. No wallet needed. Call this first.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Your agent name" },
        skills: { type: "array", items: { type: "string" }, description: "Your skills" },
        bio: { type: "string", description: "Short bio" },
        serviceTitle: { type: "string", description: "First service title (optional)" },
        serviceDescription: { type: "string", description: "What the service does (optional)" },
        servicePrice: { type: "number", description: "Price in USDC (optional)" },
        serviceCategory: { type: "string", description: 'Category: "code", "video", "writing", etc. (optional)' },
      },
      required: ["name"],
    },
    async execute(_id: string, params: any) {
      if (state.apiKey) {
        try {
          const me = await apiRequest("GET", "/agents/me");
          const services = await apiRequest("GET", "/agents/me/services");
          return ok(JSON.stringify({ status: "already_registered", agent: me, services }));
        } catch {
          // Key invalid, re-register
        }
      }

      const regData = await apiRequest("POST", "/auth/open-register", {
        name: params.name,
        skills: params.skills ?? [],
        bio: params.bio,
      });

      state.apiKey = regData.apiKey;
      state.token = regData.token;
      state.agentId = regData.agent?.id;

      // Persist the new API key to openclaw.json so it survives restarts
      try {
        const fs = require("fs");
        const configPath = "/home/node/.openclaw/openclaw.json";
        let openclawConfig: any = {};
        if (fs.existsSync(configPath)) {
          openclawConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        }
        // Ensure nested structure exists
        if (!openclawConfig.plugins) openclawConfig.plugins = {};
        if (!openclawConfig.plugins.entries) openclawConfig.plugins.entries = {};
        if (!openclawConfig.plugins.entries["cliver-marketplace"]) openclawConfig.plugins.entries["cliver-marketplace"] = {};
        if (!openclawConfig.plugins.entries["cliver-marketplace"].config) openclawConfig.plugins.entries["cliver-marketplace"].config = {};
        openclawConfig.plugins.entries["cliver-marketplace"].config.apiKey = regData.apiKey;
        fs.writeFileSync(configPath, JSON.stringify(openclawConfig, null, 2));
        api.logger.info("[Cliver] API key persisted to openclaw.json");
      } catch (e) {
        api.logger.warn(`[Cliver] Failed to persist API key to config: ${e}`);
      }

      // Connect WebSocket now that we have credentials, then start inbound dispatch
      connectWebSocket().then(() => {
        startInboundDispatch();
      }).catch((e) => api.logger.warn(`[Cliver] WebSocket connect failed: ${e}`));

      let service = null;
      if (params.serviceTitle && params.serviceDescription && params.servicePrice && params.serviceCategory) {
        service = await apiRequest("POST", "/agents/me/services", {
          title: params.serviceTitle,
          description: params.serviceDescription,
          price: params.servicePrice,
          category: params.serviceCategory,
        });
      }

      return ok(JSON.stringify({
        status: "registered",
        agent: regData.agent,
        apiKey: regData.apiKey,
        starterCredits: regData.starterCredits,
        service,
        message: regData.message,
        note: "WebSocket channel will auto-connect. Messages will be pushed to you natively.",
      }));
    },
  });

  // ─── CHECK BALANCE ─────────────────────────────────────
  api.registerTool({
    name: "cliver_check_balance",
    label: "Cliver Balance",
    description: "Check your Cliver wallet balance and credits.",
    parameters: { type: "object", properties: {} },
    async execute() {
      const data = await apiRequest("GET", "/wallet/balance");
      return ok(JSON.stringify(data));
    },
  });

  // ─── CREATE SERVICE ────────────────────────────────────
  api.registerTool({
    name: "cliver_create_service",
    label: "Cliver Create Service",
    description: "Create a new service listing on Cliver marketplace.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Service title" },
        description: { type: "string", description: "What you offer" },
        price: { type: "number", description: "Price in USDC" },
        category: { type: "string", description: 'Category: "code", "video", "writing", "data"' },
      },
      required: ["title", "description", "price", "category"],
    },
    async execute(_id: string, params: any) {
      const data = await apiRequest("POST", "/agents/me/services", params);
      return ok(JSON.stringify(data));
    },
  });

  // ─── LIST SERVICES ─────────────────────────────────────
  api.registerTool({
    name: "cliver_list_services",
    label: "Cliver List Services",
    description: "Browse services on the Cliver marketplace.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter by category" },
        agentId: { type: "string", description: "Filter by agent" },
      },
    },
    async execute(_id: string, params: any) {
      const qs = new URLSearchParams();
      if (params.category) qs.set("category", params.category);
      if (params.agentId) qs.set("agentId", params.agentId);
      const suffix = qs.toString() ? `?${qs}` : "";
      const data = await apiRequest("GET", `/services${suffix}`);
      return ok(JSON.stringify(data));
    },
  });

  // ─── GET MY GIGS ───────────────────────────────────────
  api.registerTool({
    name: "cliver_get_my_gigs",
    label: "Cliver My Gigs",
    description: "List your gigs. Use this to check for pending work to accept.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", description: '"pending", "in_progress", "completed", "disputed"' },
      },
    },
    async execute(_id: string, params: any) {
      const qs = params.status ? `?status=${params.status}` : "";
      const data = await apiRequest("GET", `/agents/me/gigs${qs}`);
      return ok(JSON.stringify(data));
    },
  });

  // ─── ACCEPT GIG ────────────────────────────────────────
  api.registerTool({
    name: "cliver_accept_gig",
    label: "Cliver Accept Gig",
    description: "Accept a pending gig and start working on it.",
    parameters: {
      type: "object",
      properties: {
        gigId: { type: "string", description: "Gig ID to accept" },
      },
      required: ["gigId"],
    },
    async execute(_id: string, params: any) {
      const data = await apiRequest("POST", `/gigs/${params.gigId}/accept`);
      return ok(JSON.stringify(data));
    },
  });

  // ─── GET GIG ───────────────────────────────────────────
  api.registerTool({
    name: "cliver_get_gig",
    label: "Cliver Get Gig",
    description: "Get details of a specific gig.",
    parameters: {
      type: "object",
      properties: {
        gigId: { type: "string", description: "Gig ID" },
      },
      required: ["gigId"],
    },
    async execute(_id: string, params: any) {
      const data = await apiRequest("GET", `/gigs/${params.gigId}`);
      return ok(JSON.stringify(data));
    },
  });

  // ─── COMPLETE GIG ──────────────────────────────────────
  api.registerTool({
    name: "cliver_complete_gig",
    label: "Cliver Complete Gig",
    description: "Mark a gig as completed. Releases payment (90% to you, 10% platform fee).",
    parameters: {
      type: "object",
      properties: {
        gigId: { type: "string", description: "Gig ID to complete" },
      },
      required: ["gigId"],
    },
    async execute(_id: string, params: any) {
      const data = await apiRequest("POST", `/gigs/${params.gigId}/complete`);
      return ok(JSON.stringify(data));
    },
  });

  // ─── SEND MESSAGE ──────────────────────────────────────
  api.registerTool({
    name: "cliver_send_message",
    label: "Cliver Send Message",
    description: "Send a message to a buyer in a gig conversation. Use this for manual replies.",
    parameters: {
      type: "object",
      properties: {
        conversationId: { type: "string", description: "Conversation ID" },
        content: { type: "string", description: "Message text" },
      },
      required: ["conversationId", "content"],
    },
    async execute(_id: string, params: any) {
      chatRequest("POST", `/api/chats/${params.conversationId}/typing`, { isTyping: true }).catch(() => {});

      const data = await chatRequest("POST", `/api/chats/${params.conversationId}/messages`, {
        content: params.content,
        type: "text",
      });

      // Subscribe to this conversation for real-time updates
      if (!state.subscribedConversations.has(params.conversationId)) {
        state.subscribedConversations.add(params.conversationId);
        state.socket?.emit("join_conversation", { conversationId: params.conversationId });
        api.logger.info(`[Cliver] Subscribed to conversation ${params.conversationId}`);
      }

      return ok(JSON.stringify(data));
    },
  });

  // ─── UPLOAD CHAT FILE ────────────────────────────────────
  api.registerTool({
    name: "cliver_upload_chat_file",
    label: "Cliver Upload Chat File",
    description:
      "Upload a file (image, document, etc.) to a Cliver chat conversation. " +
      "Use this to deliver generated images, results, or any file to the buyer. " +
      "Provide the local file path and conversation ID. Optionally add a caption.",
    parameters: {
      type: "object",
      properties: {
        conversationId: { type: "string", description: "Conversation ID to send the file to" },
        filePath: { type: "string", description: "Local file path to upload" },
        caption: { type: "string", description: "Optional text caption to send after the file" },
      },
      required: ["conversationId", "filePath"],
    },
    async execute(_id: string, params: any) {
      const fs = require("fs");
      const path = require("path");

      if (!fs.existsSync(params.filePath)) {
        return ok(JSON.stringify({ error: `File not found: ${params.filePath}` }));
      }

      const filename = path.basename(params.filePath);
      const fileBuffer = fs.readFileSync(params.filePath);
      const mimeType = filename.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? `image/${filename.split('.').pop()!.toLowerCase().replace('jpg', 'jpeg')}` : "application/octet-stream";

      // Build multipart form data manually
      const boundary = `----formdata-${Date.now()}`;
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
      const footer = `\r\n--${boundary}--\r\n`;

      const body = Buffer.concat([
        Buffer.from(header),
        fileBuffer,
        Buffer.from(footer),
      ]);

      const response = await fetch(`${state.chatUrl}/api/chats/${params.conversationId}/upload`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      if (!response.ok) {
        const err = await response.text();
        return ok(JSON.stringify({ error: `Upload failed: ${response.status} ${err}` }));
      }

      const result = await response.json() as any;

      // Send caption as follow-up message
      if (params.caption) {
        await chatRequest("POST", `/api/chats/${params.conversationId}/messages`, {
          content: params.caption,
          type: "text",
        });
      }

      const fileType = result.message?.type === "image" ? "Image" : "File";
      return ok(JSON.stringify({
        status: `${fileType} uploaded and shared in chat`,
        messageId: result.message?.id,
        type: result.message?.type,
        url: result.url,
      }));
    },
  });

  // ─── GENERATE IMAGE ─────────────────────────────────────
  api.registerTool({
    name: "cliver_generate_image",
    label: "Cliver Generate Image",
    description:
      "Generate an image using the Cliver service gateway (Google AI) and optionally " +
      "upload it to a chat conversation. Returns the file path of the generated image. " +
      "If conversationId is provided, the image is automatically uploaded to the chat.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Text prompt describing the image to generate" },
        conversationId: { type: "string", description: "Optional: conversation ID to auto-upload the image to" },
        caption: { type: "string", description: "Optional: caption to send with the image" },
        model: { type: "string", description: "Model to use: 'sdxl', 'flux', or 'generate' (default: 'generate')" },
      },
      required: ["prompt"],
    },
    async execute(_id: string, params: any) {
      const action = params.model || "generate";

      // Call the gateway to generate the image
      const response = await fetch(`${state.apiUrl}/gateway/google-ai/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": state.apiKey || "",
        },
        body: JSON.stringify({
          action,
          input: { prompt: params.prompt },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return ok(JSON.stringify({ error: `Image generation failed: ${response.status} ${err}` }));
      }

      const result = await response.json() as any;

      // The gateway returns output with URL(s)
      const imageUrl = result.output?.url || result.output?.images?.[0] || result.output?.[0] || result.output;

      if (!imageUrl || typeof imageUrl !== "string") {
        return ok(JSON.stringify({
          status: "generated",
          note: "Image generated but no URL returned. Check gateway response.",
          result,
        }));
      }

      // Download the image to a temp file
      const fs = require("fs");
      const path = require("path");
      const os = require("os");

      const ext = imageUrl.match(/\.(png|jpg|jpeg|webp)/) ? imageUrl.match(/\.(png|jpg|jpeg|webp)/)![0] : ".png";
      const tempPath = path.join(os.tmpdir(), `cliver-image-${Date.now()}${ext}`);

      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) {
        return ok(JSON.stringify({ error: `Failed to download generated image: ${imgResponse.status}` }));
      }
      const buffer = Buffer.from(await imgResponse.arrayBuffer());
      fs.writeFileSync(tempPath, buffer);

      // Auto-upload to conversation if provided
      if (params.conversationId) {
        const filename = path.basename(tempPath);
        const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
        const boundary = `----formdata-${Date.now()}`;
        const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
        const footer = `\r\n--${boundary}--\r\n`;
        const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(footer)]);

        const uploadResponse = await fetch(`${state.chatUrl}/api/chats/${params.conversationId}/upload`, {
          method: "POST",
          headers: {
            "X-API-Key": state.apiKey || "",
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
          },
          body,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json() as any;

          if (params.caption) {
            await chatRequest("POST", `/api/chats/${params.conversationId}/messages`, {
              content: params.caption,
              type: "text",
            });
          }

          return ok(JSON.stringify({
            status: "Image generated and uploaded to chat",
            filePath: tempPath,
            chatUrl: uploadResult.url,
            messageId: uploadResult.message?.id,
          }));
        } else {
          const uploadErr = await uploadResponse.text();
          return ok(JSON.stringify({
            status: "Image generated but upload failed",
            filePath: tempPath,
            imageUrl,
            uploadError: uploadErr,
          }));
        }
      }

      return ok(JSON.stringify({
        status: "Image generated",
        filePath: tempPath,
        imageUrl,
      }));
    },
  });

  // ─── GET CONVERSATIONS ─────────────────────────────────
  api.registerTool({
    name: "cliver_get_conversations",
    label: "Cliver Conversations",
    description: "List your chat conversations.",
    parameters: {
      type: "object",
      properties: {
        gigId: { type: "string", description: "Filter by gig ID (optional)" },
      },
    },
    async execute(_id: string, params: any) {
      const qs = params.gigId ? `?gigId=${params.gigId}` : "";
      const data = await chatRequest("GET", `/api/chats${qs}`);
      return ok(JSON.stringify(data));
    },
  });

  // ─── GET MESSAGE HISTORY ───────────────────────────────
  api.registerTool({
    name: "cliver_get_message_history",
    label: "Cliver Message History",
    description: "Get full message history for a conversation.",
    parameters: {
      type: "object",
      properties: {
        conversationId: { type: "string", description: "Conversation ID" },
        limit: { type: "number", description: "Max messages (default 100)" },
      },
      required: ["conversationId"],
    },
    async execute(_id: string, params: any) {
      const qs = params.limit ? `?limit=${params.limit}` : "";
      const data = await chatRequest("GET", `/api/chats/${params.conversationId}/messages${qs}`);

      // Subscribe to this conversation for real-time updates
      if (!state.subscribedConversations.has(params.conversationId)) {
        state.subscribedConversations.add(params.conversationId);
        state.socket?.emit("join_conversation", { conversationId: params.conversationId });
        api.logger.info(`[Cliver] Subscribed to conversation ${params.conversationId}`);
      }

      return ok(JSON.stringify(data));
    },
  });

  // ─── CONNECTION STATUS ─────────────────────────────────
  api.registerTool({
    name: "cliver_connection_status",
    label: "Cliver Connection Status",
    description: "Check WebSocket connection status and subscribed conversations.",
    parameters: { type: "object", properties: {} },
    async execute() {
      return ok(JSON.stringify({
        websocketConnected: !!state.socket?.connected,
        agentId: state.agentId,
        subscribedConversations: Array.from(state.subscribedConversations),
        bufferedMessages: Array.from(state.messageBuffer.values()).reduce((sum, msgs) => sum + msgs.length, 0),
        apiUrl: state.apiUrl,
        chatUrl: state.chatUrl,
        hasApiKey: !!state.apiKey,
      }));
    },
  });

  // ─── GET NEW MESSAGES ──────────────────────────────────
  api.registerTool({
    name: "cliver_get_new_messages",
    label: "Cliver Get Messages",
    description:
      "Get new messages from buyers. Returns buffered WebSocket messages " +
      "or polls REST. Clears the buffer after reading.",
    parameters: {
      type: "object",
      properties: {
        conversationId: { type: "string", description: "Filter by conversation (optional)" },
      },
    },
    async execute(_id: string, params: any) {
      // First check WebSocket buffer
      if (state.messageBuffer.size > 0) {
        let messages: any[] = [];
        if (params.conversationId) {
          messages = state.messageBuffer.get(params.conversationId) ?? [];
          state.messageBuffer.delete(params.conversationId);
        } else {
          for (const [, msgs] of state.messageBuffer) messages.push(...msgs);
          state.messageBuffer.clear();
        }
        if (messages.length > 0) {
          return ok(JSON.stringify({ source: "websocket", messages }));
        }
      }

      // Fall back to REST polling
      const pending = await chatRequest("GET", "/api/agents/me/pending");
      return ok(JSON.stringify({ source: "rest", ...pending }));
    },
  });

  // ─── CHECK PENDING ─────────────────────────────────────
  api.registerTool({
    name: "cliver_check_pending",
    label: "Cliver Check Pending",
    description:
      "Check for unread messages and pending gigs. Signals your presence " +
      "to buyers (they see a 'thinking' indicator).",
    parameters: { type: "object", properties: {} },
    async execute() {
      // First check local buffer
      const bufferedCount = Array.from(state.messageBuffer.values()).reduce((sum, msgs) => sum + msgs.length, 0);

      // Then check REST
      const pending = await chatRequest("GET", "/api/agents/me/pending");
      const gigs = await apiRequest("GET", "/agents/me/gigs?status=pending");

      return ok(JSON.stringify({
        ...pending,
        pendingGigs: gigs,
        bufferedMessages: bufferedCount,
        websocketConnected: !!state.socket?.connected,
      }));
    },
  });

  // ─── REGISTER WEBHOOK ─────────────────────────────────
  api.registerTool({
    name: "cliver_register_webhook",
    label: "Cliver Register Webhook",
    description:
      "Register a webhook to receive push notifications when messages arrive. " +
      "This enables instant agent wake-up instead of polling. " +
      "Set url to your webhook bridge endpoint (e.g., http://host:7002/webhook).",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Webhook URL to receive notifications" },
        description: { type: "string", description: "Description for this webhook" },
      },
      required: ["url"],
    },
    async execute(_id: string, params: any) {
      // Register webhook for message_received events
      const data = await apiRequest("POST", "/webhooks", {
        url: params.url,
        events: ["message_received"],
        description: params.description || "OpenClaw agent webhook for message notifications",
      });

      // Store the webhook secret in state for future reference
      if (data.secret) {
        state.webhookSecret = data.secret;
      }

      return ok(JSON.stringify({
        status: "webhook_registered",
        webhookId: data.webhook?.id,
        url: data.webhook?.url,
        events: data.webhook?.events,
        secret: data.secret,
        note: "Save the secret! It won't be shown again. Use it to configure the webhook bridge.",
      }));
    },
  });

  // ─── LIST WEBHOOKS ────────────────────────────────────
  api.registerTool({
    name: "cliver_list_webhooks",
    label: "Cliver List Webhooks",
    description: "List your registered webhooks.",
    parameters: { type: "object", properties: {} },
    async execute() {
      const data = await apiRequest("GET", "/webhooks");
      return ok(JSON.stringify(data));
    },
  });

  // ─── TEST WEBHOOK ─────────────────────────────────────
  api.registerTool({
    name: "cliver_test_webhook",
    label: "Cliver Test Webhook",
    description: "Send a test webhook event to verify your webhook setup.",
    parameters: {
      type: "object",
      properties: {
        webhookId: { type: "string", description: "Webhook ID to test" },
      },
      required: ["webhookId"],
    },
    async execute(_id: string, params: any) {
      const data = await apiRequest("POST", `/webhooks/${params.webhookId}/test`);
      return ok(JSON.stringify(data));
    },
  });

  api.logger.info(`[Cliver] Tools registered - API: ${state.apiUrl}, Chat: ${state.chatUrl}`);
  if (state.apiKey) {
    api.logger.info(`[Cliver] API key configured - channel will auto-connect`);
  } else {
    api.logger.info(`[Cliver] No API key - agent must call cliver_onboard first`);
  }
}
