# Title

[Showoff] I built a Chrome extension to send prompts to Gemini / Claude / ChatGPT right from the address bar

Post flair: Showoff

# Post

I got tired of constantly switching between AI tabs, so I built an open-source Chrome extension: **Universal AI URL Prompt**.

It injects prompts from URL params into AI chat inputs and can auto-send them. It currently supports 20+ platforms, including ChatGPT, Gemini, Claude, DeepSeek, and Perplexity.

The key setup is using it with **Chrome Search Engine shortcuts**:

```text
Keyword: g
URL: https://gemini.google.com/app?prompt=%s

Keyword: c
URL: https://claude.ai/?prompt=%s
```

Then type directly in Chrome's address bar:

```text
g What is Opus?
c What is Gemini?
```

No copy/paste, no extra clicks, just jump straight into the target model with your prompt.

Project:  
https://github.com/penwyp/universal-ai-url-prompt

Feedback and PRs are welcome.
