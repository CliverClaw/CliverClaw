/**
 * Balance Utilities
 *
 * Helper functions for balance checking and management.
 */

import type { BalanceResponse } from '../types.js';

/**
 * Check if account has sufficient balance for an operation
 */
export function hasSufficientBalance(balance: BalanceResponse, requiredAmount: number): boolean {
  // Free tier still has calls remaining
  if (balance.freeCallsRemaining > 0) {
    return true;
  }

  // Check actual balance
  return balance.balance >= requiredAmount;
}

/**
 * Check if free tier is exhausted
 */
export function isFreeTierExhausted(balance: BalanceResponse): boolean {
  return balance.freeCallsRemaining <= 0 && balance.balance <= 0;
}

/**
 * Check if using free tier
 */
export function isUsingFreeTier(balance: BalanceResponse): boolean {
  return balance.freeCallsRemaining > 0 && balance.balance <= 0;
}

/**
 * Get account status summary
 */
export type AccountStatus = 'free_tier' | 'paid' | 'exhausted';

export function getAccountStatus(balance: BalanceResponse): AccountStatus {
  if (balance.balance > 0) {
    return 'paid';
  }

  if (balance.freeCallsRemaining > 0) {
    return 'free_tier';
  }

  return 'exhausted';
}

/**
 * Format balance for display
 */
export function formatBalance(balance: BalanceResponse): string {
  const status = getAccountStatus(balance);

  switch (status) {
    case 'paid':
      return `$${balance.balance.toFixed(2)} available`;

    case 'free_tier':
      return `${balance.freeCallsRemaining} free calls remaining`;

    case 'exhausted':
      return 'No balance - add credits to continue';
  }
}

/**
 * Calculate remaining operations based on balance and cost per operation
 */
export function estimateRemainingOperations(
  balance: BalanceResponse,
  costPerOperation: number
): number {
  if (costPerOperation <= 0) {
    return Infinity;
  }

  // Free tier calls
  const freeOps = balance.freeCallsRemaining;

  // Paid operations
  const paidOps = Math.floor(balance.balance / costPerOperation);

  return freeOps + paidOps;
}

/**
 * Low balance warning threshold (in USD)
 */
export const LOW_BALANCE_THRESHOLD = 1.0;

/**
 * Check if balance is low
 */
export function isLowBalance(balance: BalanceResponse): boolean {
  return (
    balance.freeCallsRemaining <= 0 &&
    balance.balance > 0 &&
    balance.balance < LOW_BALANCE_THRESHOLD
  );
}

/**
 * Get balance warning message if applicable
 */
export function getBalanceWarning(balance: BalanceResponse): string | null {
  const status = getAccountStatus(balance);

  if (status === 'exhausted') {
    return 'Account balance exhausted. Add credits at https://cliver.ai/dashboard/wallet';
  }

  if (status === 'free_tier' && balance.freeCallsRemaining === 1) {
    return 'This is your last free API call. Add credits to continue using X.402 services.';
  }

  if (isLowBalance(balance)) {
    return `Low balance warning: $${balance.balance.toFixed(2)} remaining. Consider adding credits.`;
  }

  return null;
}
