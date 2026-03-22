/**
 * X.402 MCP Server Types
 *
 * Type definitions for the X.402 MCP server and API client.
 */

// =============================================================================
// API Response Types
// =============================================================================

export interface BalanceResponse {
  balance: number;
  currency: 'USD';
  freeCallsRemaining: number;
  freeCallsTotal: number;
  lifetimeSpending: number;
}

export interface UsageRecord {
  id: string;
  service: string;
  action: string;
  cost: number;
  timestamp: string;
  params: Record<string, unknown>;
}

export interface UsageResponse {
  records: UsageRecord[];
  totalCost: number;
  period: {
    start: string;
    end: string;
  };
}

export interface CostEstimate {
  service: string;
  action: string;
  estimatedCost: number;
  currency: 'USD';
  breakdown: {
    item: string;
    cost: number;
  }[];
}

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  lastChecked: string;
  message?: string;
}

export interface ServiceStatusResponse {
  overall: 'operational' | 'degraded' | 'down';
  services: ServiceStatus[];
  timestamp: string;
}

export interface ServiceResult {
  success: boolean;
  cost: number;
  data: Record<string, unknown>;
}

// =============================================================================
// Visual Tool Types
// =============================================================================

export type ImageStyle = 'photorealistic' | 'artistic' | 'cartoon' | 'anime' | 'sketch' | 'digital-art';
export type ImageSize = '512x512' | '1024x1024' | '1920x1080' | '1080x1920' | '1024x768' | '768x1024';

export interface GenerateImageParams {
  prompt: string;
  style?: ImageStyle;
  size?: ImageSize;
  negativePrompt?: string;
}

export interface GenerateImageResult {
  imageUrl: string;
  cost: number;
  width: number;
  height: number;
}

export interface UpscaleImageParams {
  imageUrl: string;
  scale?: 2 | 4;
}

export interface UpscaleImageResult {
  imageUrl: string;
  cost: number;
  width: number;
  height: number;
}

export interface EditImageParams {
  imageUrl: string;
  prompt: string;
  maskUrl?: string;
}

export interface EditImageResult {
  imageUrl: string;
  cost: number;
}

export interface OptimizeImageParams {
  imageUrl: string;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface OptimizeImageResult {
  imageUrl: string;
  cost: number;
  originalSize: number;
  optimizedSize: number;
  savings: number;
}

export interface RemoveBackgroundParams {
  imageUrl: string;
}

export interface RemoveBackgroundResult {
  imageUrl: string;
  cost: number;
}

// =============================================================================
// Audio Tool Types
// =============================================================================

export type VoiceId = string;
export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac';

export interface TextToSpeechParams {
  text: string;
  voice?: VoiceId;
  format?: AudioFormat;
  speed?: number;
}

export interface TextToSpeechResult {
  audioUrl: string;
  cost: number;
  duration: number;
}

export interface TranscribeParams {
  audioUrl: string;
  language?: string;
  timestamps?: boolean;
}

export interface TranscribeResult {
  text: string;
  cost: number;
  duration: number;
  segments?: {
    start: number;
    end: number;
    text: string;
  }[];
}

export interface CloneVoiceParams {
  audioSamples: string[];
  name: string;
  description?: string;
}

export interface CloneVoiceResult {
  voiceId: string;
  cost: number;
}

export interface AudioCleanupParams {
  audioUrl: string;
  removeNoise?: boolean;
  removeBackground?: boolean;
  normalize?: boolean;
}

export interface AudioCleanupResult {
  audioUrl: string;
  cost: number;
}

export interface MusicGenerateParams {
  prompt: string;
  duration?: number;
  genre?: string;
}

export interface MusicGenerateResult {
  audioUrl: string;
  cost: number;
  duration: number;
}

// =============================================================================
// Video Tool Types
// =============================================================================

export interface GenerateVideoParams {
  prompt: string;
  duration?: number;
  style?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface GenerateVideoResult {
  videoUrl: string;
  cost: number;
  duration: number;
}

export interface EditVideoParams {
  videoUrl: string;
  instructions: string;
}

export interface EditVideoResult {
  videoUrl: string;
  cost: number;
}

export interface VideoToGifParams {
  videoUrl: string;
  startTime?: number;
  endTime?: number;
  fps?: number;
  width?: number;
}

export interface VideoToGifResult {
  gifUrl: string;
  cost: number;
}

export interface AddSubtitlesParams {
  videoUrl: string;
  subtitles?: string;
  language?: string;
  style?: 'bottom' | 'caption';
}

export interface AddSubtitlesResult {
  videoUrl: string;
  cost: number;
}

// =============================================================================
// Content Tool Types
// =============================================================================

export interface GenerateTextParams {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface GenerateTextResult {
  text: string;
  cost: number;
  tokensUsed: number;
}

export interface ResearchWebParams {
  query: string;
  depth?: 'quick' | 'detailed';
  maxSources?: number;
}

export interface ResearchWebResult {
  answer: string;
  sources: {
    title: string;
    url: string;
    snippet: string;
  }[];
  cost: number;
}

export interface SummarizeParams {
  text?: string;
  url?: string;
  length?: 'brief' | 'detailed';
}

export interface SummarizeResult {
  summary: string;
  cost: number;
  originalLength: number;
}

export interface TranslateParams {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslateResult {
  text: string;
  cost: number;
  detectedLanguage?: string;
}

export interface GrammarCheckParams {
  text: string;
  style?: 'formal' | 'casual' | 'academic';
}

export interface GrammarCheckResult {
  correctedText: string;
  cost: number;
  corrections: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
}

// =============================================================================
// Data Tool Types
// =============================================================================

export interface ScrapeUrlParams {
  url: string;
  format?: 'text' | 'markdown' | 'html';
  waitForSelector?: string;
}

export interface ScrapeUrlResult {
  content: string;
  cost: number;
  title?: string;
  metadata?: Record<string, string>;
}

export interface ScrapeSearchParams {
  query: string;
  maxResults?: number;
  site?: string;
}

export interface ScrapeSearchResult {
  results: {
    title: string;
    url: string;
    snippet: string;
  }[];
  cost: number;
}

export interface ExtractDataParams {
  content: string;
  schema: Record<string, string>;
  instructions?: string;
}

export interface ExtractDataResult {
  data: Record<string, unknown>;
  cost: number;
}

export interface AnalyzeDataParams {
  data: Record<string, unknown>[] | string;
  question: string;
}

export interface AnalyzeDataResult {
  analysis: string;
  cost: number;
  insights: string[];
}

// =============================================================================
// Social Tool Types
// =============================================================================

export interface AnalyzeTiktokParams {
  url?: string;
  username?: string;
  hashtag?: string;
}

export interface AnalyzeTiktokResult {
  data: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    followers?: number;
    posts?: {
      url: string;
      views: number;
      likes: number;
    }[];
  };
  cost: number;
}

export interface AnalyzeTwitterParams {
  url?: string;
  username?: string;
  query?: string;
}

export interface AnalyzeTwitterResult {
  data: {
    followers?: number;
    following?: number;
    tweets?: {
      text: string;
      likes: number;
      retweets: number;
    }[];
  };
  cost: number;
}

export interface AnalyzeYoutubeParams {
  url?: string;
  channelId?: string;
  query?: string;
}

export interface AnalyzeYoutubeResult {
  data: {
    subscribers?: number;
    views?: number;
    videos?: {
      title: string;
      url: string;
      views: number;
    }[];
  };
  cost: number;
}

export interface TrendingTopicsParams {
  category?: string;
  region?: string;
  platform?: 'twitter' | 'tiktok' | 'youtube' | 'all';
}

export interface TrendingTopicsResult {
  topics: {
    name: string;
    volume: number;
    platform: string;
  }[];
  cost: number;
}

// =============================================================================
// Account Tool Types
// =============================================================================

export interface GetBalanceResult {
  balance: number;
  currency: 'USD';
  freeCallsRemaining: number;
  freeCallsTotal: number;
  lifetimeSpending: number;
  addCreditsUrl: string;
}

export interface GetUsageParams {
  since?: string;
  limit?: number;
}

export interface GetUsageResult {
  records: {
    service: string;
    action: string;
    cost: number;
    timestamp: string;
  }[];
  totalCost: number;
}

export interface EstimateCostParams {
  service: string;
  action: string;
  params: Record<string, unknown>;
}

export interface EstimateCostResult {
  estimatedCost: number;
  currency: 'USD';
  breakdown: {
    item: string;
    cost: number;
  }[];
}

// =============================================================================
// Error Types
// =============================================================================

export interface X402ErrorResponse {
  error: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface InsufficientFundsDetails {
  required: number;
  balance: number;
  addCreditsUrl: string;
}

export interface FreeTierExhaustedDetails {
  usedCalls: number;
  totalCalls: number;
  addCreditsUrl: string;
  minimumPurchase: number;
}

// =============================================================================
// MCP Tool Definition Types
// =============================================================================

export interface ToolInputProperty {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string };
  default?: unknown;
}

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, ToolInputProperty>;
  required: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
}
