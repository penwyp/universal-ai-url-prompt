# Universal AI URL Prompt

Inject prompts into major AI web chat boxes through URL parameters, with optional auto-send.

中文文档: [README.zh-CN.md](./README.zh-CN.md)

## Overview

`Universal AI URL Prompt` is a browser extension for reproducible AI workflows.
You can share a single URL and let the target AI page open with a prefilled prompt, then auto-submit if needed.

## Key Features

- URL-based prompt injection with `?prompt=`, `?q=`, and `?p=`
- Auto-send enabled by default, with `?autosend=0` to disable
- Per-platform enable/disable switches in the extension Options page
- Send-button detection for English, Chinese, Japanese, and Spanish
- SPA-aware retry and scheduling for delayed input rendering
- Platform-isolated configs with a shared runtime for easier maintenance

## Supported Platforms (20)

- ChatGPT, Gemini, Claude, DeepSeek, Microsoft Copilot
- Doubao, Perplexity, Kimi, Meta AI, Tencent Yuanbao
- Qwen, Grok, Wenxiaoyan, Poe, Mistral Le Chat
- ChatGLM, Baichuan, DuckDuckGo AI, HuggingChat, Z.ai

## URL Parameters

| Parameter | Purpose | Example |
| --- | --- | --- |
| `prompt` | Primary prompt field | `?prompt=Write%20a%20plan` |
| `q` | Prompt alias for some sites | `?q=Explain%20RAG` |
| `p` | Prompt alias used by some sites (such as Kimi) | `?p=%E5%AE%89%E5%8D%93` |
| `autosend=0` | Disable auto-send | `?prompt=Draft%20PRD&autosend=0` |

## Usage Examples

- ChatGPT: `https://chatgpt.com/?prompt=Write%20a%20plan`
- Gemini: `https://gemini.google.com/app?prompt=你好`
- DeepSeek: `https://chat.deepseek.com/?q=Explain%20RAG`
- DeepSeek (new domain): `https://www.deepseek.com/?prompt=Explain%20RAG`
- Kimi: `https://www.kimi.com/?p=%E5%AE%89%E5%8D%93`
- HuggingChat: `https://huggingface.co/chat/?prompt=Write%20a%20plan`
- Claude without auto-send: `https://claude.ai/?prompt=Draft%20PRD&autosend=0`

## Installation (Chrome)

1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select this project directory
5. (Optional) Open extension `Details` -> `Extension options` to choose enabled platforms

## Development

```bash
npm install
npx playwright install chromium
npm run check:platforms
npm run build:manifest
npm run test:e2e
```

Additional commands:

- `npm run test:e2e:headed`: run tests in headed mode
- `npm run test:e2e:ui`: run tests in Playwright UI mode

## Project Structure

- `platforms/_registry.js`: platform registration and schema validation
- `platforms/*.js`: one platform definition per file
- `content.js`: shared runtime (URL parsing, injection, auto-send flow)
- `scripts/platform-loader.js`: shared platform-definition loader
- `scripts/generate-manifest.js`: generate `manifest.json` from platform files
- `scripts/validate-platform-contract.js`: validate platform definitions and E2E mappings

## Privacy

This extension does not send data to developer-owned servers.
It keeps a short-lived in-memory prompt cache (up to about 3 minutes) in the extension runtime for SPA navigation handoff.
It stores platform on/off preferences in Chrome extension storage (`chrome.storage.sync` or local fallback) so your choices persist.
When auto-send is enabled, prompt content is sent only to the destination AI website as part of normal page usage.

## Contributing

Issues and pull requests are welcome.
Before submitting changes, run `npm run check:platforms` and `npm run test:e2e`.
See [CONTRIBUTING.md](./CONTRIBUTING.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [SECURITY.md](./SECURITY.md) for project policies.

## License

[MIT](./LICENSE)

## Acknowledgements

Inspired by [gemini-url-prompt](https://github.com/elliot79313/gemini-url-prompt).
