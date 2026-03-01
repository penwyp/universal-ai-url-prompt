(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Doubao',
        hosts: ['www.doubao.com', 'doubao.com'],
        inputStrategies: [
            { selector: 'textarea[data-testid="chat-input"]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="chat"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="输入"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="发送"]', mode: 'textarea' },
            { selector: 'div[contenteditable="true"][data-testid*="chat"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: 'textarea[placeholder]', mode: 'textarea' }
        ],
        sendButtonSelectors: [
            'button[data-testid*="send"]',
            'button[data-testid*="submit"]',
            'button[aria-label*="发送"]',
            'button[aria-label*="提交"]'
        ],
        sendKeywords: ['发送', '發送', '传送', 'send', '提交'],
        sendDelayMs: 320,
        sendRetryAttempts: 12,
        sendRetryIntervalMs: 220
    });
})();
