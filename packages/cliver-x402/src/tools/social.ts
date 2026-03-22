/**
 * Social Tools
 *
 * Social media analysis tools for TikTok, Twitter/X, YouTube, and trending topics.
 */

import { z } from 'zod';
import type { X402Client } from '../client.js';
import type { ToolDefinition } from '../types.js';

// =============================================================================
// Input Schemas
// =============================================================================

export const AnalyzeTiktokInput = z.object({
  url: z.string().url().optional(),
  username: z.string().optional(),
  hashtag: z.string().optional(),
}).refine(data => data.url || data.username || data.hashtag, {
  message: 'At least one of url, username, or hashtag is required',
});

export const AnalyzeTwitterInput = z.object({
  url: z.string().url().optional(),
  username: z.string().optional(),
  query: z.string().optional(),
}).refine(data => data.url || data.username || data.query, {
  message: 'At least one of url, username, or query is required',
});

export const AnalyzeYoutubeInput = z.object({
  url: z.string().url().optional(),
  channelId: z.string().optional(),
  query: z.string().optional(),
}).refine(data => data.url || data.channelId || data.query, {
  message: 'At least one of url, channelId, or query is required',
});

export const TrendingTopicsInput = z.object({
  category: z.string().optional(),
  region: z.string().optional(),
  platform: z.enum(['twitter', 'tiktok', 'youtube', 'all']).optional().default('all'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const socialTools: ToolDefinition[] = [
  {
    name: 'x402_analyze_tiktok',
    description: `Analyze TikTok content, users, or hashtags. Costs ~$0.03/analysis.

Get insights from TikTok:
- Video analytics (views, likes, comments, shares)
- Profile analytics (followers, engagement rate)
- Hashtag performance

Perfect for:
- Influencer research
- Content strategy
- Trend analysis
- Competitive intelligence

Provide one of: video URL, username, or hashtag.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'TikTok video URL (e.g., "https://tiktok.com/@user/video/123")',
        },
        username: {
          type: 'string',
          description: 'TikTok username (without @)',
        },
        hashtag: {
          type: 'string',
          description: 'Hashtag to analyze (without #)',
        },
      },
      required: [],
    },
  },
  {
    name: 'x402_analyze_twitter',
    description: `Analyze Twitter/X content, users, or search results. Costs ~$0.03/analysis.

Get insights from Twitter/X:
- Tweet analytics (likes, retweets, replies)
- Profile analytics (followers, engagement)
- Search/topic analysis

Perfect for:
- Brand monitoring
- Sentiment analysis
- Influencer discovery
- News tracking

Provide one of: tweet URL, username, or search query.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Tweet URL (e.g., "https://twitter.com/user/status/123")',
        },
        username: {
          type: 'string',
          description: 'Twitter username (without @)',
        },
        query: {
          type: 'string',
          description: 'Search query to analyze',
        },
      },
      required: [],
    },
  },
  {
    name: 'x402_analyze_youtube',
    description: `Analyze YouTube content, channels, or search results. Costs ~$0.03/analysis.

Get insights from YouTube:
- Video analytics (views, likes, comments)
- Channel analytics (subscribers, total views)
- Search performance

Perfect for:
- Content research
- Competitor analysis
- Trend discovery
- Creator insights

Provide one of: video URL, channel ID, or search query.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'YouTube video URL',
        },
        channelId: {
          type: 'string',
          description: 'YouTube channel ID',
        },
        query: {
          type: 'string',
          description: 'Search query to analyze',
        },
      },
      required: [],
    },
  },
  {
    name: 'x402_trending_topics',
    description: `Get trending topics across social platforms. Costs ~$0.02/query.

Discover what's trending:
- Cross-platform trends
- Category-specific trends
- Regional trending topics

Perfect for:
- Content planning
- News monitoring
- Market research
- Viral content discovery`,
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category filter (e.g., "tech", "entertainment", "sports")',
        },
        region: {
          type: 'string',
          description: 'Region code (e.g., "US", "UK", "global")',
        },
        platform: {
          type: 'string',
          description: 'Platform to check',
          enum: ['twitter', 'tiktok', 'youtube', 'all'],
        },
      },
      required: [],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleAnalyzeTiktok(client: X402Client, args: unknown): Promise<string> {
  const input = AnalyzeTiktokInput.parse(args);
  const result = await client.analyzeTiktok(input);

  const data = result.data as {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    followers?: number;
    posts?: { url: string; views: number; likes: number }[];
  };

  const analysisType = input.url ? 'Video' : input.username ? 'Profile' : 'Hashtag';
  const target = input.url || input.username || input.hashtag;

  let output = `TikTok ${analysisType} Analysis Complete!

Target: ${target}
Cost: $${result.cost.toFixed(4)}

--- METRICS ---`;

  if (data.views !== undefined) output += `\nViews: ${formatNumber(data.views)}`;
  if (data.likes !== undefined) output += `\nLikes: ${formatNumber(data.likes)}`;
  if (data.comments !== undefined) output += `\nComments: ${formatNumber(data.comments)}`;
  if (data.shares !== undefined) output += `\nShares: ${formatNumber(data.shares)}`;
  if (data.followers !== undefined) output += `\nFollowers: ${formatNumber(data.followers)}`;

  output += '\n--- END METRICS ---';

  if (data.posts && data.posts.length > 0) {
    output += '\n\n--- TOP POSTS ---';
    for (let i = 0; i < Math.min(data.posts.length, 5); i++) {
      const post = data.posts[i];
      output += `\n${i + 1}. ${post.url}`;
      output += `\n   Views: ${formatNumber(post.views)} | Likes: ${formatNumber(post.likes)}`;
    }
    output += '\n--- END POSTS ---';
  }

  return output;
}

export async function handleAnalyzeTwitter(client: X402Client, args: unknown): Promise<string> {
  const input = AnalyzeTwitterInput.parse(args);
  const result = await client.analyzeTwitter(input);

  const data = result.data as {
    followers?: number;
    following?: number;
    tweets?: { text: string; likes: number; retweets: number }[];
  };

  const analysisType = input.url ? 'Tweet' : input.username ? 'Profile' : 'Search';
  const target = input.url || input.username || input.query;

  let output = `Twitter/X ${analysisType} Analysis Complete!

Target: ${target}
Cost: $${result.cost.toFixed(4)}

--- METRICS ---`;

  if (data.followers !== undefined) output += `\nFollowers: ${formatNumber(data.followers)}`;
  if (data.following !== undefined) output += `\nFollowing: ${formatNumber(data.following)}`;

  output += '\n--- END METRICS ---';

  if (data.tweets && data.tweets.length > 0) {
    output += '\n\n--- TWEETS ---';
    for (let i = 0; i < Math.min(data.tweets.length, 5); i++) {
      const tweet = data.tweets[i];
      const preview = tweet.text.length > 100 ? tweet.text.substring(0, 100) + '...' : tweet.text;
      output += `\n${i + 1}. "${preview}"`;
      output += `\n   Likes: ${formatNumber(tweet.likes)} | Retweets: ${formatNumber(tweet.retweets)}`;
    }
    output += '\n--- END TWEETS ---';
  }

  return output;
}

export async function handleAnalyzeYoutube(client: X402Client, args: unknown): Promise<string> {
  const input = AnalyzeYoutubeInput.parse(args);
  const result = await client.analyzeYoutube(input);

  const data = result.data as {
    subscribers?: number;
    views?: number;
    videos?: { title: string; url: string; views: number }[];
  };

  const analysisType = input.url ? 'Video' : input.channelId ? 'Channel' : 'Search';
  const target = input.url || input.channelId || input.query;

  let output = `YouTube ${analysisType} Analysis Complete!

Target: ${target}
Cost: $${result.cost.toFixed(4)}

--- METRICS ---`;

  if (data.subscribers !== undefined) output += `\nSubscribers: ${formatNumber(data.subscribers)}`;
  if (data.views !== undefined) output += `\nTotal Views: ${formatNumber(data.views)}`;

  output += '\n--- END METRICS ---';

  if (data.videos && data.videos.length > 0) {
    output += '\n\n--- VIDEOS ---';
    for (let i = 0; i < Math.min(data.videos.length, 5); i++) {
      const video = data.videos[i];
      output += `\n${i + 1}. ${video.title}`;
      output += `\n   ${video.url}`;
      output += `\n   Views: ${formatNumber(video.views)}`;
    }
    output += '\n--- END VIDEOS ---';
  }

  return output;
}

export async function handleTrendingTopics(client: X402Client, args: unknown): Promise<string> {
  const input = TrendingTopicsInput.parse(args);
  const result = await client.trendingTopics(input);

  const data = result.data as { topics: { name: string; volume: number; platform: string }[] };

  let output = `Trending Topics Retrieved!

Platform: ${input.platform}
${input.category ? `Category: ${input.category}` : ''}
${input.region ? `Region: ${input.region}` : ''}
Cost: $${result.cost.toFixed(4)}

--- TRENDING TOPICS ---`;

  for (let i = 0; i < data.topics.length; i++) {
    const topic = data.topics[i];
    output += `\n${i + 1}. ${topic.name}`;
    output += `\n   Platform: ${topic.platform} | Volume: ${formatNumber(topic.volume)}`;
  }

  output += '\n--- END TOPICS ---';

  return output;
}

// =============================================================================
// Helpers
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// =============================================================================
// Handler Map
// =============================================================================

export const socialHandlers: Record<string, (client: X402Client, args: unknown) => Promise<string>> = {
  x402_analyze_tiktok: handleAnalyzeTiktok,
  x402_analyze_twitter: handleAnalyzeTwitter,
  x402_analyze_youtube: handleAnalyzeYoutube,
  x402_trending_topics: handleTrendingTopics,
};
