/**
 * @cliver-x402
 *
 * Open-source MCP server for AI agents to access 30+ services at cost.
 *
 * @example
 * ```typescript
 * import { createServer, startServer } from '@cliver-x402';
 *
 * // Quick start - run as stdio server
 * startServer('your-api-key');
 *
 * // Or create server for custom integration
 * const server = createServer('your-api-key', {
 *   baseUrl: 'https://api.cliver.ai',
 * });
 * ```
 */

// Server exports
export { createServer, startServer } from './server.js';
export type { X402ServerOptions } from './server.js';

// HTTP Server exports (x402 protocol)
export {
  createHttpApp,
  startHttpServer,
  getX402RoutesConfig,
} from './http-server.js';
export type { HttpServerConfig } from './http-server.js';

// Pricing exports
export {
  providerCosts,
  toolPricing,
  getToolPricing,
  getPriceDescription,
  isFreeTool,
  calculatePrice,
  getAllToolNames,
  getPaidToolNames,
  getFreeToolNames,
  MARKUP_BPS,
} from './payment/pricing.js';
export type { X402Pricing } from './payment/pricing.js';

// Client exports
export { X402Client, createClient } from './client.js';
export type { X402ClientOptions } from './client.js';

// Error exports
export {
  X402Error,
  AuthenticationError,
  InsufficientFundsError,
  FreeTierExhaustedError,
  RateLimitError,
  ServiceUnavailableError,
  ValidationError,
  NotFoundError,
  NetworkError,
  parseAPIError,
} from './errors.js';

// Tool exports
export {
  allTools,
  toolsByCategory,
  toolMap,
  allHandlers,
  executeTool,
  getTool,
  hasTool,
  getToolSummary,
  // Individual tool categories
  visualTools,
  audioTools,
  videoTools,
  contentTools,
  dataTools,
  socialTools,
  accountTools,
} from './tools/index.js';

// Type exports
export type {
  // API types
  BalanceResponse,
  UsageRecord,
  UsageResponse,
  CostEstimate,
  ServiceResult,
  // Visual types
  ImageStyle,
  ImageSize,
  GenerateImageParams,
  GenerateImageResult,
  UpscaleImageParams,
  UpscaleImageResult,
  EditImageParams,
  EditImageResult,
  OptimizeImageParams,
  OptimizeImageResult,
  RemoveBackgroundParams,
  RemoveBackgroundResult,
  // Audio types
  VoiceId,
  AudioFormat,
  TextToSpeechParams,
  TextToSpeechResult,
  TranscribeParams,
  TranscribeResult,
  CloneVoiceParams,
  CloneVoiceResult,
  AudioCleanupParams,
  AudioCleanupResult,
  MusicGenerateParams,
  MusicGenerateResult,
  // Video types
  GenerateVideoParams,
  GenerateVideoResult,
  EditVideoParams,
  EditVideoResult,
  VideoToGifParams,
  VideoToGifResult,
  AddSubtitlesParams,
  AddSubtitlesResult,
  // Content types
  GenerateTextParams,
  GenerateTextResult,
  ResearchWebParams,
  ResearchWebResult,
  SummarizeParams,
  SummarizeResult,
  TranslateParams,
  TranslateResult,
  GrammarCheckParams,
  GrammarCheckResult,
  // Data types
  ScrapeUrlParams,
  ScrapeUrlResult,
  ScrapeSearchParams,
  ScrapeSearchResult,
  ExtractDataParams,
  ExtractDataResult,
  AnalyzeDataParams,
  AnalyzeDataResult,
  // Social types
  AnalyzeTiktokParams,
  AnalyzeTiktokResult,
  AnalyzeTwitterParams,
  AnalyzeTwitterResult,
  AnalyzeYoutubeParams,
  AnalyzeYoutubeResult,
  TrendingTopicsParams,
  TrendingTopicsResult,
  // Account types
  GetBalanceResult,
  GetUsageParams,
  GetUsageResult,
  EstimateCostParams,
  EstimateCostResult,
  // Tool types
  ToolDefinition,
  ToolInputSchema,
  ToolInputProperty,
  // Error types
  X402ErrorResponse,
  InsufficientFundsDetails,
  FreeTierExhaustedDetails,
} from './types.js';
