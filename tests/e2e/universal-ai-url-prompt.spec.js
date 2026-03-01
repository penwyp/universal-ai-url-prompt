'use strict';

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { SITE_CASES } = require('./site-cases');
const { buildFixtureHtml } = require('./fixture-page');

const ROOT_DIR = path.resolve(__dirname, '../..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const SCRIPT_FILES = manifest.content_scripts[0].js.map((file) => path.join(ROOT_DIR, file));

async function routeFixturePage(page, siteCase) {
    const fixtureHtml = buildFixtureHtml(siteCase);

    await page.route('**/*', async (route) => {
        const request = route.request();
        const requestUrl = new URL(request.url());

        if (request.resourceType() === 'document' && requestUrl.hostname === siteCase.host) {
            await route.fulfill({
                status: 200,
                contentType: 'text/html; charset=utf-8',
                body: fixtureHtml
            });
            return;
        }

        await route.fulfill({ status: 204, body: '' });
    });
}

async function routeDelayedMutationFixture(page, host, mountDelayMs = 1800) {
    const fixtureHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Delayed Mount Fixture</title>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      const root = document.getElementById('root');
      window.__e2e = { sentCount: 0, lastSubmittedText: '' };
      let noiseCounter = 0;

      const noiseTimer = setInterval(function() {
        const item = document.createElement('div');
        item.textContent = String(noiseCounter++);
        root.appendChild(item);
        if (root.children.length > 80) {
          root.removeChild(root.firstChild);
        }
      }, 5);

      setTimeout(function() {
        clearInterval(noiseTimer);

        const form = document.createElement('form');
        form.id = 'chat-form';

        const input = document.createElement('textarea');
        input.id = 'prompt-textarea';
        input.setAttribute('data-testid', 'prompt-textarea');
        input.setAttribute('placeholder', 'Ask anything');

        const sendButton = document.createElement('button');
        sendButton.type = 'button';
        sendButton.setAttribute('data-testid', 'send-button');
        sendButton.setAttribute('aria-label', 'Send message');
        sendButton.textContent = 'Send';

        sendButton.addEventListener('click', function(event) {
          event.preventDefault();
          window.__e2e.sentCount += 1;
          window.__e2e.lastSubmittedText = input.value || '';
          input.value = '';
        });

        form.addEventListener('submit', function(event) {
          event.preventDefault();
          window.__e2e.sentCount += 1;
          window.__e2e.lastSubmittedText = input.value || '';
          input.value = '';
        });

        form.appendChild(input);
        form.appendChild(sendButton);
        root.appendChild(form);
      }, ${mountDelayMs});
    })();
  </script>
</body>
</html>`;

    await page.route('**/*', async (route) => {
        const request = route.request();
        const requestUrl = new URL(request.url());

        if (request.resourceType() === 'document' && requestUrl.hostname === host) {
            await route.fulfill({
                status: 200,
                contentType: 'text/html; charset=utf-8',
                body: fixtureHtml
            });
            return;
        }

        await route.fulfill({ status: 204, body: '' });
    });
}

async function injectExtensionScripts(page) {
    for (const scriptPath of SCRIPT_FILES) {
        await page.addScriptTag({ path: scriptPath });
    }
}

async function mockRuntimePromptCache(page, record) {
    await page.addInitScript((cachedRecord) => {
        window.chrome = window.chrome || {};
        window.chrome.runtime = window.chrome.runtime || {};
        window.chrome.runtime.sendMessage = (message, callback) => {
            if (!message || message.type !== 'UAUP_GET_CACHED_PROMPT') {
                callback({ ok: false });
                return;
            }
            callback({ ok: true, record: cachedRecord });
        };
    }, record);
}

async function mockPlatformEnabledState(page, enabledMap) {
    await page.addInitScript((map) => {
        window.chrome = window.chrome || {};
        window.chrome.storage = window.chrome.storage || {};
        window.chrome.storage.sync = window.chrome.storage.sync || {};
        window.chrome.storage.sync.get = (keys, callback) => {
            callback({ platformEnabledByName: map });
        };
    }, enabledMap);
}

async function readCurrentInput(page) {
    return page.evaluate(() => {
        const input = document.querySelector('[data-e2e-input]');
        if (!input) return '';
        if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
            return input.value || '';
        }
        const clone = input.cloneNode(true);
        if (typeof clone.querySelectorAll === 'function') {
            clone.querySelectorAll('[data-slate-placeholder="true"]').forEach((node) => node.remove());
            clone.querySelectorAll('[data-slate-zero-width]').forEach((node) => node.remove());
        }
        return clone.textContent || '';
    });
}

async function waitStage(page, stage, timeout = 10000) {
    await expect
        .poll(
            () =>
                page.evaluate((name) => {
                    const events = window.__UAUP_DEBUG__ && Array.isArray(window.__UAUP_DEBUG__.events)
                        ? window.__UAUP_DEBUG__.events
                        : [];
                    return events.some((event) => event.stage === name);
                }, stage),
            { timeout }
        )
        .toBe(true);
}

async function getLastStageEvent(page, stage) {
    return page.evaluate((stageName) => {
        const events = window.__UAUP_DEBUG__ && Array.isArray(window.__UAUP_DEBUG__.events)
            ? window.__UAUP_DEBUG__.events
            : [];
        for (let i = events.length - 1; i >= 0; i -= 1) {
            if (events[i].stage === stageName) return events[i];
        }
        return null;
    }, stage);
}

function getCasePath(siteCase) {
    const rawPath = typeof siteCase.path === 'string' ? siteCase.path.trim() : '';
    if (!rawPath) return '/';
    if (rawPath.startsWith('/')) return rawPath;
    return `/${rawPath}`;
}

function buildCaseUrl(siteCase, queryString = '') {
    const path = getCasePath(siteCase);
    const query = queryString ? `?${queryString}` : '';
    return `https://${siteCase.host}${path}${query}`;
}

for (const siteCase of SITE_CASES) {
    test.describe(siteCase.platform, () => {
        test('contract: 能找到输入框并注入文本', async ({ page }) => {
            const prompt = `${siteCase.platform} Contract Input`;
            await routeFixturePage(page, siteCase);

            await page.goto(buildCaseUrl(siteCase, `prompt=${encodeURIComponent(prompt)}&autosend=0`), {
                waitUntil: 'domcontentloaded'
            });
            await injectExtensionScripts(page);

            await waitStage(page, 'input_selected');
            await waitStage(page, 'input_injected');

            const selectedEvent = await getLastStageEvent(page, 'input_selected');
            expect(selectedEvent).toBeTruthy();
            expect(selectedEvent.meta).toBeTruthy();
            expect(selectedEvent.meta.selector).toBeTruthy();

            const currentInput = await readCurrentInput(page);
            expect(currentInput).toBe(prompt);

            const sentCount = await page.evaluate(() => window.__e2e.sentCount);
            expect(sentCount).toBe(0);
        });

        test('contract: 能触发发送动作', async ({ page }) => {
            const prompt = `${siteCase.platform} Contract Send`;
            await routeFixturePage(page, siteCase);

            await page.goto(buildCaseUrl(siteCase, `prompt=${encodeURIComponent(prompt)}`), {
                waitUntil: 'domcontentloaded'
            });
            await injectExtensionScripts(page);

            await waitStage(page, 'send_triggered');

            await expect
                .poll(
                    () =>
                        page.evaluate(() => {
                            return window.__e2e ? window.__e2e.sentCount : 0;
                        }),
                    { timeout: 10000 }
                )
                .toBeGreaterThan(0);

            const sendEvent = await getLastStageEvent(page, 'send_triggered');
            expect(sendEvent).toBeTruthy();
            expect(['button', 'form', 'enter']).toContain(sendEvent.meta.path);

            const submittedText = await page.evaluate(() => window.__e2e.lastSubmittedText);
            expect(submittedText).toBe(prompt);
        });

        test('contract: 能确认提交成功', async ({ page }) => {
            const prompt = `${siteCase.platform} Contract Confirm`;
            await routeFixturePage(page, siteCase);

            await page.goto(buildCaseUrl(siteCase, `prompt=${encodeURIComponent(prompt)}`), {
                waitUntil: 'domcontentloaded'
            });
            await injectExtensionScripts(page);

            await waitStage(page, 'send_confirmed');

            const confirmEvent = await getLastStageEvent(page, 'send_confirmed');
            expect(confirmEvent).toBeTruthy();
            expect(confirmEvent.meta).toBeTruthy();
            expect(typeof confirmEvent.meta.attempt).toBe('number');

            const currentInput = await readCurrentInput(page);
            expect(currentInput.trim()).toBe('');

            const sentCount = await page.evaluate(() => window.__e2e.sentCount);
            expect(sentCount).toBeGreaterThan(0);
        });
    });
}

test('平台开关: 关闭平台后应跳过注入流程', async ({ page }) => {
    const siteCase = SITE_CASES.find((item) => item.platform === 'ChatGPT');
    expect(siteCase).toBeTruthy();

    await routeFixturePage(page, siteCase);
    await mockPlatformEnabledState(page, {
        ChatGPT: false
    });

    await page.goto(`https://${siteCase.host}/?prompt=${encodeURIComponent('Disabled Platform Prompt')}&autosend=0`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'platform_disabled');

    const hasInjected = await page.evaluate(() => {
        const events = window.__UAUP_DEBUG__ && Array.isArray(window.__UAUP_DEBUG__.events)
            ? window.__UAUP_DEBUG__.events
            : [];
        return events.some((event) => event.stage === 'input_injected');
    });
    expect(hasInjected).toBe(false);

    const currentInput = await readCurrentInput(page);
    expect(currentInput).toBe('');

    const sentCount = await page.evaluate(() => window.__e2e.sentCount);
    expect(sentCount).toBe(0);
});

test('Perplexity: 无 prompt 参数时仍可手动输入', async ({ page }) => {
    const siteCase = SITE_CASES.find((item) => item.platform === 'Perplexity');
    expect(siteCase).toBeTruthy();

    await routeFixturePage(page, siteCase);
    await page.goto(`https://${siteCase.host}/`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'prompt_skip');

    await page.evaluate(() => {
        const input = document.querySelector('[data-e2e-input]');
        if (!input) return;

        input.focus();

        const text = 'Perplexity Manual Input';
        try {
            input.dispatchEvent(new InputEvent('beforeinput', {
                bubbles: true,
                cancelable: true,
                data: text,
                inputType: 'insertText'
            }));
        } catch (error) {
            input.dispatchEvent(new Event('beforeinput', { bubbles: true, cancelable: true }));
        }

        if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
            input.value = text;
        } else {
            input.textContent = text;
        }

        try {
            input.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                data: text,
                inputType: 'insertText'
            }));
        } catch (error) {
            input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        }
    });

    const currentInput = await readCurrentInput(page);
    expect(currentInput).toContain('Perplexity Manual Input');

    const sentCount = await page.evaluate(() => window.__e2e.sentCount);
    expect(sentCount).toBe(0);
});

test('Gemini: 重试阶段不会误点停止按钮', async ({ page }) => {
    const baseCase = SITE_CASES.find((item) => item.platform === 'Gemini');
    expect(baseCase).toBeTruthy();

    const siteCase = {
        ...baseCase,
        sendButtonAttributes: 'type="submit" aria-label="发送"',
        toggleStopAfterSubmit: true,
        preserveInputAfterSubmit: true
    };
    const prompt = 'Gemini Stop Guard Validation';
    await routeFixturePage(page, siteCase);

    await page.goto(`https://${siteCase.host}/?prompt=${encodeURIComponent(prompt)}`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'send_triggered');
    await page.waitForTimeout(2600);

    const e2eState = await page.evaluate(() => window.__e2e);
    expect(e2eState.sentCount).toBe(1);
    expect(e2eState.sendButtonClickCount).toBe(1);
    expect(e2eState.stopButtonClickCount).toBe(0);
    expect(e2eState.conversationStopped).toBe(false);
});

test('Gemini: 首次触发后不会重复表单提交导致 abort', async ({ page }) => {
    const baseCase = SITE_CASES.find((item) => item.platform === 'Gemini');
    expect(baseCase).toBeTruthy();

    const siteCase = {
        ...baseCase,
        sendButtonAttributes: 'type="submit" aria-label="发送"',
        toggleStopAfterSubmit: true,
        preserveInputAfterSubmit: true,
        abortOnResubmit: true
    };
    const prompt = 'Gemini Duplicate Submit Guard';
    await routeFixturePage(page, siteCase);

    await page.goto(`https://${siteCase.host}/?prompt=${encodeURIComponent(prompt)}`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'send_triggered');
    await page.waitForTimeout(2600);

    const e2eState = await page.evaluate(() => window.__e2e);
    expect(e2eState.sentCount).toBe(1);
    expect(e2eState.resubmitAbortCount).toBe(0);
    expect(e2eState.conversationStopped).toBe(false);

    const sendTriggeredCount = await page.evaluate(() => {
        const events = window.__UAUP_DEBUG__ && Array.isArray(window.__UAUP_DEBUG__.events)
            ? window.__UAUP_DEBUG__.events
            : [];
        return events.filter((event) => event.stage === 'send_triggered').length;
    });
    expect(sendTriggeredCount).toBe(1);
});

test('ChatGPT: 按钮点击被忽略时可降级为 form 提交', async ({ page }) => {
    const baseCase = SITE_CASES.find((item) => item.platform === 'ChatGPT');
    expect(baseCase).toBeTruthy();

    const siteCase = {
        ...baseCase,
        sendButtonAttributes: 'type="button" data-testid="send-button" aria-label="Send message"',
        ignoreSyntheticClick: true
    };
    const prompt = 'ChatGPT Synthetic Click Ignore';
    await routeFixturePage(page, siteCase);

    await page.goto(`https://${siteCase.host}/?prompt=${encodeURIComponent(prompt)}`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'send_confirmed');

    const e2eState = await page.evaluate(() => window.__e2e);
    expect(e2eState.sentCount).toBe(1);
    expect(e2eState.syntheticClickIgnoredCount).toBeGreaterThan(0);
    expect(e2eState.lastSource).toBe('form');
    expect(e2eState.lastSubmittedText).toBe(prompt);
});

test('ChatGLM: 输入后应快速触发发送', async ({ page }) => {
    const siteCase = SITE_CASES.find((item) => item.platform === 'ChatGLM');
    expect(siteCase).toBeTruthy();

    const prompt = 'ChatGLM Fast Send Validation';
    await routeFixturePage(page, siteCase);

    await page.goto(`https://${siteCase.host}/?prompt=${encodeURIComponent(prompt)}`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'input_injected');
    await waitStage(page, 'send_triggered');

    const injectEvent = await getLastStageEvent(page, 'input_injected');
    const sendEvent = await getLastStageEvent(page, 'send_triggered');
    expect(injectEvent).toBeTruthy();
    expect(sendEvent).toBeTruthy();
    expect(typeof injectEvent.ts).toBe('number');
    expect(typeof sendEvent.ts).toBe('number');

    const delayMs = sendEvent.ts - injectEvent.ts;
    expect(delayMs).toBeGreaterThanOrEqual(0);
    expect(delayMs).toBeLessThanOrEqual(320);
});

test('DeepSeek: 输入后应快速触发发送', async ({ page }) => {
    const siteCase = SITE_CASES.find((item) => item.platform === 'DeepSeek');
    expect(siteCase).toBeTruthy();

    const prompt = 'DeepSeek Fast Send Validation';
    await routeFixturePage(page, siteCase);

    await page.goto(`https://${siteCase.host}/?prompt=${encodeURIComponent(prompt)}`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'input_injected');
    await waitStage(page, 'send_triggered');

    const injectEvent = await getLastStageEvent(page, 'input_injected');
    const sendEvent = await getLastStageEvent(page, 'send_triggered');
    expect(injectEvent).toBeTruthy();
    expect(sendEvent).toBeTruthy();
    expect(typeof injectEvent.ts).toBe('number');
    expect(typeof sendEvent.ts).toBe('number');

    const delayMs = sendEvent.ts - injectEvent.ts;
    expect(delayMs).toBeGreaterThanOrEqual(0);
    expect(delayMs).toBeLessThanOrEqual(260);
});

test('Wenxiaoyan: 输入后应快速触发发送', async ({ page }) => {
    const siteCase = SITE_CASES.find((item) => item.platform === 'Wenxiaoyan');
    expect(siteCase).toBeTruthy();

    const prompt = 'Wenxiaoyan Fast Send Validation';
    await routeFixturePage(page, siteCase);

    await page.goto(`https://${siteCase.host}/?prompt=${encodeURIComponent(prompt)}`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'input_injected');
    await waitStage(page, 'send_triggered');

    const injectEvent = await getLastStageEvent(page, 'input_injected');
    const sendEvent = await getLastStageEvent(page, 'send_triggered');
    expect(injectEvent).toBeTruthy();
    expect(sendEvent).toBeTruthy();
    expect(typeof injectEvent.ts).toBe('number');
    expect(typeof sendEvent.ts).toBe('number');

    const delayMs = sendEvent.ts - injectEvent.ts;
    expect(delayMs).toBeGreaterThanOrEqual(0);
    expect(delayMs).toBeLessThanOrEqual(220);
});

test('Wenxiaoyan: 按钮延迟可用时仍应快速提交', async ({ page }) => {
    const baseCase = SITE_CASES.find((item) => item.platform === 'Wenxiaoyan');
    expect(baseCase).toBeTruthy();

    const siteCase = {
        ...baseCase,
        useForm: false,
        sendEnableDelayMs: 150
    };
    const prompt = 'Wenxiaoyan Delayed Button Readiness';
    await routeFixturePage(page, siteCase);

    await page.goto(`https://${siteCase.host}/?prompt=${encodeURIComponent(prompt)}`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'input_injected');
    await waitStage(page, 'send_triggered');
    await waitStage(page, 'send_confirmed');

    const injectEvent = await getLastStageEvent(page, 'input_injected');
    const sendEvent = await getLastStageEvent(page, 'send_triggered');
    expect(injectEvent).toBeTruthy();
    expect(sendEvent).toBeTruthy();

    const e2eState = await page.evaluate(() => window.__e2e);
    expect(typeof e2eState.sendEnabledAt).toBe('number');
    expect(e2eState.sendEnabledAt).toBeGreaterThan(0);
    expect(sendEvent.ts).toBeGreaterThanOrEqual(e2eState.sendEnabledAt);

    const lagAfterEnabledMs = sendEvent.ts - e2eState.sendEnabledAt;
    expect(lagAfterEnabledMs).toBeLessThanOrEqual(220);

    const delayFromInjectMs = sendEvent.ts - injectEvent.ts;
    expect(delayFromInjectMs).toBeGreaterThanOrEqual(0);
    expect(delayFromInjectMs).toBeLessThanOrEqual(420);

    expect(e2eState.sentCount).toBe(1);
    expect(e2eState.resubmitAbortCount).toBe(0);
    expect(e2eState.stopButtonClickCount).toBe(0);
});

test('q 参数: 可注入并自动提交', async ({ page }) => {
    const siteCase = SITE_CASES.find((item) => item.platform === 'Claude');
    const prompt = 'Query Parameter Validation';
    await routeFixturePage(page, siteCase);

    await page.goto(`https://${siteCase.host}/?q=${encodeURIComponent(prompt)}`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'send_confirmed');
    const submittedText = await page.evaluate(() => window.__e2e.lastSubmittedText);
    expect(submittedText).toBe(prompt);
});

test('p 参数: 可注入并自动提交', async ({ page }) => {
    const siteCase = SITE_CASES.find((item) => item.platform === 'Kimi');
    const prompt = 'Short Parameter Validation';
    await routeFixturePage(page, siteCase);

    await page.goto(`https://${siteCase.host}/?p=${encodeURIComponent(prompt)}`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'send_confirmed');
    const submittedText = await page.evaluate(() => window.__e2e.lastSubmittedText);
    expect(submittedText).toBe(prompt);
});

test('background 缓存参数: URL 无 prompt 仍可注入且可关闭自动发送', async ({ page }) => {
    const siteCase = SITE_CASES.find((item) => item.platform === 'Microsoft Copilot');
    expect(siteCase).toBeTruthy();

    const prompt = 'Copilot Background Cache Prompt';
    await routeFixturePage(page, siteCase);
    await mockRuntimePromptCache(page, {
        promptText: prompt,
        promptParamKey: 'prompt',
        params: {
            prompt,
            autosend: '0'
        },
        source: 'before_navigate'
    });

    await page.goto(`https://${siteCase.host}/`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'input_injected');
    const resolvedEvent = await getLastStageEvent(page, 'prompt_resolved');
    expect(resolvedEvent).toBeTruthy();
    expect(resolvedEvent.meta.source).toContain('background');

    const currentInput = await readCurrentInput(page);
    expect(currentInput).toBe(prompt);

    await page.waitForTimeout(300);
    const sentCount = await page.evaluate(() => window.__e2e.sentCount);
    expect(sentCount).toBe(0);
});

test('高频 mutation + 延迟挂载输入框: 仍能注入并自动提交', async ({ page }) => {
    const host = 'chatgpt.com';
    const prompt = 'Delayed Mount Mutation Stress';

    await routeDelayedMutationFixture(page, host, 2000);
    await page.goto(`https://${host}/?prompt=${encodeURIComponent(prompt)}`, {
        waitUntil: 'domcontentloaded'
    });
    await injectExtensionScripts(page);

    await waitStage(page, 'send_confirmed', 16000);

    const e2eState = await page.evaluate(() => window.__e2e);
    expect(e2eState.sentCount).toBeGreaterThan(0);
    expect(e2eState.lastSubmittedText).toBe(prompt);
});
