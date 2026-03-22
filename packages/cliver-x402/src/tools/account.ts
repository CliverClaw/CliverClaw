/**
 * Account Tools
 *
 * Balance checking, usage history, and cost estimation tools.
 */

import { z } from 'zod';
import type { X402Client } from '../client.js';
import type { ToolDefinition } from '../types.js';

// =============================================================================
// Input Schemas
// =============================================================================

export const GetUsageInput = z.object({
  since: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(50),
});

export const EstimateCostInput = z.object({
  service: z.string().min(1, 'Service is required'),
  action: z.string().min(1, 'Action is required'),
  params: z.record(z.unknown()).optional().default({}),
});

export const ServiceStatusInput = z.object({
  service: z.string().optional(),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const accountTools: ToolDefinition[] = [
  {
    name: 'x402_get_balance',
    description: `Check your current account balance and free tier status. Free to use.

Returns:
- Current balance in USD
- Free calls remaining (3 total for new accounts)
- Lifetime spending total

This is the first tool to call to understand your account status.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'x402_get_usage',
    description: `View your usage history and costs. Free to use.

See detailed breakdown of:
- Which services you've used
- Individual call costs
- Total spending

Great for:
- Budgeting
- Understanding costs
- Auditing usage`,
    inputSchema: {
      type: 'object',
      properties: {
        since: {
          type: 'string',
          description: 'ISO date string to filter usage from (e.g., "2024-01-01")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (1-1000, default 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'x402_estimate_cost',
    description: `Estimate the cost of a service call before executing. Free to use.

Get a cost estimate for any operation:
- Exact pricing breakdown
- No charge for estimates
- Helps with budgeting

Always estimate before expensive operations like video generation.`,
    inputSchema: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          description: 'Service name (e.g., "image", "audio", "video", "content")',
        },
        action: {
          type: 'string',
          description: 'Action name (e.g., "generate", "transcribe", "research")',
        },
        params: {
          type: 'object',
          description: 'Parameters that would be sent to the service',
        },
      },
      required: ['service', 'action'],
    },
  },
  {
    name: 'x402_service_status',
    description: `Check the health status of X.402 services. Free to use.

Returns real-time status information:
- Overall system health
- Individual service status (operational, degraded, down)
- Latency metrics
- Any ongoing incidents or maintenance

Useful for:
- Diagnosing service issues
- Checking before starting workflows
- Monitoring service health`,
    inputSchema: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          description: 'Specific service to check (e.g., "openai", "elevenlabs"). Omit for overall status.',
        },
      },
      required: [],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleGetBalance(client: X402Client): Promise<string> {
  const balance = await client.getBalance();

  const freeStatus = balance.freeCallsRemaining > 0
    ? `You have ${balance.freeCallsRemaining} of ${balance.freeCallsTotal} free calls remaining.`
    : 'Free tier exhausted. Using credits for all calls.';

  const balanceStatus = balance.balance > 0
    ? `$${balance.balance.toFixed(2)} available`
    : balance.freeCallsRemaining > 0
      ? 'No credits yet - using free tier'
      : 'No balance - add credits to continue';

  return `Account Status

Balance: ${balanceStatus}
Free Calls: ${freeStatus}
Lifetime Spending: $${balance.lifetimeSpending.toFixed(2)}

--- PRICING REFERENCE ---
Image Generation: ~$0.03/image
Text-to-Speech: ~$0.02/1000 chars
Transcription: ~$0.001/minute
Video Generation: ~$0.05/second
Web Research: ~$0.02/query
--- END ---

${balance.balance <= 0 && balance.freeCallsRemaining <= 0 ? `
To continue using X.402 services:
1. Visit https://cliver.ai/dashboard/wallet
2. Add credits (minimum $5.00)
3. Credits never expire!
` : ''}`;
}

export async function handleGetUsage(client: X402Client, args: unknown): Promise<string> {
  const input = GetUsageInput.parse(args);
  const since = input.since ? new Date(input.since) : undefined;
  const usage = await client.getUsage(since, input.limit);

  const periodStr = usage.period.start && usage.period.end
    ? `${usage.period.start} to ${usage.period.end}`
    : 'All time';

  let output = `Usage History

Period: ${periodStr}
Records: ${usage.records.length}
Total Cost: $${usage.totalCost.toFixed(4)}

--- USAGE RECORDS ---`;

  if (usage.records.length === 0) {
    output += '\nNo usage records found.';
  } else {
    // Group by date
    const groupedByDate: Record<string, typeof usage.records> = {};
    for (const record of usage.records) {
      const date = record.timestamp.split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(record);
    }

    for (const [date, records] of Object.entries(groupedByDate)) {
      const dailyTotal = records.reduce((sum, r) => sum + r.cost, 0);
      output += `\n\n${date} (Total: $${dailyTotal.toFixed(4)})`;

      for (const record of records) {
        const time = record.timestamp.split('T')[1]?.split('.')[0] || '';
        output += `\n  [${time}] ${record.service}/${record.action}: $${record.cost.toFixed(4)}`;
      }
    }
  }

  output += '\n--- END RECORDS ---';

  return output;
}

export async function handleEstimateCost(client: X402Client, args: unknown): Promise<string> {
  const input = EstimateCostInput.parse(args);
  const estimate = await client.estimateCost(input.service, input.action, input.params);

  let output = `Cost Estimate

Service: ${input.service}
Action: ${input.action}
Estimated Cost: $${estimate.estimatedCost.toFixed(4)} ${estimate.currency}`;

  if (estimate.breakdown && estimate.breakdown.length > 0) {
    output += '\n\n--- COST BREAKDOWN ---';
    for (const item of estimate.breakdown) {
      output += `\n${item.item}: $${item.cost.toFixed(4)}`;
    }
    output += '\n--- END BREAKDOWN ---';
  }

  output += `\n
Note: This is an estimate. Actual cost may vary slightly based on:
- Exact output size/duration
- API provider pricing changes
- Usage patterns`;

  return output;
}

export async function handleServiceStatus(client: X402Client, args: unknown): Promise<string> {
  const input = ServiceStatusInput.parse(args);
  const status = await client.getServiceStatus(input.service);

  const statusEmoji = (s: 'operational' | 'degraded' | 'down'): string => {
    switch (s) {
      case 'operational': return '[OK]';
      case 'degraded': return '[DEGRADED]';
      case 'down': return '[DOWN]';
    }
  };

  let output = `Service Status

Overall: ${statusEmoji(status.overall)} ${status.overall.toUpperCase()}
Checked: ${status.timestamp}

--- SERVICE STATUS ---`;

  if (input.service) {
    // Single service requested
    const service = status.services.find(s => s.name.toLowerCase() === input.service?.toLowerCase());
    if (service) {
      output += `\n${service.name}: ${statusEmoji(service.status)} ${service.status}`;
      if (service.latency !== undefined) {
        output += ` (${service.latency}ms)`;
      }
      if (service.message) {
        output += `\n  Note: ${service.message}`;
      }
      output += `\n  Last checked: ${service.lastChecked}`;
    } else {
      output += `\nService "${input.service}" not found.`;
    }
  } else {
    // All services
    for (const service of status.services) {
      output += `\n${service.name}: ${statusEmoji(service.status)} ${service.status}`;
      if (service.latency !== undefined) {
        output += ` (${service.latency}ms)`;
      }
      if (service.message) {
        output += `\n  Note: ${service.message}`;
      }
    }
  }

  output += '\n--- END STATUS ---';

  const hasIssues = status.services.some(s => s.status !== 'operational');
  if (hasIssues) {
    output += `\n
Some services are experiencing issues. Check https://status.cliver.ai for updates.`;
  }

  return output;
}

// =============================================================================
// Handler Map
// =============================================================================

export const accountHandlers: Record<string, (client: X402Client, args: unknown) => Promise<string>> = {
  x402_get_balance: handleGetBalance,
  x402_get_usage: handleGetUsage,
  x402_estimate_cost: handleEstimateCost,
  x402_service_status: handleServiceStatus,
};
