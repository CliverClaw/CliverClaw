/**
 * X402 Client Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { X402Client } from '../src/client.js';
import {
  X402Error,
  AuthenticationError,
  InsufficientFundsError,
  FreeTierExhaustedError,
  RateLimitError,
  NetworkError,
} from '../src/errors.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('X402Client', () => {
  const testApiKey = 'cliver_sk_test1234567890abcdefghij';
  let client: X402Client;

  beforeEach(() => {
    client = new X402Client(testApiKey);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid API key', () => {
      expect(() => new X402Client(testApiKey)).not.toThrow();
    });

    it('should throw error when API key is missing', () => {
      expect(() => new X402Client('')).toThrow(X402Error);
    });

    it('should accept custom options', () => {
      const customClient = new X402Client(testApiKey, {
        baseUrl: 'https://custom.api.com',
        timeout: 60000,
        maxRetries: 5,
      });
      expect(customClient).toBeInstanceOf(X402Client);
    });
  });

  describe('getBalance', () => {
    it('should return balance on success', async () => {
      const mockBalance = {
        balance: 10.5,
        currency: 'USD',
        freeCallsRemaining: 2,
        freeCallsTotal: 3,
        lifetimeSpending: 5.25,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBalance),
      });

      const result = await client.getBalance();

      expect(result).toEqual(mockBalance);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.cliver.ai/account/balance',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-API-Key': testApiKey,
          }),
        })
      );
    });

    it('should throw AuthenticationError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
        }),
      });

      await expect(client.getBalance()).rejects.toThrow(AuthenticationError);
    });
  });

  describe('generateImage', () => {
    it('should generate image successfully', async () => {
      const mockResult = {
        success: true,
        cost: 0.03,
        data: {
          imageUrl: 'https://example.com/image.png',
          width: 1024,
          height: 1024,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const result = await client.generateImage({
        prompt: 'A sunset',
        style: 'photorealistic',
      });

      expect(result.data.imageUrl).toBe('https://example.com/image.png');
      expect(result.cost).toBe(0.03);
    });

    it('should throw InsufficientFundsError when balance is too low', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve({
          code: 'INSUFFICIENT_FUNDS',
          message: 'Insufficient funds',
          details: { required: 0.03, balance: 0.01 },
        }),
      });

      await expect(
        client.generateImage({ prompt: 'test' })
      ).rejects.toThrow(InsufficientFundsError);
    });

    it('should throw FreeTierExhaustedError when free calls are used up', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: () => Promise.resolve({
          code: 'FREE_TIER_EXHAUSTED',
          message: 'Free tier exhausted',
          details: { usedCalls: 3, totalCalls: 3 },
        }),
      });

      await expect(
        client.generateImage({ prompt: 'test' })
      ).rejects.toThrow(FreeTierExhaustedError);
    });
  });

  describe('researchWeb', () => {
    it('should research web successfully', async () => {
      const mockResult = {
        success: true,
        cost: 0.02,
        data: {
          answer: 'The answer is...',
          sources: [
            { title: 'Source 1', url: 'https://example.com', snippet: 'Snippet...' },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const result = await client.researchWeb({
        query: 'What is X.402?',
        depth: 'detailed',
      });

      expect(result.data.answer).toBeDefined();
      expect(result.data.sources).toHaveLength(1);
    });
  });

  describe('textToSpeech', () => {
    it('should convert text to speech successfully', async () => {
      const mockResult = {
        success: true,
        cost: 0.02,
        data: {
          audioUrl: 'https://example.com/audio.mp3',
          duration: 5.5,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const result = await client.textToSpeech({
        text: 'Hello, world!',
        voice: 'rachel',
      });

      expect(result.data.audioUrl).toBeDefined();
      expect(result.data.duration).toBe(5.5);
    });
  });

  describe('retry behavior', () => {
    it('should retry on network errors', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ balance: 10 }),
        });

      const result = await client.getBalance();

      expect(result.balance).toBe(10);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on X402 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
        }),
      });

      await expect(client.getBalance()).rejects.toThrow(AuthenticationError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw NetworkError after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Create client with fewer retries for faster test
      const fastClient = new X402Client(testApiKey, { maxRetries: 2, retryDelay: 10 });

      await expect(fastClient.getBalance()).rejects.toThrow(NetworkError);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('rate limiting', () => {
    it('should throw RateLimitError on 429', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          details: { retryAfter: 60 },
        }),
      });

      try {
        await client.getBalance();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
      }
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost successfully', async () => {
      const mockEstimate = {
        service: 'image',
        action: 'generate',
        estimatedCost: 0.03,
        currency: 'USD',
        breakdown: [
          { item: 'Base generation', cost: 0.025 },
          { item: 'High resolution', cost: 0.005 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEstimate),
      });

      const result = await client.estimateCost('image', 'generate', { size: '1024x1024' });

      expect(result.estimatedCost).toBe(0.03);
      expect(result.breakdown).toHaveLength(2);
    });
  });

  describe('timeout handling', () => {
    it('should handle AbortError as NetworkError', async () => {
      // Mock fetch to throw AbortError
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      mockFetch.mockRejectedValueOnce(abortError);

      const fastClient = new X402Client(testApiKey, { maxRetries: 0 });

      await expect(fastClient.getBalance()).rejects.toThrow(NetworkError);
    });
  });
});
