/**
 * Content Tools
 *
 * Text generation, web research, summarization, translation, and grammar checking.
 */

import { z } from 'zod';
import type { X402Client } from '../client.js';
import type { ToolDefinition } from '../types.js';

// =============================================================================
// Input Schemas
// =============================================================================

export const GenerateTextInput = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  maxTokens: z.number().min(1).max(100000).optional().default(4096),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  systemPrompt: z.string().optional(),
});

export const ResearchWebInput = z.object({
  query: z.string().min(1, 'Query is required'),
  depth: z.enum(['quick', 'detailed']).optional().default('quick'),
  maxSources: z.number().min(1).max(20).optional().default(5),
});

export const SummarizeInput = z.object({
  text: z.string().optional(),
  url: z.string().url().optional(),
  length: z.enum(['brief', 'detailed']).optional().default('brief'),
}).refine(data => data.text || data.url, {
  message: 'Either text or url must be provided',
});

export const TranslateInput = z.object({
  text: z.string().min(1, 'Text is required'),
  targetLanguage: z.string().min(1, 'Target language is required'),
  sourceLanguage: z.string().optional(),
});

export const GrammarCheckInput = z.object({
  text: z.string().min(1, 'Text is required'),
  style: z.enum(['formal', 'casual', 'academic']).optional().default('formal'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const contentTools: ToolDefinition[] = [
  {
    name: 'x402_generate_text',
    description: `Generate text using a powerful AI model. Costs ~$0.01/1000 tokens.

Powered by Claude for high-quality text generation:
- Creative writing
- Technical documentation
- Code generation
- Analysis and reasoning

Supports custom system prompts for specific behaviors.
Note: For complex tasks, consider providing a detailed system prompt.`,
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The prompt or question to send to the AI',
        },
        maxTokens: {
          type: 'number',
          description: 'Maximum tokens in response (default 4096)',
        },
        temperature: {
          type: 'number',
          description: 'Creativity level 0-2 (default 0.7). Lower = more focused, higher = more creative.',
        },
        systemPrompt: {
          type: 'string',
          description: 'System instructions that define AI behavior (e.g., "You are a helpful coding assistant")',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'x402_research_web',
    description: `Research a topic using web search and AI synthesis. Costs ~$0.02/query.

Powered by Perplexity for accurate, up-to-date information:
- Searches multiple sources
- Synthesizes findings into a coherent answer
- Includes source citations

Perfect for:
- Fact-checking
- Market research
- Technical questions
- Current events`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The research question or topic',
        },
        depth: {
          type: 'string',
          description: 'Research depth',
          enum: ['quick', 'detailed'],
        },
        maxSources: {
          type: 'number',
          description: 'Maximum number of sources to include (1-20, default 5)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'x402_summarize',
    description: `Summarize text or a webpage. Costs ~$0.01/summary.

Create concise summaries:
- Provide text directly or a URL
- Choose brief or detailed length
- Extracts key points

Perfect for:
- Article summaries
- Meeting notes
- Document digests
- Research compilation`,
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to summarize (provide this OR url)',
        },
        url: {
          type: 'string',
          description: 'URL of webpage to summarize (provide this OR text)',
        },
        length: {
          type: 'string',
          description: 'Summary length',
          enum: ['brief', 'detailed'],
        },
      },
      required: [],
    },
  },
  {
    name: 'x402_translate',
    description: `Translate text between languages. Costs ~$0.01/1000 characters.

High-quality neural translation:
- 100+ languages supported
- Preserves formatting
- Handles idioms and context

Language codes: en (English), es (Spanish), fr (French), de (German),
zh (Chinese), ja (Japanese), ko (Korean), pt (Portuguese), etc.`,
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to translate',
        },
        targetLanguage: {
          type: 'string',
          description: 'Target language code (e.g., "es" for Spanish)',
        },
        sourceLanguage: {
          type: 'string',
          description: 'Source language code. Auto-detected if not provided.',
        },
      },
      required: ['text', 'targetLanguage'],
    },
  },
  {
    name: 'x402_grammar_check',
    description: `Check and correct grammar, spelling, and style. Costs ~$0.01/check.

Comprehensive writing improvement:
- Grammar and spelling corrections
- Style suggestions
- Clarity improvements
- Multiple style modes

Returns both corrected text and detailed explanations.`,
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to check',
        },
        style: {
          type: 'string',
          description: 'Writing style to target',
          enum: ['formal', 'casual', 'academic'],
        },
      },
      required: ['text'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleGenerateText(client: X402Client, args: unknown): Promise<string> {
  const input = GenerateTextInput.parse(args);
  const result = await client.generateText(input);

  const data = result.data as { text: string; tokensUsed: number };

  return `Text generated successfully!

Tokens Used: ${data.tokensUsed}
Cost: $${result.cost.toFixed(4)}

--- GENERATED TEXT ---
${data.text}
--- END ---`;
}

export async function handleResearchWeb(client: X402Client, args: unknown): Promise<string> {
  const input = ResearchWebInput.parse(args);
  const result = await client.researchWeb(input);

  const data = result.data as {
    answer: string;
    sources: { title: string; url: string; snippet: string }[];
  };

  let output = `Research complete!

Depth: ${input.depth}
Sources Found: ${data.sources.length}
Cost: $${result.cost.toFixed(4)}

--- ANSWER ---
${data.answer}
--- END ANSWER ---

--- SOURCES ---`;

  for (const source of data.sources) {
    output += `\n\n[${source.title}](${source.url})\n${source.snippet}`;
  }

  output += '\n--- END SOURCES ---';

  return output;
}

export async function handleSummarize(client: X402Client, args: unknown): Promise<string> {
  const input = SummarizeInput.parse(args);
  const result = await client.summarize(input);

  const data = result.data as { summary: string; originalLength: number };

  const source = input.url ? `URL: ${input.url}` : `Original Length: ${data.originalLength} characters`;

  return `Summary generated!

${source}
Length: ${input.length}
Cost: $${result.cost.toFixed(4)}

--- SUMMARY ---
${data.summary}
--- END SUMMARY ---`;
}

export async function handleTranslate(client: X402Client, args: unknown): Promise<string> {
  const input = TranslateInput.parse(args);
  const result = await client.translate(input);

  const data = result.data as { text: string; detectedLanguage?: string };

  const sourceInfo = input.sourceLanguage
    ? `Source: ${input.sourceLanguage}`
    : `Detected: ${data.detectedLanguage || 'unknown'}`;

  return `Translation complete!

${sourceInfo}
Target: ${input.targetLanguage}
Cost: $${result.cost.toFixed(4)}

--- TRANSLATED TEXT ---
${data.text}
--- END ---`;
}

export async function handleGrammarCheck(client: X402Client, args: unknown): Promise<string> {
  const input = GrammarCheckInput.parse(args);
  const result = await client.grammarCheck(input);

  const data = result.data as {
    correctedText: string;
    corrections: { original: string; corrected: string; explanation: string }[];
  };

  let output = `Grammar check complete!

Style: ${input.style}
Corrections Found: ${data.corrections.length}
Cost: $${result.cost.toFixed(4)}

--- CORRECTED TEXT ---
${data.correctedText}
--- END CORRECTED TEXT ---`;

  if (data.corrections.length > 0) {
    output += '\n\n--- CORRECTIONS ---';
    for (const c of data.corrections) {
      output += `\n\n"${c.original}" -> "${c.corrected}"\n  Reason: ${c.explanation}`;
    }
    output += '\n--- END CORRECTIONS ---';
  }

  return output;
}

// =============================================================================
// Handler Map
// =============================================================================

export const contentHandlers: Record<string, (client: X402Client, args: unknown) => Promise<string>> = {
  x402_generate_text: handleGenerateText,
  x402_research_web: handleResearchWeb,
  x402_summarize: handleSummarize,
  x402_translate: handleTranslate,
  x402_grammar_check: handleGrammarCheck,
};
