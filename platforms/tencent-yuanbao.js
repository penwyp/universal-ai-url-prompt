(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Tencent Yuanbao',
        hosts: ['yuanbao.tencent.com'],
        inputStrategies: [
            { selector: 'div.ql-editor[contenteditable="true"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][data-placeholder*="元宝"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][data-placeholder*="log in"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][id*="search"]', mode: 'contenteditable' },
            { selector: 'textarea[data-testid*="chat"]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="input"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="元宝"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="输入"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="发送"]', mode: 'textarea' },
            { selector: 'div[contenteditable="true"][data-testid*="chat"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: 'textarea', mode: 'textarea' }
        ],
        sendButtonSelectors: [
            'button[data-testid*="send"]',
            'button[data-testid*="submit"]',
            'button[aria-label*="发送"]',
            'button[aria-label*="提交"]',
            'button[title*="发送"]',
            'button[title*="提交"]'
        ],
        sendKeywords: ['发送', '提交', 'send', 'submit'],
        sendDelayMs: 90,
        sendRetryAttempts: 16,
        sendRetryIntervalMs: 100
    });
})();
