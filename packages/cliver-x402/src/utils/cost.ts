/**
 * Cost Estimation Utilities
 *
 * Helper functions for estimating service costs.
 */

/**
 * Approximate costs per unit for each service
 * These are estimates and actual costs may vary
 */
export const COST_ESTIMATES = {
  // Visual services
  image: {
    generate: 0.03,  // per image
    upscale: 0.01,   // per image
    edit: 0.04,      // per image
    optimize: 0.005, // per image
    'remove-background': 0.02, // per image
  },

  // Audio services
  audio: {
    'text-to-speech': 0.00002, // per character
    transcribe: 0.0001,        // per second
    'clone-voice': 1.00,       // per voice
    cleanup: 0.0001,           // per second
    'music-generate': 0.0017,  // per second
  },

  // Video services
  video: {
    generate: 0.05,       // per second
    edit: 0.10,           // per video
    'to-gif': 0.01,       // per conversion
    'add-subtitles': 0.0005, // per second
  },

  // Content services
  content: {
    generate: 0.00001,    // per token
    research: 0.02,       // per query
    summarize: 0.01,      // per request
    translate: 0.00001,   // per character
    'grammar-check': 0.01, // per request
  },

  // Data services
  data: {
    'scrape-url': 0.01,    // per page
    'scrape-search': 0.02, // per search
    extract: 0.01,         // per extraction
    analyze: 0.02,         // per analysis
  },

  // Social services
  social: {
    'analyze-tiktok': 0.03,   // per analysis
    'analyze-twitter': 0.03,  // per analysis
    'analyze-youtube': 0.03,  // per analysis
    trending: 0.02,           // per query
  },

  // Account services (free)
  account: {
    balance: 0,
    usage: 0,
    estimate: 0,
  },
};

export type ServiceName = keyof typeof COST_ESTIMATES;
export type ActionName<S extends ServiceName> = keyof typeof COST_ESTIMATES[S];

/**
 * Get estimated cost for a service action
 */
export function getEstimatedCost<S extends ServiceName>(
  service: S,
  action: ActionName<S>
): number {
  const serviceRates = COST_ESTIMATES[service];
  if (!serviceRates) {
    return 0;
  }

  return (serviceRates as Record<string, number>)[action as string] || 0;
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  if (cost === 0) {
    return 'Free';
  }

  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }

  if (cost < 1) {
    return `$${cost.toFixed(2)}`;
  }

  return `$${cost.toFixed(2)}`;
}

/**
 * Estimate text-to-speech cost
 */
export function estimateTTSCost(text: string): number {
  return text.length * COST_ESTIMATES.audio['text-to-speech'];
}

/**
 * Estimate transcription cost
 */
export function estimateTranscriptionCost(durationSeconds: number): number {
  return durationSeconds * COST_ESTIMATES.audio.transcribe;
}

/**
 * Estimate video generation cost
 */
export function estimateVideoGenerationCost(durationSeconds: number): number {
  return durationSeconds * COST_ESTIMATES.video.generate;
}

/**
 * Estimate translation cost
 */
export function estimateTranslationCost(text: string): number {
  return text.length * COST_ESTIMATES.content.translate;
}
