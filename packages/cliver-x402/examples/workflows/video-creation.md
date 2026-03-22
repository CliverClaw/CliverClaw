# Video Creation Workflow

This example shows how to create a complete video using X.402 tools.

## Overview

We'll create a short explainer video:
1. Generate a script
2. Convert to voiceover
3. Generate video clips
4. Add subtitles

Total estimated cost: ~$0.50-1.00

## Step 1: Generate Script

First, use `x402_generate_text` to create a script:

```
Use x402_generate_text to write a 30-second script about the benefits of AI automation.
Keep it concise and engaging. Include timing markers.

Parameters:
- prompt: "Write a 30-second video script about AI automation benefits"
- systemPrompt: "You are a professional video scriptwriter. Write concise, engaging scripts with timing markers like [0:00-0:05]"
- maxTokens: 1000
- temperature: 0.7
```

Example output:
```
[0:00-0:05] Did you know that AI can save you 10 hours every week?

[0:05-0:15] From automating emails to scheduling meetings, AI assistants handle the boring stuff so you can focus on what matters.

[0:15-0:25] Companies using AI automation report 40% higher productivity and happier employees.

[0:25-0:30] Ready to transform your workflow? The future is automated.
```

**Cost: ~$0.01**

## Step 2: Convert to Voiceover

Use `x402_text_to_speech` to create professional narration:

```
Use x402_text_to_speech to convert this script to speech.

Parameters:
- text: "[the script from step 1]"
- voice: "josh"  # Professional male voice
- format: "mp3"
- speed: 1.0
```

**Cost: ~$0.02**

## Step 3: Generate Video Clips

Generate video clips for each section using `x402_generate_video`:

```
For each section of the script, generate a matching video clip:

Section 1 (0:00-0:05):
x402_generate_video with:
- prompt: "Close-up of a clock with spinning hands, time moving fast, productivity concept"
- duration: 5
- style: "cinematic"

Section 2 (0:05-0:15):
x402_generate_video with:
- prompt: "Person relaxing while multiple screens show automated tasks completing, office setting"
- duration: 10
- style: "corporate"

Section 3 (0:15-0:25):
x402_generate_video with:
- prompt: "Upward trending graph with happy employees in background, success concept"
- duration: 10
- style: "corporate"

Section 4 (0:25-0:30):
x402_generate_video with:
- prompt: "Futuristic office with AI assistants helping workers, optimistic mood"
- duration: 5
- style: "cinematic"
```

**Cost: ~$0.05 x 4 = $0.20 per second, total ~$1.50 for 30 seconds**

## Step 4: Add Subtitles

Add subtitles to your assembled video:

```
Use x402_add_subtitles with:
- videoUrl: "[your assembled video URL]"
- style: "caption"

Or provide custom SRT subtitles for precise timing.
```

**Cost: ~$0.02**

## Total Estimated Cost

| Step | Tool | Estimated Cost |
|------|------|----------------|
| Script | x402_generate_text | $0.01 |
| Voiceover | x402_text_to_speech | $0.02 |
| Video clips | x402_generate_video | $1.50 |
| Subtitles | x402_add_subtitles | $0.02 |
| **Total** | | **~$1.55** |

## Optimizing Costs

1. **Shorter duration** - 15-second videos cost half as much
2. **Reuse clips** - Generate one clip and use AI to vary it
3. **Stock footage** - Use x402_scrape_search to find free alternatives
4. **Estimate first** - Use x402_estimate_cost before expensive operations

## Full Conversation Example

```
User: I need to create a 30-second explainer video about our new product launch.

AI: I'll help you create this video step by step. First, let me check your balance.

[Uses x402_get_balance]

You have $5.00 available. A 30-second video typically costs $1-2. Let's proceed.

First, I'll generate a script for your product launch video.

[Uses x402_generate_text]
...

Great script! Now let me convert it to a professional voiceover.

[Uses x402_text_to_speech]
...

Now I'll generate the video clips. This is the most expensive part (~$1.50).

[Uses x402_generate_video x4]
...

Finally, let me add captions for accessibility.

[Uses x402_add_subtitles]
...

Your video is ready! Total cost: $1.53

Here are your deliverables:
- Script: [text]
- Voiceover: [audio URL]
- Video clips: [video URLs]
- Final video with subtitles: [video URL]
```

## Tips

1. **Review each step** - Check the script before generating voiceover
2. **Iterate on prompts** - Refine video prompts if results aren't right
3. **Save URLs** - Download files as URLs expire in 24 hours
4. **Use x402_estimate_cost** - Check costs before video generation
