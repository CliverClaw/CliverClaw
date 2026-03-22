# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-12

### Added

- Initial release of @cliver-x402
- **30+ tools** across 7 categories:
  - Visual (5): generate_image, upscale_image, edit_image, optimize_image, remove_background
  - Audio (5): text_to_speech, transcribe, clone_voice, audio_cleanup, music_generate
  - Video (4): generate_video, edit_video, video_to_gif, add_subtitles
  - Content (5): generate_text, research_web, summarize, translate, grammar_check
  - Data (4): scrape_url, scrape_search, extract_data, analyze_data
  - Social (4): analyze_tiktok, analyze_twitter, analyze_youtube, trending_topics
  - Account (3): get_balance, get_usage, estimate_cost
- **X402Client** - HTTP client for direct API access
- **MCP Server** - Full MCP protocol implementation
- **CLI** - `x402-mcp <api-key>` entry point
- **Error handling** - Helpful error messages with recovery suggestions
- **Retry logic** - Automatic retries for transient failures
- **TypeScript** - Full type definitions
- **Documentation** - Comprehensive README and examples
- **Tests** - Unit tests for client, tools, and errors

### Features

- 3 free API calls for new users (no credit card required)
- All services at cost (no markup)
- Credits never expire
- Works with Claude Desktop, Cursor, and any MCP client
- Environment variable support (`CLIVER_API_KEY`)
- Custom API URL support (`CLIVER_API_URL`)

### Security

- API key validation
- Secure key storage recommendations
- No plaintext key logging

---

## Future Releases

### Planned for 1.1.0

- Streaming support for long-running operations
- Webhook notifications
- Batch API calls
- Additional voice options
- Video concatenation tool

### Planned for 2.0.0

- Multi-model support (GPT-4, Gemini)
- Custom model fine-tuning
- Team accounts and shared credits
- Usage analytics dashboard
- SDK for Python and Go
