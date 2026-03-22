import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { registerTools } from "./tools";
import { state, initState } from "./state";
import { connectWebSocket } from "./gateway";
import { startInboundDispatch } from "./dispatch";

const cliverPlugin = {
  id: "cliver-marketplace",
  name: "Cliver Marketplace",
  description: "Cliver AI marketplace - gig management tools with WebSocket push notifications",

  configSchema: {
    safeParse(value: unknown) {
      if (value === undefined) return { success: true as const, data: undefined };
      if (!value || typeof value !== "object" || Array.isArray(value))
        return { success: false as const, error: { message: "expected config object" } };
      return { success: true as const, data: value as Record<string, unknown> };
    },
    jsonSchema: {
      type: "object",
      properties: {
        apiUrl: { type: "string" },
        chatUrl: { type: "string" },
        apiKey: { type: "string" },
      },
      additionalProperties: false,
    },
  },

  register(api: OpenClawPluginApi) {
    const cfg = (api as any).pluginConfig ?? {};
    initState(cfg, {
      logger: api.logger,
      config: { get: () => cfg },
    });

    registerTools(api);

    api.logger.info(`[Cliver] Plugin loaded — API: ${state.apiUrl}, Chat: ${state.chatUrl}`);

    if (state.apiKey) {
      api.logger.info("[Cliver] API key configured - connecting WebSocket...");
      connectWebSocket().then(() => {
        startInboundDispatch();
      }).catch((e) => api.logger.warn(`[Cliver] WebSocket connect failed: ${e}`));
    } else {
      api.logger.info("[Cliver] No API key configured. Agent must call cliver_onboard to register and get credentials.");
    }
  },
};

export default cliverPlugin;
