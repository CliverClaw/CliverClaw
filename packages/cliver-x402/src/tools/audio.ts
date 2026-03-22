/**
 * Audio Tools
 *
 * Text-to-speech, transcription, voice cloning, and audio processing tools.
 */

import { z } from 'zod';
import type { X402Client } from '../client.js';
import type { ToolDefinition } from '../types.js';

// =============================================================================
// Input Schemas
// =============================================================================

export const TextToSpeechInput = z.object({
  text: z.string().min(1, 'Text is required').max(5000, 'Text must be under 5000 characters'),
  voice: z.string().optional(),
  format: z.enum(['mp3', 'wav', 'ogg', 'flac']).optional(),
  speed: z.number().min(0.5).max(2.0).optional(),
});

export const TranscribeInput = z.object({
  audioUrl: z.string().url('Invalid audio URL'),
  language: z.string().optional(),
  timestamps: z.boolean().optional(),
});

export const CloneVoiceInput = z.object({
  audioSamples: z.array(z.string().url()).min(1, 'At least one audio sample is required'),
  name: z.string().min(1, 'Voice name is required'),
  description: z.string().optional(),
});

export const AudioCleanupInput = z.object({
  audioUrl: z.string().url('Invalid audio URL'),
  removeNoise: z.boolean().optional().default(true),
  removeBackground: z.boolean().optional().default(false),
  normalize: z.boolean().optional().default(true),
});

export const MusicGenerateInput = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  duration: z.number().min(5).max(300).optional().default(30),
  genre: z.string().optional(),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const audioTools: ToolDefinition[] = [
  {
    name: 'x402_text_to_speech',
    description: `Convert text to natural-sounding speech. Costs ~$0.02/1000 characters.

Powered by ElevenLabs for ultra-realistic voices:
- Natural intonation and pacing
- Multiple voice options
- Adjustable speed
- Multiple output formats

Perfect for:
- Creating voiceovers
- Audiobook production
- Accessibility features
- Content narration`,
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to convert to speech (max 5000 characters)',
        },
        voice: {
          type: 'string',
          description: 'Voice ID or name (e.g., "rachel", "josh", "bella"). Leave empty for default.',
        },
        format: {
          type: 'string',
          description: 'Output audio format',
          enum: ['mp3', 'wav', 'ogg', 'flac'],
        },
        speed: {
          type: 'number',
          description: 'Speech speed multiplier (0.5-2.0, default 1.0)',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'x402_transcribe',
    description: `Transcribe audio to text. Costs ~$0.001/minute.

Powered by Whisper for accurate transcription:
- Supports 99+ languages
- Automatic language detection
- Optional timestamp generation
- High accuracy even with background noise

Perfect for:
- Meeting transcription
- Podcast show notes
- Video subtitles
- Interview documentation`,
    inputSchema: {
      type: 'object',
      properties: {
        audioUrl: {
          type: 'string',
          description: 'URL to the audio file (mp3, wav, m4a, etc.)',
        },
        language: {
          type: 'string',
          description: 'Language code (e.g., "en", "es", "fr"). Auto-detected if not specified.',
        },
        timestamps: {
          type: 'boolean',
          description: 'Include word-level timestamps in output',
        },
      },
      required: ['audioUrl'],
    },
  },
  {
    name: 'x402_clone_voice',
    description: `Clone a voice from audio samples. Costs ~$1.00/voice.

Create a custom voice from audio samples:
- Minimum 1 sample, recommended 3-5 for best quality
- Samples should be 30 seconds to 5 minutes each
- Clear audio with minimal background noise works best

The cloned voice can then be used with x402_text_to_speech.

Note: Ensure you have rights to clone the voice. Do not clone voices without consent.`,
    inputSchema: {
      type: 'object',
      properties: {
        audioSamples: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs to audio samples of the voice to clone',
        },
        name: {
          type: 'string',
          description: 'Name for the cloned voice (for reference)',
        },
        description: {
          type: 'string',
          description: 'Optional description of the voice characteristics',
        },
      },
      required: ['audioSamples', 'name'],
    },
  },
  {
    name: 'x402_audio_cleanup',
    description: `Clean up audio by removing noise and normalizing levels. Costs ~$0.01/minute.

Enhance audio quality:
- Remove background noise
- Remove background music
- Normalize volume levels
- Reduce echo and reverb

Perfect for:
- Cleaning up recordings
- Improving podcast quality
- Enhancing voice messages
- Preparing audio for transcription`,
    inputSchema: {
      type: 'object',
      properties: {
        audioUrl: {
          type: 'string',
          description: 'URL to the audio file to clean',
        },
        removeNoise: {
          type: 'boolean',
          description: 'Remove background noise (default: true)',
        },
        removeBackground: {
          type: 'boolean',
          description: 'Remove background music/sounds (default: false)',
        },
        normalize: {
          type: 'boolean',
          description: 'Normalize audio levels (default: true)',
        },
      },
      required: ['audioUrl'],
    },
  },
  {
    name: 'x402_music_generate',
    description: `Generate music from a text description. Costs ~$0.05/30 seconds.

Create original music with AI:
- Describe the mood, instruments, and style
- Generate loops or full tracks
- Various genres supported

Perfect for:
- Background music
- Content creation
- Podcast intros
- Video soundtracks

Note: Generated music is royalty-free for commercial use.`,
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Description of the music (e.g., "upbeat electronic track with synth leads and a driving beat")',
        },
        duration: {
          type: 'number',
          description: 'Duration in seconds (5-300, default 30)',
        },
        genre: {
          type: 'string',
          description: 'Musical genre (e.g., "electronic", "classical", "jazz", "rock")',
        },
      },
      required: ['prompt'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleTextToSpeech(client: X402Client, args: unknown): Promise<string> {
  const input = TextToSpeechInput.parse(args);
  const result = await client.textToSpeech(input);

  const data = result.data as { audioUrl: string; duration: number };

  return `Speech generated successfully!

Audio URL: ${data.audioUrl}
Duration: ${data.duration.toFixed(1)} seconds
Format: ${input.format || 'mp3'}
Voice: ${input.voice || 'default'}
Cost: $${result.cost.toFixed(4)}

The audio URL is temporary and will expire in 24 hours.`;
}

export async function handleTranscribe(client: X402Client, args: unknown): Promise<string> {
  const input = TranscribeInput.parse(args);
  const result = await client.transcribe(input);

  const data = result.data as { text: string; duration: number; segments?: { start: number; end: number; text: string }[] };

  let output = `Transcription complete!

Duration: ${data.duration.toFixed(1)} seconds
Cost: $${result.cost.toFixed(4)}

--- TRANSCRIPT ---
${data.text}
--- END TRANSCRIPT ---`;

  if (data.segments && data.segments.length > 0) {
    output += '\n\n--- TIMESTAMPS ---';
    for (const segment of data.segments) {
      output += `\n[${formatTime(segment.start)} - ${formatTime(segment.end)}] ${segment.text}`;
    }
    output += '\n--- END TIMESTAMPS ---';
  }

  return output;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export async function handleCloneVoice(client: X402Client, args: unknown): Promise<string> {
  const input = CloneVoiceInput.parse(args);
  const result = await client.cloneVoice(input);

  const data = result.data as { voiceId: string };

  return `Voice cloned successfully!

Voice ID: ${data.voiceId}
Voice Name: ${input.name}
Cost: $${result.cost.toFixed(4)}

You can now use this voice ID with x402_text_to_speech:
- voice: "${data.voiceId}"

The voice is saved to your account and can be used indefinitely.`;
}

export async function handleAudioCleanup(client: X402Client, args: unknown): Promise<string> {
  const input = AudioCleanupInput.parse(args);
  const result = await client.audioCleanup(input);

  const data = result.data as { audioUrl: string };

  const appliedFilters = [];
  if (input.removeNoise) appliedFilters.push('noise removal');
  if (input.removeBackground) appliedFilters.push('background removal');
  if (input.normalize) appliedFilters.push('normalization');

  return `Audio cleaned up successfully!

Audio URL: ${data.audioUrl}
Filters Applied: ${appliedFilters.join(', ')}
Cost: $${result.cost.toFixed(4)}

The audio URL is temporary and will expire in 24 hours.`;
}

export async function handleMusicGenerate(client: X402Client, args: unknown): Promise<string> {
  const input = MusicGenerateInput.parse(args);
  const result = await client.musicGenerate(input);

  const data = result.data as { audioUrl: string; duration: number };

  return `Music generated successfully!

Audio URL: ${data.audioUrl}
Duration: ${data.duration.toFixed(1)} seconds
Genre: ${input.genre || 'auto-detected'}
Cost: $${result.cost.toFixed(4)}

This music is royalty-free and can be used commercially.
The audio URL is temporary and will expire in 24 hours.`;
}

// =============================================================================
// Handler Map
// =============================================================================

export const audioHandlers: Record<string, (client: X402Client, args: unknown) => Promise<string>> = {
  x402_text_to_speech: handleTextToSpeech,
  x402_transcribe: handleTranscribe,
  x402_clone_voice: handleCloneVoice,
  x402_audio_cleanup: handleAudioCleanup,
  x402_music_generate: handleMusicGenerate,
};
