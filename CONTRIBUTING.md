# Contributing

## Prerequisites

- Node.js 18+
- npm 9+

## Local Setup

```bash
npm install
npx playwright install chromium
```

## Validation Checklist

Run these before opening a PR:

```bash
npm run check:platforms
npm run build:manifest
npm run test:e2e
```

## Platform Changes

- Keep each platform change isolated to `platforms/<name>.js`.
- `inputStrategies` and `sendButtonSelectors` are required and must be non-empty.
- Prefer platform hooks only when selectors are not enough.

## Pull Requests

- One focused change per PR.
- Include regression risk and test evidence in the PR description.
- Do not merge if E2E or platform contract checks fail.
