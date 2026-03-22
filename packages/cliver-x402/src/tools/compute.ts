/**
 * Compute Tools
 *
 * Code execution and serverless GPU compute tools.
 */

import { z } from 'zod';
import type { X402Client } from '../client.js';
import type { ToolDefinition } from '../types.js';

// =============================================================================
// Input Schemas
// =============================================================================

export const ExecuteCodeInput = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.enum(['python', 'javascript', 'bash']).default('python'),
  timeout: z.number().min(1).max(300).optional().default(30),
  packages: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

export const RunServerlessInput = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.enum(['python', 'javascript']).default('python'),
  gpu: z.enum(['t4', 'a10', 'a100', 'h100']).default('t4'),
  timeout: z.number().min(1).max(600).optional().default(60),
  packages: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  adapter: z.enum(['runpod', 'modal']).optional().default('runpod'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const computeTools: ToolDefinition[] = [
  {
    name: 'x402_execute_code',
    description: `Execute Python, JavaScript, or Bash code in a secure sandbox. Costs ~$0.0001/second.

Run code safely in an isolated E2B sandbox environment:
- Full Python, JavaScript, or Bash support
- Install packages on-demand
- Set environment variables
- Configurable timeout (max 5 minutes)

Perfect for:
- Data processing and analysis
- Running scripts and automation
- Testing code snippets
- File transformations
- API integrations

Security: Code runs in isolated containers with no network access to internal services.`,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The code to execute',
        },
        language: {
          type: 'string',
          description: 'Programming language',
          enum: ['python', 'javascript', 'bash'],
        },
        timeout: {
          type: 'number',
          description: 'Execution timeout in seconds (1-300, default 30)',
        },
        packages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Packages to install before execution (e.g., ["numpy", "pandas"])',
        },
        env: {
          type: 'object',
          description: 'Environment variables to set',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'x402_run_serverless',
    description: `Run code on serverless GPU infrastructure. Cost varies by GPU type.

Execute GPU-accelerated code on RunPod or Modal:
- T4: ~$0.0002/second (good for inference)
- A10: ~$0.0004/second (balanced performance)
- A100: ~$0.001/second (high performance)
- H100: ~$0.002/second (maximum performance)

Perfect for:
- ML model inference
- Image/video processing
- Scientific computing
- Training small models
- GPU-accelerated data processing

Features:
- Pre-installed ML frameworks (PyTorch, TensorFlow, etc.)
- Custom package installation
- Environment variable support
- Configurable timeout (max 10 minutes)

Note: First execution may have cold-start latency (~10-30 seconds).`,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The code to execute',
        },
        language: {
          type: 'string',
          description: 'Programming language',
          enum: ['python', 'javascript'],
        },
        gpu: {
          type: 'string',
          description: 'GPU type to use',
          enum: ['t4', 'a10', 'a100', 'h100'],
        },
        timeout: {
          type: 'number',
          description: 'Execution timeout in seconds (1-600, default 60)',
        },
        packages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Additional packages to install (e.g., ["transformers", "diffusers"])',
        },
        env: {
          type: 'object',
          description: 'Environment variables to set',
        },
        adapter: {
          type: 'string',
          description: 'Serverless provider to use',
          enum: ['runpod', 'modal'],
        },
      },
      required: ['code'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleExecuteCode(client: X402Client, args: unknown): Promise<string> {
  const input = ExecuteCodeInput.parse(args);
  const result = await client.execute<{
    output: string;
    exitCode: number;
    executionTime: number;
    stderr?: string;
  }>('compute', 'execute', {
    code: input.code,
    language: input.language,
    timeout: input.timeout,
    packages: input.packages,
    env: input.env,
    adapter: 'e2b',
  });

  const data = result.data;

  let output = `Code executed successfully!

Language: ${input.language}
Exit Code: ${data.exitCode}
Execution Time: ${data.executionTime.toFixed(2)}s
Cost: $${result.cost.toFixed(6)}`;

  if (input.packages && input.packages.length > 0) {
    output += `\nPackages Installed: ${input.packages.join(', ')}`;
  }

  output += `\n\n--- OUTPUT ---\n${data.output}\n--- END OUTPUT ---`;

  if (data.stderr && data.stderr.trim()) {
    output += `\n\n--- STDERR ---\n${data.stderr}\n--- END STDERR ---`;
  }

  return output;
}

export async function handleRunServerless(client: X402Client, args: unknown): Promise<string> {
  const input = RunServerlessInput.parse(args);
  const result = await client.execute<{
    output: string;
    exitCode: number;
    executionTime: number;
    gpuUtilization?: number;
    memoryUsed?: number;
    stderr?: string;
  }>('compute', 'execute', {
    code: input.code,
    language: input.language,
    gpu: input.gpu,
    timeout: input.timeout,
    packages: input.packages,
    env: input.env,
    adapter: input.adapter,
  });

  const data = result.data;

  let output = `GPU code executed successfully!

Language: ${input.language}
GPU: ${input.gpu.toUpperCase()}
Provider: ${input.adapter}
Exit Code: ${data.exitCode}
Execution Time: ${data.executionTime.toFixed(2)}s
Cost: $${result.cost.toFixed(6)}`;

  if (data.gpuUtilization !== undefined) {
    output += `\nGPU Utilization: ${(data.gpuUtilization * 100).toFixed(1)}%`;
  }

  if (data.memoryUsed !== undefined) {
    output += `\nMemory Used: ${(data.memoryUsed / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  if (input.packages && input.packages.length > 0) {
    output += `\nPackages Installed: ${input.packages.join(', ')}`;
  }

  output += `\n\n--- OUTPUT ---\n${data.output}\n--- END OUTPUT ---`;

  if (data.stderr && data.stderr.trim()) {
    output += `\n\n--- STDERR ---\n${data.stderr}\n--- END STDERR ---`;
  }

  return output;
}

// =============================================================================
// Handler Map
// =============================================================================

export const computeHandlers: Record<string, (client: X402Client, args: unknown) => Promise<string>> = {
  x402_execute_code: handleExecuteCode,
  x402_run_serverless: handleRunServerless,
};
