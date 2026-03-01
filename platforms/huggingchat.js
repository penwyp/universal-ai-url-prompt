(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;
    const CHAT_PATH_PATTERN = /^\/chat(?:\/|$)/;

    function isChatPath(pathname) {
        return CHAT_PATH_PATTERN.test(String(pathname || ''));
    }

    function isElementEnabled(element) {
        if (!element) return false;
        if (element.disabled) return false;
        if (element.getAttribute && element.getAttribute('aria-disabled') === 'true') return false;
        if (element.getAttribute && element.getAttribute('data-disabled') === 'true') return false;
        return true;
    }

    register({
        name: 'HuggingChat',
        hosts: ['huggingface.co', 'www.huggingface.co', 'hf.co'],
        matchPatterns: [
            'https://huggingface.co/chat*',
            'https://www.huggingface.co/chat*',
            'https://hf.co/chat*'
        ],
        inputStrategies: [
            { selector: 'form[aria-label*="dropzone" i] textarea[placeholder*="Ask anything" i]', mode: 'textarea' },
            { selector: 'form[aria-label*="dropzone" i] textarea[placeholder*="Ask" i]', mode: 'textarea' },
            { selector: 'form[aria-label*="dropzone" i] textarea', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Ask anything" i]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Ask" i]', mode: 'textarea' },
            { selector: 'textarea', mode: 'textarea' }
        ],
        sendButtonSelectors: [
            'button[name="submit"][aria-label*="Send" i]',
            'button[name="submit"]',
            'button[type="submit"][aria-label*="Send" i]',
            'button[type="submit"][title*="Send" i]',
            'button[aria-label*="Send message" i]',
            'button[aria-label*="Send" i]',
            'button[type="submit"]'
        ],
        sendKeywords: ['send', 'submit', 'message', '发送', '提交', '送信'],
        sendDelayMs: 300,
        sendRetryAttempts: 12,
        sendRetryIntervalMs: 220,
        hooks: {
            resolvePromptParams(context) {
                const win = context.window || window;
                const params = new URLSearchParams(
                    win.location && typeof win.location.search === 'string' ? win.location.search : ''
                );

                if (!isChatPath(win.location && win.location.pathname)) {
                    return {
                        params,
                        promptText: '',
                        source: 'path_skip'
                    };
                }

                return {
                    params,
                    promptText: params.get('prompt') || params.get('q') || params.get('p') || '',
                    source: 'location'
                };
            },
            isEnabled(context, element) {
                const win = context.window || window;
                if (!isChatPath(win.location && win.location.pathname)) {
                    return false;
                }

                return isElementEnabled(element);
            }
        }
    });
})();
