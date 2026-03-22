/**
 * X.402 API Client
 *
 * HTTP client for communicating with the Cliver API.
 * Handles authentication, error handling, retries, and rate limiting.
 */

import {
  X402Error,
  NetworkError,
  parseAPIError,
} from './errors.js';

import type {
  BalanceResponse,
  UsageResponse,
  CostEstimate,
  ServiceResult,
  ServiceStatusResponse,
} from './types.js';

/**
 * Configuration options for the X402 client
 */
export interface X402ClientOptions {
  /** Base URL for the API (default: https://api.cliver.ai) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum number of retries for transient errors (default: 3) */
  maxRetries?: number;
  /** Initial delay between retries in ms (default: 1000) */
  retryDelay?: number;
}

/**
 * Default client configuration
 */
const DEFAULT_OPTIONS: Required<X402ClientOptions> = {
  baseUrl: 'https://api.cliver.ai',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * X.402 API Client
 *
 * Provides methods to interact with all X.402 services.
 */
export class X402Client {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(apiKey: string, options: X402ClientOptions = {}) {
    if (!apiKey) {
      throw new X402Error(
        'API key is required. Get one at https://cliver.ai/dashboard/api-keys',
        'MISSING_API_KEY'
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || DEFAULT_OPTIONS.baseUrl;
    this.timeout = options.timeout || DEFAULT_OPTIONS.timeout;
    this.maxRetries = options.maxRetries || DEFAULT_OPTIONS.maxRetries;
    this.retryDelay = options.retryDelay || DEFAULT_OPTIONS.retryDelay;
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      retries?: number;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, retries = 0 } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'x402-mcp/1.0.0',
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        parseAPIError(response.status, errorBody);
      }

      return await response.json() as T;
    } catch (error) {
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timed out');
      }

      // Don't retry X402 errors (they're intentional)
      if (error instanceof X402Error) {
        throw error;
      }

      // Retry on network errors
      if (retries < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retries);
        await this.sleep(delay);
        return this.request<T>(endpoint, { method, body, retries: retries + 1 });
      }

      throw new NetworkError(
        error instanceof Error ? error.message : 'Unknown network error',
        error instanceof Error ? error : undefined
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===========================================================================
  // Account Methods
  // ===========================================================================

  /**
   * Get current account balance
   */
  async getBalance(): Promise<BalanceResponse> {
    return this.request<BalanceResponse>('/account/balance');
  }

  /**
   * Get usage history
   */
  async getUsage(since?: Date, limit?: number): Promise<UsageResponse> {
    const params = new URLSearchParams();
    if (since) params.set('since', since.toISOString());
    if (limit) params.set('limit', limit.toString());

    const query = params.toString();
    return this.request<UsageResponse>(`/account/usage${query ? `?${query}` : ''}`);
  }

  /**
   * Estimate cost for a service call
   */
  async estimateCost(service: string, action: string, params: unknown): Promise<CostEstimate> {
    return this.request<CostEstimate>('/services/estimate', {
      method: 'POST',
      body: { service, action, params },
    });
  }

  /**
   * Get service status
   */
  async getServiceStatus(service?: string): Promise<ServiceStatusResponse> {
    const endpoint = service ? `/status/${service}` : '/status';
    return this.request<ServiceStatusResponse>(endpoint);
  }

  // ===========================================================================
  // Service Execution
  // ===========================================================================

  /**
   * Execute a service action
   */
  async execute<T extends Record<string, unknown>>(
    service: string,
    action: string,
    params: unknown
  ): Promise<ServiceResult & { data: T }> {
    return this.request<ServiceResult & { data: T }>(`/services/${service}/${action}`, {
      method: 'POST',
      body: params,
    });
  }

  // ===========================================================================
  // Visual Services
  // ===========================================================================

  /**
   * Generate an image using AI
   */
  async generateImage(params: {
    prompt: string;
    style?: string;
    size?: string;
    negativePrompt?: string;
  }): Promise<ServiceResult> {
    return this.execute('image', 'generate', params);
  }

  /**
   * Upscale an image
   */
  async upscaleImage(params: {
    imageUrl: string;
    scale?: number;
  }): Promise<ServiceResult> {
    return this.execute('image', 'upscale', params);
  }

  /**
   * Edit an image with AI
   */
  async editImage(params: {
    imageUrl: string;
    prompt: string;
    maskUrl?: string;
  }): Promise<ServiceResult> {
    return this.execute('image', 'edit', params);
  }

  /**
   * Optimize an image for web
   */
  async optimizeImage(params: {
    imageUrl: string;
    format?: string;
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  }): Promise<ServiceResult> {
    return this.execute('image', 'optimize', params);
  }

  /**
   * Remove background from an image
   */
  async removeBackground(params: {
    imageUrl: string;
  }): Promise<ServiceResult> {
    return this.execute('image', 'remove-background', params);
  }

  // ===========================================================================
  // Audio Services
  // ===========================================================================

  /**
   * Convert text to speech
   */
  async textToSpeech(params: {
    text: string;
    voice?: string;
    format?: string;
    speed?: number;
  }): Promise<ServiceResult> {
    return this.execute('audio', 'text-to-speech', params);
  }

  /**
   * Transcribe audio to text
   */
  async transcribe(params: {
    audioUrl: string;
    language?: string;
    timestamps?: boolean;
  }): Promise<ServiceResult> {
    return this.execute('audio', 'transcribe', params);
  }

  /**
   * Clone a voice from audio samples
   */
  async cloneVoice(params: {
    audioSamples: string[];
    name: string;
    description?: string;
  }): Promise<ServiceResult> {
    return this.execute('audio', 'clone-voice', params);
  }

  /**
   * Clean up audio (remove noise, normalize)
   */
  async audioCleanup(params: {
    audioUrl: string;
    removeNoise?: boolean;
    removeBackground?: boolean;
    normalize?: boolean;
  }): Promise<ServiceResult> {
    return this.execute('audio', 'cleanup', params);
  }

  /**
   * Generate music from a prompt
   */
  async musicGenerate(params: {
    prompt: string;
    duration?: number;
    genre?: string;
  }): Promise<ServiceResult> {
    return this.execute('audio', 'music-generate', params);
  }

  // ===========================================================================
  // Video Services
  // ===========================================================================

  /**
   * Generate a video from a prompt
   */
  async generateVideo(params: {
    prompt: string;
    duration?: number;
    style?: string;
    aspectRatio?: string;
  }): Promise<ServiceResult> {
    return this.execute('video', 'generate', params);
  }

  /**
   * Edit a video with AI
   */
  async editVideo(params: {
    videoUrl: string;
    instructions: string;
  }): Promise<ServiceResult> {
    return this.execute('video', 'edit', params);
  }

  /**
   * Convert video to GIF
   */
  async videoToGif(params: {
    videoUrl: string;
    startTime?: number;
    endTime?: number;
    fps?: number;
    width?: number;
  }): Promise<ServiceResult> {
    return this.execute('video', 'to-gif', params);
  }

  /**
   * Add subtitles to a video
   */
  async addSubtitles(params: {
    videoUrl: string;
    subtitles?: string;
    language?: string;
    style?: string;
  }): Promise<ServiceResult> {
    return this.execute('video', 'add-subtitles', params);
  }

  // ===========================================================================
  // Content Services
  // ===========================================================================

  /**
   * Generate text with AI
   */
  async generateText(params: {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }): Promise<ServiceResult> {
    return this.execute('content', 'generate', params);
  }

  /**
   * Research a topic using web search
   */
  async researchWeb(params: {
    query: string;
    depth?: string;
    maxSources?: number;
  }): Promise<ServiceResult> {
    return this.execute('content', 'research', params);
  }

  /**
   * Summarize text or a URL
   */
  async summarize(params: {
    text?: string;
    url?: string;
    length?: string;
  }): Promise<ServiceResult> {
    return this.execute('content', 'summarize', params);
  }

  /**
   * Translate text
   */
  async translate(params: {
    text: string;
    targetLanguage: string;
    sourceLanguage?: string;
  }): Promise<ServiceResult> {
    return this.execute('content', 'translate', params);
  }

  /**
   * Check grammar and style
   */
  async grammarCheck(params: {
    text: string;
    style?: string;
  }): Promise<ServiceResult> {
    return this.execute('content', 'grammar-check', params);
  }

  // ===========================================================================
  // Data Services
  // ===========================================================================

  /**
   * Scrape content from a URL
   */
  async scrapeUrl(params: {
    url: string;
    format?: string;
    waitForSelector?: string;
  }): Promise<ServiceResult> {
    return this.execute('data', 'scrape-url', params);
  }

  /**
   * Scrape search results
   */
  async scrapeSearch(params: {
    query: string;
    maxResults?: number;
    site?: string;
  }): Promise<ServiceResult> {
    return this.execute('data', 'scrape-search', params);
  }

  /**
   * Extract structured data from content
   */
  async extractData(params: {
    content: string;
    schema: Record<string, string>;
    instructions?: string;
  }): Promise<ServiceResult> {
    return this.execute('data', 'extract', params);
  }

  /**
   * Analyze data with AI
   */
  async analyzeData(params: {
    data: Record<string, unknown>[] | string;
    question: string;
  }): Promise<ServiceResult> {
    return this.execute('data', 'analyze', params);
  }

  // ===========================================================================
  // Social Services
  // ===========================================================================

  /**
   * Analyze TikTok content
   */
  async analyzeTiktok(params: {
    url?: string;
    username?: string;
    hashtag?: string;
  }): Promise<ServiceResult> {
    return this.execute('social', 'analyze-tiktok', params);
  }

  /**
   * Analyze Twitter/X content
   */
  async analyzeTwitter(params: {
    url?: string;
    username?: string;
    query?: string;
  }): Promise<ServiceResult> {
    return this.execute('social', 'analyze-twitter', params);
  }

  /**
   * Analyze YouTube content
   */
  async analyzeYoutube(params: {
    url?: string;
    channelId?: string;
    query?: string;
  }): Promise<ServiceResult> {
    return this.execute('social', 'analyze-youtube', params);
  }

  /**
   * Get trending topics
   */
  async trendingTopics(params: {
    category?: string;
    region?: string;
    platform?: string;
  }): Promise<ServiceResult> {
    return this.execute('social', 'trending', params);
  }
}

/**
 * Create a new X402 client instance
 */
export function createClient(apiKey: string, options?: X402ClientOptions): X402Client {
  return new X402Client(apiKey, options);
}
