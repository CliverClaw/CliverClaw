/**
 * Visual Tools
 *
 * Image generation, upscaling, editing, and optimization tools.
 */

import { z } from 'zod';
import type { X402Client } from '../client.js';
import type { ToolDefinition } from '../types.js';

// =============================================================================
// Input Schemas
// =============================================================================

export const GenerateImageInput = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  style: z.enum(['photorealistic', 'artistic', 'cartoon', 'anime', 'sketch', 'digital-art']).optional(),
  size: z.enum(['512x512', '1024x1024', '1920x1080', '1080x1920', '1024x768', '768x1024']).optional(),
  negativePrompt: z.string().optional(),
});

export const UpscaleImageInput = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  scale: z.union([z.literal(2), z.literal(4)]).optional().default(2),
});

export const EditImageInput = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  prompt: z.string().min(1, 'Edit prompt is required'),
  maskUrl: z.string().url().optional(),
});

export const OptimizeImageInput = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  format: z.enum(['webp', 'jpeg', 'png', 'avif']).optional(),
  quality: z.number().min(1).max(100).optional(),
  maxWidth: z.number().positive().optional(),
  maxHeight: z.number().positive().optional(),
});

export const RemoveBackgroundInput = z.object({
  imageUrl: z.string().url('Invalid image URL'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const visualTools: ToolDefinition[] = [
  {
    name: 'x402_generate_image',
    description: `Generate an image using AI. Costs ~$0.03/image.

Powered by state-of-the-art image models. Perfect for:
- Concept art and illustrations
- Marketing materials
- UI mockups
- Social media content

Example prompts:
- "A cozy coffee shop interior with warm lighting, photorealistic"
- "Cyberpunk cityscape at night with neon signs, digital art style"
- "Cute cartoon fox wearing a scarf, children's book illustration"`,
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed description of the image to generate',
        },
        style: {
          type: 'string',
          description: 'Visual style of the image',
          enum: ['photorealistic', 'artistic', 'cartoon', 'anime', 'sketch', 'digital-art'],
        },
        size: {
          type: 'string',
          description: 'Output image dimensions',
          enum: ['512x512', '1024x1024', '1920x1080', '1080x1920', '1024x768', '768x1024'],
        },
        negativePrompt: {
          type: 'string',
          description: 'Things to avoid in the image (e.g., "blurry, low quality, text")',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'x402_upscale_image',
    description: `Upscale an image to higher resolution. Costs ~$0.01/image.

Uses AI super-resolution to increase image quality:
- 2x scale: Good balance of quality and speed
- 4x scale: Maximum detail, takes longer

Great for:
- Enlarging small images for print
- Improving old photos
- Preparing images for large displays`,
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'URL of the image to upscale',
        },
        scale: {
          type: 'number',
          description: 'Upscale factor (2 or 4)',
          enum: ['2', '4'],
        },
      },
      required: ['imageUrl'],
    },
  },
  {
    name: 'x402_edit_image',
    description: `Edit an existing image using AI. Costs ~$0.04/edit.

Modify images with natural language instructions:
- Change colors, lighting, or mood
- Add or remove objects
- Change backgrounds
- Apply artistic effects

Optionally provide a mask URL to edit only specific areas.`,
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'URL of the image to edit',
        },
        prompt: {
          type: 'string',
          description: 'Description of the changes to make (e.g., "change the sky to sunset colors")',
        },
        maskUrl: {
          type: 'string',
          description: 'Optional URL to a mask image (white areas will be edited)',
        },
      },
      required: ['imageUrl', 'prompt'],
    },
  },
  {
    name: 'x402_optimize_image',
    description: `Optimize an image for web use. Costs ~$0.005/image.

Reduce file size while maintaining quality:
- Convert to modern formats (WebP, AVIF)
- Compress with smart quality settings
- Resize to specific dimensions

Perfect for:
- Web performance optimization
- Reducing storage costs
- Preparing images for email`,
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'URL of the image to optimize',
        },
        format: {
          type: 'string',
          description: 'Output format (webp is recommended for web)',
          enum: ['webp', 'jpeg', 'png', 'avif'],
        },
        quality: {
          type: 'number',
          description: 'Quality level 1-100 (80 is a good balance)',
        },
        maxWidth: {
          type: 'number',
          description: 'Maximum width in pixels',
        },
        maxHeight: {
          type: 'number',
          description: 'Maximum height in pixels',
        },
      },
      required: ['imageUrl'],
    },
  },
  {
    name: 'x402_remove_background',
    description: `Remove the background from an image. Costs ~$0.02/image.

Uses AI to isolate the main subject:
- Works great with people, products, and animals
- Outputs transparent PNG
- High-quality edge detection

Perfect for:
- Product photography
- Profile pictures
- Creating stickers
- Graphic design composites`,
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'URL of the image to process',
        },
      },
      required: ['imageUrl'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleGenerateImage(client: X402Client, args: unknown): Promise<string> {
  const input = GenerateImageInput.parse(args);
  const result = await client.generateImage(input);

  const data = result.data as { imageUrl: string; width: number; height: number };

  return `Image generated successfully!

URL: ${data.imageUrl}
Dimensions: ${data.width}x${data.height}
Cost: $${result.cost.toFixed(4)}

The image URL is temporary and will expire in 24 hours. Download or save it if you need to keep it.`;
}

export async function handleUpscaleImage(client: X402Client, args: unknown): Promise<string> {
  const input = UpscaleImageInput.parse(args);
  const result = await client.upscaleImage(input);

  const data = result.data as { imageUrl: string; width: number; height: number };

  return `Image upscaled successfully!

URL: ${data.imageUrl}
New Dimensions: ${data.width}x${data.height}
Scale Factor: ${input.scale}x
Cost: $${result.cost.toFixed(4)}`;
}

export async function handleEditImage(client: X402Client, args: unknown): Promise<string> {
  const input = EditImageInput.parse(args);
  const result = await client.editImage(input);

  const data = result.data as { imageUrl: string };

  return `Image edited successfully!

URL: ${data.imageUrl}
Edit Applied: "${input.prompt}"
Cost: $${result.cost.toFixed(4)}`;
}

export async function handleOptimizeImage(client: X402Client, args: unknown): Promise<string> {
  const input = OptimizeImageInput.parse(args);
  const result = await client.optimizeImage(input);

  const data = result.data as { imageUrl: string; originalSize: number; optimizedSize: number; savings: number };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return `Image optimized successfully!

URL: ${data.imageUrl}
Original Size: ${formatSize(data.originalSize)}
Optimized Size: ${formatSize(data.optimizedSize)}
Savings: ${data.savings.toFixed(1)}%
Format: ${input.format || 'original'}
Cost: $${result.cost.toFixed(4)}`;
}

export async function handleRemoveBackground(client: X402Client, args: unknown): Promise<string> {
  const input = RemoveBackgroundInput.parse(args);
  const result = await client.removeBackground(input);

  const data = result.data as { imageUrl: string };

  return `Background removed successfully!

URL: ${data.imageUrl}
Format: PNG with transparency
Cost: $${result.cost.toFixed(4)}

The output is a transparent PNG. Perfect for compositing or using over any background.`;
}

// =============================================================================
// Handler Map
// =============================================================================

export const visualHandlers: Record<string, (client: X402Client, args: unknown) => Promise<string>> = {
  x402_generate_image: handleGenerateImage,
  x402_upscale_image: handleUpscaleImage,
  x402_edit_image: handleEditImage,
  x402_optimize_image: handleOptimizeImage,
  x402_remove_background: handleRemoveBackground,
};
