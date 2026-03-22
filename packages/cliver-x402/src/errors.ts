/**
 * X.402 MCP Server Error Classes
 *
 * Custom error classes with helpful messages and recovery suggestions.
 */

/**
 * Base error class for all X.402 errors
 */
export class X402Error extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string = 'X402_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'X402Error';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, X402Error.prototype);
  }

  /**
   * Format error for MCP response
   */
  toMCPError(): string {
    let errorMessage = `Error: ${this.message}`;

    if (this.details) {
      errorMessage += `\n\nDetails: ${JSON.stringify(this.details, null, 2)}`;
    }

    return errorMessage;
  }
}

/**
 * Thrown when API key is missing or invalid
 */
export class AuthenticationError extends X402Error {
  constructor(message: string = 'Invalid or missing API key') {
    super(
      `${message}\n\nTo fix this:\n1. Get your API key at https://cliver.ai/dashboard/api-keys\n2. Run: x402-mcp YOUR_API_KEY\n   or set: CLIVER_API_KEY=YOUR_API_KEY`,
      'AUTHENTICATION_ERROR'
    );
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Thrown when account balance is insufficient for the requested operation
 */
export class InsufficientFundsError extends X402Error {
  public readonly required: number;
  public readonly balance: number;
  public readonly addCreditsUrl: string;

  constructor(required: number, balance: number) {
    const shortfall = required - balance;
    super(
      `Insufficient funds. This operation costs $${required.toFixed(4)} but your balance is $${balance.toFixed(4)} (shortfall: $${shortfall.toFixed(4)}).\n\nTo continue:\n1. Add credits at https://cliver.ai/dashboard/wallet\n2. Minimum purchase: $5.00\n3. Credits never expire`,
      'INSUFFICIENT_FUNDS',
      { required, balance, shortfall }
    );
    this.name = 'InsufficientFundsError';
    this.required = required;
    this.balance = balance;
    this.addCreditsUrl = 'https://cliver.ai/dashboard/wallet';
    Object.setPrototypeOf(this, InsufficientFundsError.prototype);
  }
}

/**
 * Thrown when free tier API calls have been exhausted
 */
export class FreeTierExhaustedError extends X402Error {
  public readonly usedCalls: number;
  public readonly totalCalls: number;
  public readonly addCreditsUrl: string;
  public readonly minimumPurchase: number;

  constructor(usedCalls: number = 3, totalCalls: number = 3) {
    super(
      `Free tier exhausted! You've used all ${totalCalls} free API calls.\n\nYou tried X.402 services and (hopefully) loved them! Now add credits to continue:\n\n1. Visit https://cliver.ai/dashboard/wallet\n2. Add credits (minimum $5.00)\n3. All services at COST - no markup!\n4. Credits never expire\n\nExample costs:\n- Image generation: ~$0.03/image\n- Text-to-speech: ~$0.02/1000 chars\n- Web research: ~$0.02/query`,
      'FREE_TIER_EXHAUSTED',
      { usedCalls, totalCalls }
    );
    this.name = 'FreeTierExhaustedError';
    this.usedCalls = usedCalls;
    this.totalCalls = totalCalls;
    this.addCreditsUrl = 'https://cliver.ai/dashboard/wallet';
    this.minimumPurchase = 5.0;
    Object.setPrototypeOf(this, FreeTierExhaustedError.prototype);
  }
}

/**
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends X402Error {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(
      `Rate limit exceeded. Please wait ${retryAfter} seconds before retrying.\n\nTip: If you're hitting rate limits frequently, consider batching your requests or adding a small delay between calls.`,
      'RATE_LIMIT_EXCEEDED',
      { retryAfter }
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Thrown when a service is temporarily unavailable
 */
export class ServiceUnavailableError extends X402Error {
  public readonly service: string;
  public readonly retryAfter?: number;

  constructor(service: string, retryAfter?: number) {
    const retryMessage = retryAfter
      ? `\n\nThe service should be back in ~${retryAfter} seconds.`
      : '\n\nPlease try again in a few moments.';

    super(
      `Service "${service}" is temporarily unavailable.${retryMessage}\n\nAlternatively, check service status at https://status.cliver.ai`,
      'SERVICE_UNAVAILABLE',
      { service, retryAfter }
    );
    this.name = 'ServiceUnavailableError';
    this.service = service;
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Thrown when input validation fails
 */
export class ValidationError extends X402Error {
  public readonly field?: string;
  public readonly constraint?: string;

  constructor(message: string, field?: string, constraint?: string) {
    super(
      `Validation error: ${message}${field ? `\n\nField: ${field}` : ''}${constraint ? `\nConstraint: ${constraint}` : ''}`,
      'VALIDATION_ERROR',
      { field, constraint }
    );
    this.name = 'ValidationError';
    this.field = field;
    this.constraint = constraint;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Thrown when a requested resource is not found
 */
export class NotFoundError extends X402Error {
  public readonly resource: string;
  public readonly resourceId?: string;

  constructor(resource: string, resourceId?: string) {
    super(
      `${resource} not found${resourceId ? `: ${resourceId}` : ''}`,
      'NOT_FOUND',
      { resource, resourceId }
    );
    this.name = 'NotFoundError';
    this.resource = resource;
    this.resourceId = resourceId;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Thrown when a network request fails
 */
export class NetworkError extends X402Error {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(
      `Network error: ${message}\n\nTroubleshooting:\n1. Check your internet connection\n2. Verify the API is reachable: curl https://api.cliver.ai/health\n3. If behind a proxy, ensure it allows HTTPS connections`,
      'NETWORK_ERROR',
      { originalMessage: originalError?.message }
    );
    this.name = 'NetworkError';
    this.originalError = originalError;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Parse API error response and throw appropriate error
 */
export function parseAPIError(statusCode: number, body: unknown): never {
  const errorBody = body as { error?: string; code?: string; message?: string; details?: Record<string, unknown> };
  const errorCode = errorBody?.code || 'UNKNOWN_ERROR';
  const errorMessage = errorBody?.message || errorBody?.error || 'Unknown error occurred';
  const details = errorBody?.details;

  switch (errorCode) {
    case 'INSUFFICIENT_FUNDS':
      throw new InsufficientFundsError(
        (details?.required as number) || 0,
        (details?.balance as number) || 0
      );

    case 'FREE_TIER_EXHAUSTED':
      throw new FreeTierExhaustedError(
        (details?.usedCalls as number) || 3,
        (details?.totalCalls as number) || 3
      );

    case 'INVALID_API_KEY':
    case 'MISSING_API_KEY':
    case 'EXPIRED_API_KEY':
      throw new AuthenticationError(errorMessage);

    case 'RATE_LIMIT_EXCEEDED':
      throw new RateLimitError((details?.retryAfter as number) || 60);

    case 'SERVICE_UNAVAILABLE':
      throw new ServiceUnavailableError(
        (details?.service as string) || 'unknown',
        details?.retryAfter as number
      );

    case 'VALIDATION_ERROR':
      throw new ValidationError(
        errorMessage,
        details?.field as string,
        details?.constraint as string
      );

    case 'NOT_FOUND':
      throw new NotFoundError(
        (details?.resource as string) || 'Resource',
        details?.resourceId as string
      );

    default:
      // Handle standard HTTP errors
      if (statusCode === 401) {
        throw new AuthenticationError(errorMessage);
      } else if (statusCode === 402) {
        throw new InsufficientFundsError(0, 0);
      } else if (statusCode === 404) {
        throw new NotFoundError('Resource');
      } else if (statusCode === 429) {
        throw new RateLimitError();
      } else if (statusCode === 503) {
        throw new ServiceUnavailableError('API');
      }

      throw new X402Error(errorMessage, errorCode, details);
  }
}
