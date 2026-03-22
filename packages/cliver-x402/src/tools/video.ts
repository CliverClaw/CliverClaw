/**
 * Video Tools
 *
 * Video generation, editing, GIF conversion, and subtitle tools.
 */

import { z } from 'zod';
import type { X402Client } from '../client.js';
import type { ToolDefinition } from '../types.js';

// =============================================================================
// Input Schemas
// =============================================================================

export const GenerateVideoInput = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  duration: z.number().min(1).max(10).optional().default(4),
  style: z.string().optional(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).optional().default('16:9'),
});

export const EditVideoInput = z.object({
  videoUrl: z.string().url('Invalid video URL'),
  instructions: z.string().min(1, 'Edit instructions are required'),
});

export const VideoToGifInput = z.object({
  videoUrl: z.string().url('Invalid video URL'),
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
  fps: z.number().min(5).max(30).optional().default(15),
  width: z.number().min(100).max(1920).optional(),
});

export const AddSubtitlesInput = z.object({
  videoUrl: z.string().url('Invalid video URL'),
  subtitles: z.string().optional(),
  language: z.string().optional(),
  style: z.enum(['bottom', 'caption']).optional().default('bottom'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const videoTools: ToolDefinition[] = [
  {
    name: 'x402_generate_video',
    description: `Generate a video from a text description. Costs ~$0.05/second.

Create short video clips using AI:
- Describe scenes, actions, and style
- Up to 10 seconds per generation
- Multiple aspect ratios supported

Perfect for:
- Social media content
- Product demonstrations
- Concept visualization
- Creative projects

Note: Video generation takes 30-120 seconds depending on complexity.`,
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed description of the video to generate (e.g., "A golden retriever running through a field of flowers, slow motion, cinematic")',
        },
        duration: {
          type: 'number',
          description: 'Video duration in seconds (1-10, default 4)',
        },
        style: {
          type: 'string',
          description: 'Visual style (e.g., "cinematic", "animation", "realistic")',
        },
        aspectRatio: {
          type: 'string',
          description: 'Video aspect ratio',
          enum: ['16:9', '9:16', '1:1'],
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'x402_edit_video',
    description: `Edit a video using AI instructions. Costs ~$0.10/video.

Modify existing videos with natural language:
- Apply style transfer
- Add visual effects
- Change colors/mood
- Modify specific elements

Note: For complex edits, be as specific as possible about what should change.`,
    inputSchema: {
      type: 'object',
      properties: {
        videoUrl: {
          type: 'string',
          description: 'URL of the video to edit',
        },
        instructions: {
          type: 'string',
          description: 'Natural language instructions for editing (e.g., "Make it look like a vintage film", "Add rain effect")',
        },
      },
      required: ['videoUrl', 'instructions'],
    },
  },
  {
    name: 'x402_video_to_gif',
    description: `Convert a video to an animated GIF. Costs ~$0.01/conversion.

Create GIFs from video clips:
- Specify start and end times
- Adjust frame rate and size
- Optimize for file size

Perfect for:
- Social media sharing
- Message reactions
- Documentation
- Embedding in content`,
    inputSchema: {
      type: 'object',
      properties: {
        videoUrl: {
          type: 'string',
          description: 'URL of the video to convert',
        },
        startTime: {
          type: 'number',
          description: 'Start time in seconds',
        },
        endTime: {
          type: 'number',
          description: 'End time in seconds',
        },
        fps: {
          type: 'number',
          description: 'Frames per second (5-30, default 15). Lower = smaller file.',
        },
        width: {
          type: 'number',
          description: 'Output width in pixels (100-1920). Height scales proportionally.',
        },
      },
      required: ['videoUrl'],
    },
  },
  {
    name: 'x402_add_subtitles',
    description: `Add subtitles to a video. Costs ~$0.03/minute.

Automatically generate and embed subtitles:
- Auto-transcribe if no subtitles provided
- Multiple language support
- Customizable styling

Perfect for:
- Accessibility compliance
- Social media (auto-play muted)
- International audiences
- Content repurposing`,
    inputSchema: {
      type: 'object',
      properties: {
        videoUrl: {
          type: 'string',
          description: 'URL of the video',
        },
        subtitles: {
          type: 'string',
          description: 'Subtitle text in SRT format. If not provided, auto-generates from audio.',
        },
        language: {
          type: 'string',
          description: 'Language code for auto-transcription (e.g., "en", "es")',
        },
        style: {
          type: 'string',
          description: 'Subtitle style',
          enum: ['bottom', 'caption'],
        },
      },
      required: ['videoUrl'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleGenerateVideo(client: X402Client, args: unknown): Promise<string> {
  const input = GenerateVideoInput.parse(args);
  const result = await client.generateVideo(input);

  const data = result.data as { videoUrl: string; duration: number };

  return `Video generated successfully!

Video URL: ${data.videoUrl}
Duration: ${data.duration.toFixed(1)} seconds
Aspect Ratio: ${input.aspectRatio}
Style: ${input.style || 'auto'}
Cost: $${result.cost.toFixed(4)}

The video URL is temporary and will expire in 24 hours. Download it if you need to keep it.`;
}

export async function handleEditVideo(client: X402Client, args: unknown): Promise<string> {
  const input = EditVideoInput.parse(args);
  const result = await client.editVideo(input);

  const data = result.data as { videoUrl: string };

  return `Video edited successfully!

Video URL: ${data.videoUrl}
Instructions Applied: "${input.instructions}"
Cost: $${result.cost.toFixed(4)}

The video URL is temporary and will expire in 24 hours.`;
}

export async function handleVideoToGif(client: X402Client, args: unknown): Promise<string> {
  const input = VideoToGifInput.parse(args);
  const result = await client.videoToGif(input);

  const data = result.data as { gifUrl: string };

  const timeRange = input.startTime !== undefined || input.endTime !== undefined
    ? `${input.startTime || 0}s - ${input.endTime || 'end'}`
    : 'full video';

  return `GIF created successfully!

GIF URL: ${data.gifUrl}
Time Range: ${timeRange}
Frame Rate: ${input.fps} fps
${input.width ? `Width: ${input.width}px` : ''}
Cost: $${result.cost.toFixed(4)}

The GIF URL is temporary and will expire in 24 hours.`;
}

export async function handleAddSubtitles(client: X402Client, args: unknown): Promise<string> {
  const input = AddSubtitlesInput.parse(args);
  const result = await client.addSubtitles(input);

  const data = result.data as { videoUrl: string };

  const subtitleSource = input.subtitles
    ? 'Provided subtitles'
    : `Auto-generated (${input.language || 'auto-detected language'})`;

  return `Subtitles added successfully!

Video URL: ${data.videoUrl}
Subtitle Source: ${subtitleSource}
Style: ${input.style}
Cost: $${result.cost.toFixed(4)}

The video URL is temporary and will expire in 24 hours.`;
}

// =============================================================================
// Handler Map
// =============================================================================

export const videoHandlers: Record<string, (client: X402Client, args: unknown) => Promise<string>> = {
  x402_generate_video: handleGenerateVideo,
  x402_edit_video: handleEditVideo,
  x402_video_to_gif: handleVideoToGif,
  x402_add_subtitles: handleAddSubtitles,
};
