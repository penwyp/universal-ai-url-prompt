# Universal AI URL Prompt

通过 URL 参数把提示词注入到主流 AI Web 对话框，并可自动发送。

English docs: [README.md](./README.md)

## 项目简介

`Universal AI URL Prompt` 是一个用于构建可复现 AI 工作流的浏览器扩展。
你可以直接分享一个 URL，让目标 AI 页面自动填入提示词，并按需自动提交。

## 核心特性

- 支持通过 `?prompt=`、`?q=`、`?p=` 注入提示词
- 默认自动发送，支持 `?autosend=0` 关闭
- 提供选项页，可按平台自由开启/关闭注入能力
- 内置英文/中文/日语/西班牙语的发送按钮识别
- 面向 SPA 的输入框轮询与重试调度
- 采用“平台独立配置 + 共享运行时”架构，便于维护和协作

## 已支持平台（20）

- ChatGPT、Gemini、Claude、DeepSeek、Microsoft Copilot
- 豆包、Perplexity、Kimi、Meta AI、腾讯元宝
- 通义千问、Grok、文小言、Poe、Mistral Le Chat
- ChatGLM、百川、DuckDuckGo AI、HuggingChat、Z.ai

## URL 参数说明

| 参数 | 作用 | 示例 |
| --- | --- | --- |
| `prompt` | 主要提示词参数 | `?prompt=Write%20a%20plan` |
| `q` | 部分站点支持的提示词别名 | `?q=Explain%20RAG` |
| `p` | 部分站点支持的提示词别名（如 Kimi） | `?p=%E5%AE%89%E5%8D%93` |
| `autosend=0` | 关闭自动发送 | `?prompt=Draft%20PRD&autosend=0` |

## 使用示例

- ChatGPT: `https://chatgpt.com/?prompt=Write%20a%20plan`
- Gemini: `https://gemini.google.com/app?prompt=你好`
- DeepSeek: `https://chat.deepseek.com/?q=Explain%20RAG`
- DeepSeek（新域名）: `https://www.deepseek.com/?prompt=Explain%20RAG`
- Kimi: `https://www.kimi.com/?p=%E5%AE%89%E5%8D%93`
- HuggingChat: `https://huggingface.co/chat/?prompt=Write%20a%20plan`
- Claude（不自动发送）: `https://claude.ai/?prompt=Draft%20PRD&autosend=0`

## 安装方式（Chrome）

1. 打开 `chrome://extensions/`
2. 开启开发者模式
3. 点击“加载已解压的扩展程序”
4. 选择当前项目目录
5. （可选）进入扩展“详情”->“扩展程序选项”，配置平台开关

## 开发与测试

```bash
npm install
npx playwright install chromium
npm run check:platforms
npm run build:manifest
npm run test:e2e
```

额外命令：

- `npm run test:e2e:headed`：有界面模式运行
- `npm run test:e2e:ui`：Playwright UI 模式

## 项目结构

- `platforms/_registry.js`：平台注册与 schema 校验
- `platforms/*.js`：每个平台一个定义文件
- `content.js`：共享运行时（参数解析、注入、自动发送流程）
- `scripts/platform-loader.js`：平台定义加载器
- `scripts/generate-manifest.js`：基于平台文件生成 `manifest.json`
- `scripts/validate-platform-contract.js`：校验平台定义与 E2E 映射

## 隐私说明

本扩展不会把数据传输到开发者服务器。
为支持 SPA 导航衔接，扩展运行时会在内存中短时缓存提示词参数（最长约 3 分钟，不落盘）。
平台开关配置会保存在浏览器扩展存储中（优先 `chrome.storage.sync`，不可用时回退本地存储），用于持久化你的启用偏好。
开启自动发送时，提示词仅会作为正常页面使用的一部分发送到目标 AI 网站。

## 贡献指南

欢迎提交 Issue 和 Pull Request。
提交前建议执行 `npm run check:platforms` 与 `npm run test:e2e`。
请同时阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)、[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) 与 [SECURITY.md](./SECURITY.md)。

## 开源协议

[MIT](./LICENSE)

## 致谢

本项目灵感来源于 [gemini-url-prompt](https://github.com/elliot79313/gemini-url-prompt)。
