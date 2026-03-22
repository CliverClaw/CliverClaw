# Content Pipeline Workflow

This example shows how to create a complete content pipeline using X.402 tools.

## Use Case: Blog Post Creation

We'll create a full blog post with:
1. Research the topic
2. Generate an outline
3. Write the content
4. Create a featured image
5. Generate social media posts
6. Translate for international audiences

Total estimated cost: ~$0.20-0.30

## Step 1: Research the Topic

Use `x402_research_web` to gather current information:

```
Use x402_research_web with:
- query: "latest trends in sustainable technology 2024"
- depth: "detailed"
- maxSources: 10
```

This returns synthesized research with sources for citations.

**Cost: ~$0.02**

## Step 2: Generate Outline

Use `x402_generate_text` to create a structured outline:

```
Use x402_generate_text with:
- prompt: "Create a detailed blog post outline about sustainable technology trends, based on this research: [research from step 1]"
- systemPrompt: "You are an expert content strategist. Create outlines with compelling hooks, clear sections, and calls to action."
- temperature: 0.7
```

**Cost: ~$0.01**

## Step 3: Write the Content

Generate each section of the blog post:

```
Use x402_generate_text with:
- prompt: "Write the introduction for this blog post: [outline]"
- systemPrompt: "You are a professional content writer. Write engaging, SEO-friendly content. Use short paragraphs and clear language."
- maxTokens: 2000
```

Repeat for each section.

**Cost: ~$0.05 total**

## Step 4: Grammar Check

Polish the content:

```
Use x402_grammar_check with:
- text: "[full blog post]"
- style: "formal"
```

**Cost: ~$0.01**

## Step 5: Create Featured Image

Generate a custom featured image:

```
Use x402_generate_image with:
- prompt: "Modern sustainable technology concept, solar panels and wind turbines integrated with smart city, clean design, professional blog header"
- style: "digital-art"
- size: "1920x1080"
```

**Cost: ~$0.03**

## Step 6: Optimize for Web

Optimize the image for web performance:

```
Use x402_optimize_image with:
- imageUrl: "[image from step 5]"
- format: "webp"
- quality: 85
- maxWidth: 1200
```

**Cost: ~$0.005**

## Step 7: Generate Social Media Posts

Create variations for different platforms:

```
Use x402_generate_text with:
- prompt: "Create social media posts for this blog article for: 1) Twitter (280 chars), 2) LinkedIn (longer, professional), 3) Instagram caption. Article: [summary]"
- temperature: 0.8
```

**Cost: ~$0.01**

## Step 8: Translate for International

Translate for target markets:

```
Use x402_translate with:
- text: "[blog post]"
- targetLanguage: "es"  # Spanish

Repeat for other languages: de, fr, ja, zh
```

**Cost: ~$0.02 per language**

## Total Estimated Cost

| Step | Tool | Estimated Cost |
|------|------|----------------|
| Research | x402_research_web | $0.02 |
| Outline | x402_generate_text | $0.01 |
| Content (5 sections) | x402_generate_text | $0.05 |
| Grammar check | x402_grammar_check | $0.01 |
| Featured image | x402_generate_image | $0.03 |
| Image optimization | x402_optimize_image | $0.005 |
| Social posts | x402_generate_text | $0.01 |
| Translation (3 languages) | x402_translate | $0.06 |
| **Total** | | **~$0.20** |

## Full Conversation Example

```
User: Help me create a blog post about sustainable technology trends with a featured image and social media posts.

AI: I'll create a complete content package for you. Let me start by researching current trends.

[Uses x402_research_web - $0.02]

Found 10 great sources. Key trends include:
1. AI-powered energy optimization
2. Carbon capture technology
3. Sustainable manufacturing
...

Now let me create an outline based on this research.

[Uses x402_generate_text - $0.01]

Here's the outline:
- Introduction: The sustainable tech revolution
- Section 1: AI meets green energy
- Section 2: Carbon capture breakthroughs
...

Writing the full blog post now.

[Uses x402_generate_text x5 - $0.05]
[Uses x402_grammar_check - $0.01]

Blog post complete! Now let me create a featured image.

[Uses x402_generate_image - $0.03]
[Uses x402_optimize_image - $0.005]

Beautiful image ready! Finally, social media posts.

[Uses x402_generate_text - $0.01]

All done! Here's your content package:

1. Blog Post (2,500 words)
2. Featured Image (optimized WebP, 145KB)
3. Twitter post: "..."
4. LinkedIn post: "..."
5. Instagram caption: "..."

Total cost: $0.145

Would you like me to translate this for other languages?
```

## Automation Ideas

### Scheduled Content
Set up regular content creation:
```
Every Monday:
1. Research trending topics in your niche
2. Generate 3 blog post ideas
3. Create outlines for each
4. Save for human review
```

### Content Repurposing
Turn one piece into many:
```
From one blog post:
- Create tweet thread
- Generate LinkedIn article
- Make Instagram carousel text
- Create video script
- Generate podcast outline
```

### SEO Enhancement
```
1. Research top-ranking articles
2. Extract common keywords
3. Generate optimized headings
4. Create meta descriptions
```

## Tips

1. **Research first** - Better research = better content
2. **Iterate on drafts** - Regenerate sections that need work
3. **Human review** - AI assists, humans perfect
4. **Save everything** - URLs expire in 24 hours
5. **Batch translations** - More efficient than one at a time
