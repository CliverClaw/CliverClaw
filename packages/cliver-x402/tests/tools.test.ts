/**
 * Tools Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';
import {
  allTools,
  toolsByCategory,
  getTool,
  hasTool,
  getToolSummary,
  executeTool,
} from '../src/tools/index.js';
import { X402Client } from '../src/client.js';

// Mock the client
vi.mock('../src/client.js', () => ({
  X402Client: vi.fn().mockImplementation(() => ({
    generateImage: vi.fn().mockResolvedValue({
      success: true,
      cost: 0.03,
      data: { imageUrl: 'https://example.com/image.png', width: 1024, height: 1024 },
    }),
    getBalance: vi.fn().mockResolvedValue({
      balance: 10.0,
      currency: 'USD',
      freeCallsRemaining: 2,
      freeCallsTotal: 3,
      lifetimeSpending: 5.0,
    }),
    textToSpeech: vi.fn().mockResolvedValue({
      success: true,
      cost: 0.02,
      data: { audioUrl: 'https://example.com/audio.mp3', duration: 5.0 },
    }),
    researchWeb: vi.fn().mockResolvedValue({
      success: true,
      cost: 0.02,
      data: {
        answer: 'Research results...',
        sources: [{ title: 'Source', url: 'https://example.com', snippet: 'Snippet' }],
      },
    }),
  })),
}));

describe('Tool Registry', () => {
  describe('allTools', () => {
    it('should contain all tools', () => {
      expect(allTools.length).toBeGreaterThanOrEqual(30);
    });

    it('should have unique tool names', () => {
      const names = allTools.map(t => t.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });

    it('should have valid tool definitions', () => {
      for (const tool of allTools) {
        expect(tool.name).toMatch(/^x402_/);
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
        expect(Array.isArray(tool.inputSchema.required)).toBe(true);
      }
    });
  });

  describe('toolsByCategory', () => {
    it('should have all categories', () => {
      expect(toolsByCategory.visual).toBeDefined();
      expect(toolsByCategory.audio).toBeDefined();
      expect(toolsByCategory.video).toBeDefined();
      expect(toolsByCategory.content).toBeDefined();
      expect(toolsByCategory.data).toBeDefined();
      expect(toolsByCategory.social).toBeDefined();
      expect(toolsByCategory.account).toBeDefined();
    });

    it('should have correct tool counts per category', () => {
      expect(toolsByCategory.visual.length).toBe(5);
      expect(toolsByCategory.audio.length).toBe(5);
      expect(toolsByCategory.video.length).toBe(4);
      expect(toolsByCategory.content.length).toBe(5);
      expect(toolsByCategory.data.length).toBe(4);
      expect(toolsByCategory.social.length).toBe(4);
      expect(toolsByCategory.account.length).toBe(4);
    });
  });

  describe('getTool', () => {
    it('should return tool by name', () => {
      const tool = getTool('x402_generate_image');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('x402_generate_image');
    });

    it('should return undefined for unknown tool', () => {
      const tool = getTool('x402_unknown_tool');
      expect(tool).toBeUndefined();
    });
  });

  describe('hasTool', () => {
    it('should return true for existing tool', () => {
      expect(hasTool('x402_generate_image')).toBe(true);
      expect(hasTool('x402_get_balance')).toBe(true);
    });

    it('should return false for non-existing tool', () => {
      expect(hasTool('x402_nonexistent')).toBe(false);
    });
  });

  describe('getToolSummary', () => {
    it('should return correct summary', () => {
      const summary = getToolSummary();

      expect(summary.total).toBeGreaterThanOrEqual(30);
      expect(summary.byCategory.visual).toBe(5);
      expect(summary.byCategory.audio).toBe(5);
      expect(summary.byCategory.video).toBe(4);
      expect(summary.byCategory.content).toBe(5);
      expect(summary.byCategory.data).toBe(4);
      expect(summary.byCategory.social).toBe(4);
      expect(summary.byCategory.account).toBe(4);
    });
  });
});

describe('Tool Execution', () => {
  let mockClient: X402Client;

  beforeEach(() => {
    mockClient = new X402Client('test_key');
  });

  describe('executeTool', () => {
    it('should execute x402_generate_image', async () => {
      const result = await executeTool(mockClient, 'x402_generate_image', {
        prompt: 'A sunset',
      });

      expect(result).toContain('Image generated successfully');
      expect(result).toContain('https://example.com/image.png');
    });

    it('should execute x402_get_balance', async () => {
      const result = await executeTool(mockClient, 'x402_get_balance', {});

      expect(result).toContain('Account Status');
      expect(result).toContain('$10.00');
    });

    it('should throw for unknown tool', async () => {
      await expect(
        executeTool(mockClient, 'x402_unknown', {})
      ).rejects.toThrow('Unknown tool');
    });

    it('should throw validation error for invalid input', async () => {
      await expect(
        executeTool(mockClient, 'x402_generate_image', {
          // Missing required 'prompt' field
        })
      ).rejects.toThrow(ZodError);
    });
  });
});

describe('Visual Tools', () => {
  describe('x402_generate_image schema', () => {
    const tool = getTool('x402_generate_image')!;

    it('should require prompt', () => {
      expect(tool.inputSchema.required).toContain('prompt');
    });

    it('should have style enum', () => {
      const styleProperty = tool.inputSchema.properties.style;
      expect(styleProperty.enum).toContain('photorealistic');
      expect(styleProperty.enum).toContain('artistic');
      expect(styleProperty.enum).toContain('cartoon');
    });

    it('should have size enum', () => {
      const sizeProperty = tool.inputSchema.properties.size;
      expect(sizeProperty.enum).toContain('512x512');
      expect(sizeProperty.enum).toContain('1024x1024');
      expect(sizeProperty.enum).toContain('1920x1080');
    });
  });
});

describe('Audio Tools', () => {
  describe('x402_text_to_speech schema', () => {
    const tool = getTool('x402_text_to_speech')!;

    it('should require text', () => {
      expect(tool.inputSchema.required).toContain('text');
    });

    it('should have format enum', () => {
      const formatProperty = tool.inputSchema.properties.format;
      expect(formatProperty.enum).toContain('mp3');
      expect(formatProperty.enum).toContain('wav');
    });
  });
});

describe('Content Tools', () => {
  describe('x402_research_web schema', () => {
    const tool = getTool('x402_research_web')!;

    it('should require query', () => {
      expect(tool.inputSchema.required).toContain('query');
    });

    it('should have depth enum', () => {
      const depthProperty = tool.inputSchema.properties.depth;
      expect(depthProperty.enum).toContain('quick');
      expect(depthProperty.enum).toContain('detailed');
    });
  });
});

describe('Account Tools', () => {
  describe('x402_get_balance', () => {
    const tool = getTool('x402_get_balance')!;

    it('should have no required fields', () => {
      expect(tool.inputSchema.required).toHaveLength(0);
    });
  });

  describe('x402_estimate_cost schema', () => {
    const tool = getTool('x402_estimate_cost')!;

    it('should require service and action', () => {
      expect(tool.inputSchema.required).toContain('service');
      expect(tool.inputSchema.required).toContain('action');
    });
  });
});
