/**
 * Retry Utilities
 *
 * Helper functions for implementing retry logic.
 */

import { X402Error } from '../errors.js';

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay between retries in ms */
  initialDelay?: number;
  /** Maximum delay between retries in ms */
  maxDelay?: number;
  /** Backoff factor (delay multiplier per retry) */
  backoffFactor?: number;
  /** Whether to add jitter to delays */
  jitter?: boolean;
  /** Function to determine if error is retryable */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Callback called before each retry */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  shouldRetry: (error) => {
    // Don't retry X402 errors (they're intentional business logic)
    if (error instanceof X402Error) {
      return false;
    }
    // Retry network errors
    return true;
  },
  onRetry: () => {},
};

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for a given retry attempt with exponential backoff
 */
export function calculateDelay(
  attempt: number,
  options: Pick<Required<RetryOptions>, 'initialDelay' | 'maxDelay' | 'backoffFactor' | 'jitter'>
): number {
  let delay = options.initialDelay * Math.pow(options.backoffFactor, attempt);

  // Cap at max delay
  delay = Math.min(delay, options.maxDelay);

  // Add jitter (up to 20% variance)
  if (options.jitter) {
    const jitterFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    delay = Math.floor(delay * jitterFactor);
  }

  return delay;
}

/**
 * Execute a function with automatic retries
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt >= opts.maxRetries || !opts.shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts);
      opts.onRetry(lastError, attempt + 1, delay);
      await sleep(delay);
    }
  }

  // This shouldn't be reachable, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

/**
 * Create a retry wrapper with pre-configured options
 */
export function createRetryWrapper(defaultOptions: RetryOptions) {
  return <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
    return withRetry(fn, { ...defaultOptions, ...options });
  };
}

/**
 * Decorator for adding retry to async methods
 */
export function retryable(options: RetryOptions = {}) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}
