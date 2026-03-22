/**
 * API Key Utilities
 *
 * Helper functions for API key handling and validation.
 */

/**
 * API key format:
 * cliver_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *
 * - Prefix: "cliver"
 * - Type: "sk" (secret key) or "pk" (public key)
 * - Random: 32 alphanumeric characters
 */

const API_KEY_PREFIX = 'cliver';
const SECRET_KEY_TYPE = 'sk';
const PUBLIC_KEY_TYPE = 'pk';
const RANDOM_PART_LENGTH = 32;

const API_KEY_REGEX = /^cliver_(sk|pk)_[a-zA-Z0-9]{32}$/;

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return API_KEY_REGEX.test(key);
}

/**
 * Check if key is a secret key
 */
export function isSecretKey(key: string): boolean {
  return key.startsWith(`${API_KEY_PREFIX}_${SECRET_KEY_TYPE}_`);
}

/**
 * Check if key is a public key
 */
export function isPublicKey(key: string): boolean {
  return key.startsWith(`${API_KEY_PREFIX}_${PUBLIC_KEY_TYPE}_`);
}

/**
 * Get the key type (sk or pk)
 */
export function getKeyType(key: string): 'sk' | 'pk' | null {
  if (isSecretKey(key)) return 'sk';
  if (isPublicKey(key)) return 'pk';
  return null;
}

/**
 * Mask an API key for display (show prefix and last 4 chars)
 */
export function maskApiKey(key: string): string {
  if (key.length < 20) {
    return '***';
  }

  const prefix = key.slice(0, 10); // "cliver_sk_"
  const suffix = key.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Extract the prefix from an API key (for identification)
 */
export function getKeyPrefix(key: string): string {
  // Return first 18 chars: "cliver_sk_XXXXXXXX"
  return key.slice(0, 18);
}

/**
 * Generate a random API key (for testing/development only)
 * In production, keys should only be generated server-side
 */
export function generateTestApiKey(type: 'sk' | 'pk' = 'sk'): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';

  for (let i = 0; i < RANDOM_PART_LENGTH; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${API_KEY_PREFIX}_${type}_${random}`;
}

/**
 * Validate and parse an API key
 */
export interface ParsedApiKey {
  valid: boolean;
  prefix: string;
  type: 'sk' | 'pk';
  random: string;
}

export function parseApiKey(key: string): ParsedApiKey | null {
  if (!isValidApiKeyFormat(key)) {
    return null;
  }

  const parts = key.split('_');
  if (parts.length !== 3) {
    return null;
  }

  return {
    valid: true,
    prefix: parts[0],
    type: parts[1] as 'sk' | 'pk',
    random: parts[2],
  };
}

/**
 * Get API key from environment or throw
 */
export function getApiKeyFromEnv(): string {
  const key = process.env.CLIVER_API_KEY;

  if (!key) {
    throw new Error(
      'API key not found. Set CLIVER_API_KEY environment variable or pass it as an argument.'
    );
  }

  if (!isValidApiKeyFormat(key)) {
    console.warn(`Warning: API key format looks incorrect. Expected: cliver_sk_xxxxx`);
  }

  return key;
}
