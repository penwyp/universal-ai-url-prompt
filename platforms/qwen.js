(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Qwen',
        hosts: ['chat.qwen.ai'],
        inputStrategies: [
            { selector: 'textarea[data-testid*="chat"]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="input"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="问"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Qwen"]', mode: 'textarea' },
            { selector: 'div[contenteditable="true"][data-testid*="chat"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: 'textarea', mode: 'textarea' }
        ],
        sendButtonSelectors: [
            'button[data-testid*="send"]',
            'button[data-testid*="submit"]',
            'button[aria-label*="发送"]',
            'button[aria-label*="Send"]'
        ],
        sendKeywords: ['send', '发送', '提交', '送信', 'ask'],
        sendDelayMs: 320,
        sendRetryAttempts: 12,
        sendRetryIntervalMs: 220
    });
})();
