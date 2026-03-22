/**
 * Tool Pricing Configuration
 *
 * Defines pricing for all x402 tools when used in HTTP/x402 mode.
 * Pricing model: Provider cost + 50 basis points (0.5%)
 */

/**
 * Base costs from providers in USD
 * These are approximate provider costs per operation
 */
export const providerCosts: Record<string, number> = {
  // Visual Tools
  x402_generate_image: 0.03,      // Fal Flux - per image
  x402_upscale_image: 0.01,       // per image
  x402_edit_image: 0.04,          // per edit
  x402_optimize_image: 0.005,     // per image
  x402_remove_background: 0.02,   // per image

  // Audio Tools
  x402_text_to_speech: 0.02,      // ElevenLabs - per 1k chars
  x402_transcribe: 0.001,         // Whisper - per minute
  x402_clone_voice: 1.00,         // ElevenLabs - per voice
  x402_audio_cleanup: 0.01,       // per minute
  x402_music_generate: 0.05,      // per 30 seconds

  // Video Tools
  x402_generate_video: 0.05,      // per second
  x402_edit_video: 0.10,          // per video
  x402_video_to_gif: 0.01,        // per conversion
  x402_add_subtitles: 0.03,       // per minute

  // Content Tools
  x402_generate_text: 0.01,       // Claude - per 1k tokens
  x402_research_web: 0.02,        // Perplexity - per query
  x402_summarize: 0.01,           // per summary
  x402_translate: 0.01,           // per 1k chars
  x402_grammar_check: 0.01,       // per check

  // Data Tools
  x402_scrape_url: 0.01,          // per page
  x402_scrape_search: 0.02,       // per search
  x402_extract_data: 0.01,        // per extraction
  x402_analyze_data: 0.02,        // per analysis

  // Social Tools
  x402_analyze_tiktok: 0.03,      // per analysis
  x402_analyze_twitter: 0.03,     // per analysis
  x402_analyze_youtube: 0.03,     // per analysis
  x402_trending_topics: 0.02,     // per query

  // Communication Tools
  x402_send_sms: 0.008,           // Twilio - per message
  x402_make_call: 0.014,          // Twilio - per minute
  x402_verify_phone: 0.05,        // Twilio - per verification
  x402_verify_check: 0.00,        // Free (part of verify flow)

  // Compute Tools
  x402_execute_code: 0.0001,      // E2B - per second
  x402_run_serverless: 0.0002,    // RunPod T4 - per second (varies by GPU)

  // Account Tools (free)
  x402_get_balance: 0.00,
  x402_get_usage: 0.00,
  x402_estimate_cost: 0.00,
  x402_service_status: 0.00,
};

/**
 * Markup in basis points (1 bp = 0.01%)
 * 50 bp = 0.5% markup
 */
export const MARKUP_BPS = 50;

/**
 * x402 payment configuration
 */
export interface X402Pricing {
  amount: string;  // Amount as string for precision
  asset: 'USDC';
  network: 'base';
}

/**
 * Calculate price with markup
 */
export function calculatePrice(baseCost: number): string {
  const markup = 1 + MARKUP_BPS / 10000;
  const finalCost = baseCost * markup;
  // Round to 6 decimal places for USDC precision
  return finalCost.toFixed(6);
}

/**
 * Get x402 pricing for a tool
 */
export function getToolPricing(toolName: string): X402Pricing | null {
  const baseCost = providerCosts[toolName];

  if (baseCost === undefined) {
    return null;
  }

  // Free tools (account tools)
  if (baseCost === 0) {
    return {
      amount: '0',
      asset: 'USDC',
      network: 'base',
    };
  }

  return {
    amount: calculatePrice(baseCost),
    asset: 'USDC',
    network: 'base',
  };
}

/**
 * Full pricing map for all tools with x402 format
 */
export const toolPricing: Record<string, X402Pricing> = Object.fromEntries(
  Object.entries(providerCosts).map(([tool, cost]) => [
    tool,
    {
      amount: cost === 0 ? '0' : calculatePrice(cost),
      asset: 'USDC' as const,
      network: 'base' as const,
    },
  ])
);

/**
 * Get price description for a tool (human-readable)
 */
export function getPriceDescription(toolName: string): string {
  const pricing = getToolPricing(toolName);
  if (!pricing) {
    return 'Unknown';
  }
  if (pricing.amount === '0') {
    return 'Free';
  }
  return `$${pricing.amount} USDC`;
}

/**
 * Check if a tool is free
 */
export function isFreeTool(toolName: string): boolean {
  const baseCost = providerCosts[toolName];
  return baseCost === 0;
}

/**
 * Get all tool names
 */
export function getAllToolNames(): string[] {
  return Object.keys(providerCosts);
}

/**
 * Get all paid tool names
 */
export function getPaidToolNames(): string[] {
  return Object.entries(providerCosts)
    .filter(([_, cost]) => cost > 0)
    .map(([name]) => name);
}

/**
 * Get all free tool names
 */
export function getFreeToolNames(): string[] {
  return Object.entries(providerCosts)
    .filter(([_, cost]) => cost === 0)
    .map(([name]) => name);
}
