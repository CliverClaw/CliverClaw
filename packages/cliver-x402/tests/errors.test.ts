/**
 * Error Classes Tests
 */

import { describe, it, expect } from 'vitest';
import {
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
} from '../src/errors.js';

describe('X402Error', () => {
  it('should create error with message and code', () => {
    const error = new X402Error('Test error', 'TEST_CODE');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('X402Error');
  });

  it('should include details', () => {
    const error = new X402Error('Test', 'CODE', { foo: 'bar' });
    expect(error.details).toEqual({ foo: 'bar' });
  });

  it('should format for MCP', () => {
    const error = new X402Error('Test error', 'CODE', { detail: 'value' });
    const mcpError = error.toMCPError();

    expect(mcpError).toContain('Error: Test error');
    expect(mcpError).toContain('Details:');
    expect(mcpError).toContain('"detail": "value"');
  });
});

describe('AuthenticationError', () => {
  it('should include helpful message', () => {
    const error = new AuthenticationError();

    expect(error.message).toContain('Invalid or missing API key');
    expect(error.message).toContain('https://cliver.ai/dashboard/api-keys');
    expect(error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('should accept custom message', () => {
    const error = new AuthenticationError('Custom message');
    expect(error.message).toContain('Custom message');
  });
});

describe('InsufficientFundsError', () => {
  it('should include balance details', () => {
    const error = new InsufficientFundsError(0.05, 0.02);

    expect(error.required).toBe(0.05);
    expect(error.balance).toBe(0.02);
    expect(error.message).toContain('$0.05');
    expect(error.message).toContain('$0.02');
    expect(error.message).toContain('shortfall: $0.03');
    expect(error.code).toBe('INSUFFICIENT_FUNDS');
  });

  it('should include add credits URL', () => {
    const error = new InsufficientFundsError(1.0, 0.5);
    expect(error.addCreditsUrl).toBe('https://cliver.ai/dashboard/wallet');
    expect(error.message).toContain('https://cliver.ai/dashboard/wallet');
  });
});

describe('FreeTierExhaustedError', () => {
  it('should include usage details', () => {
    const error = new FreeTierExhaustedError(3, 3);

    expect(error.usedCalls).toBe(3);
    expect(error.totalCalls).toBe(3);
    expect(error.minimumPurchase).toBe(5.0);
    expect(error.message).toContain('3 free API calls');
    expect(error.code).toBe('FREE_TIER_EXHAUSTED');
  });

  it('should include pricing examples', () => {
    const error = new FreeTierExhaustedError();
    expect(error.message).toContain('~$0.03/image');
    expect(error.message).toContain('~$0.02/1000 chars');
  });
});

describe('RateLimitError', () => {
  it('should include retry after', () => {
    const error = new RateLimitError(120);

    expect(error.retryAfter).toBe(120);
    expect(error.message).toContain('120 seconds');
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should use default retry after', () => {
    const error = new RateLimitError();
    expect(error.retryAfter).toBe(60);
  });
});

describe('ServiceUnavailableError', () => {
  it('should include service name', () => {
    const error = new ServiceUnavailableError('image-generation');

    expect(error.service).toBe('image-generation');
    expect(error.message).toContain('"image-generation" is temporarily unavailable');
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('should include retry time when provided', () => {
    const error = new ServiceUnavailableError('video', 30);
    expect(error.retryAfter).toBe(30);
    expect(error.message).toContain('~30 seconds');
  });
});

describe('ValidationError', () => {
  it('should include field and constraint', () => {
    const error = new ValidationError('Invalid value', 'email', 'must be valid email');

    expect(error.field).toBe('email');
    expect(error.constraint).toBe('must be valid email');
    expect(error.message).toContain('Field: email');
    expect(error.message).toContain('Constraint: must be valid email');
    expect(error.code).toBe('VALIDATION_ERROR');
  });
});

describe('NotFoundError', () => {
  it('should include resource info', () => {
    const error = new NotFoundError('Voice', 'voice_123');

    expect(error.resource).toBe('Voice');
    expect(error.resourceId).toBe('voice_123');
    expect(error.message).toContain('Voice not found: voice_123');
    expect(error.code).toBe('NOT_FOUND');
  });
});

describe('NetworkError', () => {
  it('should include troubleshooting info', () => {
    const error = new NetworkError('Connection refused');

    expect(error.message).toContain('Connection refused');
    expect(error.message).toContain('Check your internet connection');
    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('should store original error', () => {
    const originalError = new Error('Original');
    const error = new NetworkError('Wrapped', originalError);

    expect(error.originalError).toBe(originalError);
  });
});

describe('parseAPIError', () => {
  it('should parse INSUFFICIENT_FUNDS', () => {
    expect(() => {
      parseAPIError(402, {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Not enough',
        details: { required: 1.0, balance: 0.5 },
      });
    }).toThrow(InsufficientFundsError);
  });

  it('should parse FREE_TIER_EXHAUSTED', () => {
    expect(() => {
      parseAPIError(402, {
        code: 'FREE_TIER_EXHAUSTED',
        details: { usedCalls: 3, totalCalls: 3 },
      });
    }).toThrow(FreeTierExhaustedError);
  });

  it('should parse INVALID_API_KEY', () => {
    expect(() => {
      parseAPIError(401, { code: 'INVALID_API_KEY' });
    }).toThrow(AuthenticationError);
  });

  it('should parse RATE_LIMIT_EXCEEDED', () => {
    expect(() => {
      parseAPIError(429, {
        code: 'RATE_LIMIT_EXCEEDED',
        details: { retryAfter: 30 },
      });
    }).toThrow(RateLimitError);
  });

  it('should parse SERVICE_UNAVAILABLE', () => {
    expect(() => {
      parseAPIError(503, {
        code: 'SERVICE_UNAVAILABLE',
        details: { service: 'image' },
      });
    }).toThrow(ServiceUnavailableError);
  });

  it('should parse standard HTTP 401', () => {
    expect(() => {
      parseAPIError(401, { message: 'Unauthorized' });
    }).toThrow(AuthenticationError);
  });

  it('should parse standard HTTP 404', () => {
    expect(() => {
      parseAPIError(404, { message: 'Not found' });
    }).toThrow(NotFoundError);
  });

  it('should parse unknown errors as X402Error', () => {
    expect(() => {
      parseAPIError(500, {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
      });
    }).toThrow(X402Error);
  });
});
