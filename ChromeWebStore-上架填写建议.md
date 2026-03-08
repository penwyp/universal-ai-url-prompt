# Chrome Web Store 上架填写建议（针对当前项目）

> 生成日期：2026-03-01  
> 项目路径：`/Users/penwyp/Dat/universal-ai-url-prompt`  
> 目标：提交 `Universal AI URL Prompt` 到 Chrome Web Store

## 0. 当前状态核对（基于现有代码）

以下项目已和代码一致，可直接按这个口径填写：

1. `author`：`penwyp`（非占位值）。
2. `homepage_url`：`https://github.com/penwyp/universal-ai-url-prompt`。
3. 权限：`webNavigation` + `storage`。
4. 已配置 `options_page`：`options.html`（支持按平台开启/关闭）。
5. 支持平台数：20。
6. `content_scripts.matches` 当前共 41 条匹配规则。

提交前仍建议确认：

1. 版本号是否从 `0.0.1` 提升到首发版本（如 `1.0.0`）。
2. Store listing 的描述、截图、隐私政策，是否已体现“平台开关（Options）”能力。
3. CWS Privacy 问卷里是否已解释 `storage` 用途。

## 1. CWS Dashboard 填写建议（逐 Tab）

## 1.1 Package

- 上传包：项目根目录打包 ZIP（包含 `manifest.json`、`content.js`、`platforms/`、`icons/`、`options.html`、`options.js`、`options.css` 等）。
- 版本号：建议在首发前改成对外语义化版本（如 `1.0.0`）。
- 开发者账号费用：以 CWS Dashboard 实际页面显示为准。

## 1.2 Store listing

### 字段建议

- `Name`：`Universal AI URL Prompt`
- `Summary`（<=132 字符）可用：

```text
Inject prompts by URL on 20 major AI web platforms, with optional auto-send and per-platform toggles.
```

- `Category`：优先 `Workflow and planning`（备选 `Developer Tools`）。
- `Language`：默认英文；建议同步提供 `en/es/zh_CN/zh_TW` 本地化 listing 文案。

### 长描述（可直接粘贴，英文版）

```text
Universal AI URL Prompt helps you start AI chats from a shareable URL.

Key capabilities:
- Prefill prompts via URL parameters: prompt, q, p
- Auto-send by default, with autosend=0 to disable
- Per-platform enable/disable toggles in Extension Options
- Works with delayed SPA input rendering through retry scheduling
- Local-only execution: no prompt upload or cloud sync

Supported platform groups:
- ChatGPT, Gemini, Claude, DeepSeek, Copilot
- Doubao, Perplexity, Kimi, Meta AI, Yuanbao
- Qwen, Grok, Wenxiaoyan, Poe, Mistral Le Chat
- ChatGLM, Baichuan, DuckDuckGo AI, HuggingChat, Z.ai

Typical use cases:
- Share reproducible prompts with teammates
- Build no-code AI workflow links in docs and runbooks
- Launch platform-specific prompt templates for repeated tasks
```

### 图像素材建议（按官方尺寸）

至少准备：

1. `128x128` 扩展图标（已有）
2. `Small promo tile`：`440x280`
3. `Screenshots`：至少 1 张，建议 3-5 张  
   尺寸限制：最小 `640x400`（推荐 `1280x800`），最大 `3840x2160`
4. `Large promo tile`：`920x680`（可选）
5. `Marquee promo tile`：`1400x560`（可选）

截图建议补这 4 类：

1. URL 带 `prompt` 自动填充前后对比
2. `autosend=0` 与默认自动发送对比
3. 选项页平台开关（开启/关闭状态）
4. 多平台分组展示（避免一屏塞太多品牌）

## 1.3 Privacy（重点）

### Single purpose（可直接填）

```text
This extension has one single purpose: prefill AI chat input boxes from URL parameters on supported AI websites, with optional auto-send and user-controlled per-platform enable/disable settings.
```

### 权限用途说明（建议文案）

- `webNavigation`：

```text
Used to detect navigation and route changes on supported single-page AI websites, so prompt injection runs at the correct time.
```

- `storage`：

```text
Used to store user preferences for per-platform enable/disable switches in the extension options page.
```

- Host access（`content_scripts.matches` 里的域名）：

```text
Used only on explicitly listed AI domains to read URL parameters and write prompt text into the page input box.
```

### 用户数据声明（按当前代码形态建议）

当前实现下，Privacy 问卷建议：

1. 不收集个人数据到开发者服务器
2. 不出售或共享给第三方数据经纪
3. 不用于广告画像、授信等用途
4. 仅在本地处理提示词；仅保存平台开关配置到扩展存储

并确保 [privacy.md](./privacy.md) 与问卷答案完全一致。

## 1.4 Distribution

- `Pricing`：`Free`
- `Visibility`：
  - 首次提审建议先 `Unlisted`
  - 审核通过后切 `Public`
- `Regions`：默认全量地区（如无额外合规限制）

## 1.5 Test instructions（建议填写）

可直接粘贴：

```text
1) Install the extension and keep default settings.
2) Open: https://duck.ai/?prompt=Review%20test%20message&autosend=0
3) Expected: the prompt input is prefilled with "Review test message" and is NOT auto-submitted.
4) Open: https://duck.ai/?prompt=Review%20autosend%20message
5) Expected: the prompt is prefilled and auto-submitted.
6) Open the extension options page and disable one platform (for example, ChatGPT).
7) Open that platform URL with prompt parameter.
8) Expected: no prompt injection and no auto-send on the disabled platform.
9) Open an unsupported website (for example https://example.com).
10) Expected: extension does nothing.

Notes:
- The extension runs locally in the browser.
- No prompt or personal data is transmitted to developer servers.
- The only persisted setting is per-platform on/off preference in extension storage.
```

## 2. 审核风险点清单（提交前自检）

1. 元数据准确：描述、截图、隐私政策需包含“平台开关”能力，不得与实际行为不一致。
2. 单一用途：所有功能仍围绕“URL 提示词注入”。
3. 最小权限：仅 `webNavigation` + `storage` + 必要 host 访问；并在 Privacy 页面解释用途。
4. 无远程托管代码：不从外部拉取并执行脚本。
5. 文案合规：不误导、不冒充、不堆砌关键词，品牌名分组展示。

## 3. 官方来源

1. Publish in the Chrome Web Store  
   https://developer.chrome.com/docs/webstore/publish
2. Store listing requirements  
   https://developer.chrome.com/docs/webstore/listing-requirements
3. Dashboard - Complete your store listing  
   https://developer.chrome.com/docs/webstore/cws-dashboard-listing
4. Dashboard - Complete your privacy practices  
   https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
5. Dashboard - Set up distribution  
   https://developer.chrome.com/docs/webstore/cws-dashboard-distribution
6. Dashboard - Add test instructions  
   https://developer.chrome.com/docs/webstore/cws-dashboard-test-instructions
7. Program Policies（Single Purpose / Metadata / Remote hosted code）  
   https://developer.chrome.com/docs/webstore/program-policies
8. One Single Purpose policy  
   https://developer.chrome.com/docs/webstore/program-policies/policies#single-purpose
9. Images for the Chrome Web Store  
   https://developer.chrome.com/docs/webstore/images
10. Best practices for your listing  
   https://developer.chrome.com/docs/webstore/best-practices

## 4. 可直接复制到 CWS 的最终文案

## 4.1 Store listing

### Name

```text
Universal AI URL Prompt
```

### Summary（<=132 chars）

```text
Inject prompts by URL on 20 major AI web platforms, with optional auto-send and per-platform toggles.
```

### Category

```text
Workflow and planning
```

### Description（English）

```text
Universal AI URL Prompt helps you start AI chats from a shareable URL.

Key capabilities:
- Prefill prompts via URL parameters: prompt, q, p
- Auto-send by default, with autosend=0 to disable
- Per-platform enable/disable toggles in Extension Options
- Works with delayed SPA input rendering through retry scheduling
- Local-only execution: no prompt upload or cloud sync

Supported platform groups:
- ChatGPT, Gemini, Claude, DeepSeek, Copilot
- Doubao, Perplexity, Kimi, Meta AI, Yuanbao
- Qwen, Grok, Wenxiaoyan, Poe, Mistral Le Chat
- ChatGLM, Baichuan, DuckDuckGo AI, HuggingChat, Z.ai

Typical use cases:
- Share reproducible prompts with teammates
- Build no-code AI workflow links in docs and runbooks
- Launch platform-specific prompt templates for repeated tasks
```

## 4.2 Privacy practices

### Single purpose

```text
This extension has one single purpose: prefill AI chat input boxes from URL parameters on supported AI websites, with optional auto-send and user-controlled per-platform enable/disable settings.
```

### Permission justification: webNavigation

```text
Used to detect navigation and route changes on supported single-page AI websites, so prompt injection runs at the correct time.
```

### Permission justification: storage

```text
Used to store user preferences for per-platform enable/disable switches in the extension options page.
```

### Host access justification

```text
Used only on explicitly listed AI domains to read URL parameters and write prompt text into the page input box.
```

## 4.3 Test instructions

```text
1) Install the extension and keep default settings.
2) Open: https://duck.ai/?prompt=Review%20test%20message&autosend=0
3) Expected: the prompt input is prefilled with "Review test message" and is NOT auto-submitted.
4) Open: https://duck.ai/?prompt=Review%20autosend%20message
5) Expected: the prompt is prefilled and auto-submitted.
6) Open the extension options page and disable one platform (for example, ChatGPT).
7) Open that platform URL with prompt parameter.
8) Expected: no prompt injection and no auto-send on the disabled platform.
9) Open an unsupported website (for example https://example.com).
10) Expected: extension does nothing.

Notes:
- The extension runs locally in the browser.
- No prompt or personal data is transmitted to developer servers.
- The only persisted setting is per-platform on/off preference in extension storage.
```

## 4.4 Store listing（zh-CN 本地化可直接粘贴）

### Name（zh-CN）

```text
Universal AI URL Prompt
```

### Summary（zh-CN，<=132 chars）

```text
通过 URL 在 20 个主流 AI 平台注入提示词，支持可选自动发送与按平台开关控制。
```

### Description（zh-CN）

```text
Universal AI URL Prompt 可让你通过一个可分享的链接，直接在 AI 对话页面预填提示词。

核心能力：
- 支持通过 URL 参数注入提示词：prompt、q、p
- 默认自动发送，可通过 autosend=0 关闭
- 支持在扩展选项页按平台开启/关闭注入能力
- 针对 SPA 场景做了延迟渲染重试与调度
- 本地执行，不上传提示词，不做云端同步

支持平台分组：
- ChatGPT、Gemini、Claude、DeepSeek、Copilot
- 豆包、Perplexity、Kimi、Meta AI、元宝
- 通义千问、Grok、文小言、Poe、Mistral Le Chat
- ChatGLM、百川、DuckDuckGo AI、HuggingChat、Z.ai

典型使用场景：
- 给团队分享可复现的提示词链接
- 在文档/Runbook 中构建无代码 AI 工作流入口
- 快速触发平台化的固定模板任务
```

## 4.5 Privacy practices（zh-CN 备用文案）

### Single purpose（zh-CN）

```text
本扩展的唯一用途是：在已支持的 AI 网站中，根据 URL 参数预填聊天输入框内容，并可按需自动发送；同时允许用户通过选项页按平台开启或关闭该能力。
```

### 权限用途说明：webNavigation（zh-CN）

```text
用于在已支持的单页 AI 网站中检测导航和路由变化，确保在正确时机执行提示词注入。
```

### 权限用途说明：storage（zh-CN）

```text
用于保存用户在选项页配置的“按平台开启/关闭”偏好设置。
```

### Host 访问说明（zh-CN）

```text
仅在扩展清单中明确列出的 AI 域名上运行，用于读取 URL 参数并将提示词写入页面输入框。
```

## 4.6 Test instructions（zh-CN 备用文案）

```text
1）安装扩展，保持默认设置。
2）打开：https://duck.ai/?prompt=Review%20test%20message&autosend=0
3）预期：输入框被填入“Review test message”，且不会自动发送。
4）打开：https://duck.ai/?prompt=Review%20autosend%20message
5）预期：输入框被填入对应内容，并自动发送。
6）打开扩展选项页，关闭某个平台（例如 ChatGPT）。
7）打开该平台并携带 prompt 参数的 URL。
8）预期：该已关闭平台上不会注入提示词，也不会自动发送。
9）打开一个不支持的网站（如 https://example.com）。
10）预期：扩展不执行任何操作。

备注：
- 扩展逻辑均在浏览器本地运行。
- 不会将提示词或个人数据传输到开发者服务器。
- 持久化存储的数据仅包含按平台开关偏好。
```
