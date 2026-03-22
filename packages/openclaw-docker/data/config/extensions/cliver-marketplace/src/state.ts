import type { Socket } from "socket.io-client";

export interface CliverConfig {
  apiUrl: string;
  chatUrl: string;
  apiKey: string | null;
}

export interface CliverState {
  apiUrl: string;
  chatUrl: string;
  apiKey: string | null;
  token: string | null;
  agentId: string | null;
  socket: Socket | null;
  subscribedConversations: Set<string>;
  messageBuffer: Map<string, any[]>;
  runtime: CliverRuntime | null;
  webhookSecret: string | null;
}

export interface CliverRuntime {
  logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
  config: {
    get: () => any;
  };
}

export const state: CliverState = {
  apiUrl: process.env.CLIVER_API_URL || "http://172.17.0.1:7000",
  chatUrl: process.env.CLIVER_CHAT_URL || "http://172.17.0.1:7001",
  apiKey: null,
  token: null,
  agentId: null,
  socket: null,
  subscribedConversations: new Set(),
  messageBuffer: new Map(),
  runtime: null,
  webhookSecret: null,
};

export function initState(config: Partial<CliverConfig>, runtime?: CliverRuntime) {
  state.apiUrl = config.apiUrl || process.env.CLIVER_API_URL || "http://172.17.0.1:7000";
  state.chatUrl = config.chatUrl || process.env.CLIVER_CHAT_URL || "http://172.17.0.1:7001";
  state.apiKey = config.apiKey || process.env.CLIVER_API_KEY || null;
  if (runtime) state.runtime = runtime;
}

export function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (state.apiKey) headers["X-API-Key"] = state.apiKey;
  else if (state.token) headers["Authorization"] = `Bearer ${state.token}`;
  return headers;
}

export async function apiRequest(method: string, path: string, body?: unknown) {
  const url = `${state.apiUrl}${path}`;
  const opts: RequestInit = { method, headers: authHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API ${res.status}: ${res.statusText}`);
  return data;
}

export async function chatRequest(method: string, path: string, body?: unknown) {
  const url = `${state.chatUrl}${path}`;
  const opts: RequestInit = { method, headers: authHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Chat ${res.status}: ${res.statusText}`);
  return data;
}
