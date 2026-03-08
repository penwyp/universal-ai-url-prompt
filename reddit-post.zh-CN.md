# 标题

[Showoff] 我做了一个 Chrome 扩展：从地址栏直接把提示词发到 Gemini / Claude / ChatGPT

帖子标签（Post Flair）：Showoff

# 正文

我经常在不同 AI 标签页之间来回切换，操作很碎，所以做了一个开源 Chrome 扩展：**Universal AI URL Prompt**。

它可以把 URL 参数里的提示词自动注入到 AI 对话框，并支持自动发送。目前已支持 20+ 平台，包括 ChatGPT、Gemini、Claude、DeepSeek、Perplexity 等。

核心用法是和 **Chrome Search Engine（站点搜索）** 一起使用：

```text
Keyword: g
URL: https://gemini.google.com/app?prompt=%s

Keyword: c
URL: https://claude.ai/?prompt=%s
```

然后你可以直接在 Chrome 地址栏输入：

```text
g What is Opus?
c What is Gemini?
```

这样就不用先打开站点、复制粘贴再点发送，直接从地址栏跳到目标模型并带上提示词。

项目地址：  
https://github.com/penwyp/universal-ai-url-prompt

欢迎反馈和 PR。
