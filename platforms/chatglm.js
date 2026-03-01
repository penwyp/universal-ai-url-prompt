(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'ChatGLM',
        hosts: ['chatglm.cn'],
        inputStrategies: [
            { selector: 'textarea[placeholder*="ChatGLM"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="聊天"]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="chat"]', mode: 'textarea' },
            { selector: 'textarea', mode: 'textarea' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"]', mode: 'contenteditable' }
        ],
        sendButtonSelectors: [
            'button[aria-label*="发送"]',
            'button[aria-label*="提交"]',
            'button[data-testid*="send"]',
            'button[data-testid*="submit"]',
            'button[type="submit"]',
            '[role="button"][aria-label*="发送"]',
            '[role="button"][aria-label*="提交"]'
        ],
        sendKeywords: ['发送', '提交', 'send'],
        sendDelayMs: 120,
        sendRetryAttempts: 12,
        sendRetryIntervalMs: 120
    });
})();
