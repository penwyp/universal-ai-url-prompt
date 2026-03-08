# CWS 隐私 URL 与打包指引

> 目标：解决提审前 3 个高风险点  
> 适用项目：`universal-ai-url-prompt`

## 1. 隐私口径一致（已处理）

- `README.md` 和 `README.zh-CN.md` 已改为与 `privacy.md` 一致：
  - 不传输到开发者服务器
  - 有短时内存缓存（约 3 分钟，不落盘）
  - 自动发送时仅发送到目标 AI 网站

## 2. 提供公开可访问隐私政策 URL（提审必做）

Chrome Web Store 需要可外网访问的隐私政策链接。

## 推荐做法（最简单）

1. 把仓库推到 GitHub 公开仓库主分支。
2. 在 CWS `Privacy policy URL` 填写：

```text
https://raw.githubusercontent.com/penwyp/universal-ai-url-prompt/main/privacy.md
```

3. 提交前自检：

```bash
curl -I https://raw.githubusercontent.com/penwyp/universal-ai-url-prompt/main/privacy.md
```

结果应为 `HTTP/2 200`（或等价 200）。

## 备用做法（可读性更好）

- 用 GitHub Pages 发布 `privacy.md`（或同内容 HTML）后填 Pages URL。

## 3. 仅打包运行时文件（已提供脚本）

新增命令：

```bash
npm run package:cws
```

该命令会：

1. 先生成最新 `manifest.json`
2. 只打包运行时必需文件
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `_locales/`
   - `icons/`
   - `platforms/`
3. 输出 ZIP 到：
   - `dist/cws-zips/universal-ai-url-prompt-v<version>.zip`

这样可避免把 `node_modules/`、`playwright-report/`、`test-results/` 等开发产物带入上架包。

## 提审前快速检查

```bash
npm run check:platforms
npm run package:cws
```

然后上传 `dist/cws-zips/` 里的 ZIP 到 Chrome Web Store。
