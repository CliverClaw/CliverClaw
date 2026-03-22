/**
 * Tool Registry
 *
 * Central registry for all X.402 tools and handlers.
 */

import type { X402Client } from '../client.js';
import type { ToolDefinition } from '../types.js';

// Import tool definitions and handlers
import { visualTools, visualHandlers } from './visual.js';
import { audioTools, audioHandlers } from './audio.js';
import { videoTools, videoHandlers } from './video.js';
import { contentTools, contentHandlers } from './content.js';
import { dataTools, dataHandlers } from './data.js';
import { socialTools, socialHandlers } from './social.js';
import { accountTools, accountHandlers } from './account.js';
import { communicationTools, communicationHandlers } from './communication.js';
import { computeTools, computeHandlers } from './compute.js';

// =============================================================================
// Tool Collections
// =============================================================================

/**
 * All available tools organized by category
 */
export const toolsByCategory = {
  visual: visualTools,
  audio: audioTools,
  video: videoTools,
  content: contentTools,
  data: dataTools,
  social: socialTools,
  account: accountTools,
  communication: communicationTools,
  compute: computeTools,
};

/**
 * Flat array of all tools
 */
export const allTools: ToolDefinition[] = [
  ...visualTools,
  ...audioTools,
  ...videoTools,
  ...contentTools,
  ...dataTools,
  ...socialTools,
  ...accountTools,
  ...communicationTools,
  ...computeTools,
];

/**
 * Map of tool names to their definitions
 */
export const toolMap: Map<string, ToolDefinition> = new Map(
  allTools.map(tool => [tool.name, tool])
);

// =============================================================================
// Handler Registry
// =============================================================================

type ToolHandler = (client: X402Client, args: unknown) => Promise<string>;

/**
 * All handlers combined into a single map
 */
export const allHandlers: Record<string, ToolHandler> = {
  ...visualHandlers,
  ...audioHandlers,
  ...videoHandlers,
  ...contentHandlers,
  ...dataHandlers,
  ...socialHandlers,
  ...accountHandlers,
  ...communicationHandlers,
  ...computeHandlers,
};

/**
 * Execute a tool by name
 */
export async function executeTool(
  client: X402Client,
  toolName: string,
  args: unknown
): Promise<string> {
  const handler = allHandlers[toolName];

  if (!handler) {
    throw new Error(`Unknown tool: ${toolName}. Available tools: ${allTools.map(t => t.name).join(', ')}`);
  }

  return handler(client, args);
}

/**
 * Get a tool definition by name
 */
export function getTool(name: string): ToolDefinition | undefined {
  return toolMap.get(name);
}

/**
 * Check if a tool exists
 */
export function hasTool(name: string): boolean {
  return toolMap.has(name);
}

/**
 * Get tool count summary
 */
export function getToolSummary(): {
  total: number;
  byCategory: Record<string, number>;
} {
  return {
    total: allTools.length,
    byCategory: {
      visual: visualTools.length,
      audio: audioTools.length,
      video: videoTools.length,
      content: contentTools.length,
      data: dataTools.length,
      social: socialTools.length,
      account: accountTools.length,
      communication: communicationTools.length,
      compute: computeTools.length,
    },
  };
}

// =============================================================================
// Re-exports
// =============================================================================

export {
  visualTools,
  visualHandlers,
  audioTools,
  audioHandlers,
  videoTools,
  videoHandlers,
  contentTools,
  contentHandlers,
  dataTools,
  dataHandlers,
  socialTools,
  socialHandlers,
  accountTools,
  accountHandlers,
  communicationTools,
  communicationHandlers,
  computeTools,
  computeHandlers,
};
