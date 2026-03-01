(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Grok',
        hosts: ['grok.com', 'www.grok.com'],
        inputStrategies: [
            { selector: 'textarea[data-testid*="chat"]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="composer"]', mode: 'textarea' },
            { selector: 'textarea[aria-label*="Grok"]', mode: 'textarea' },
            { selector: 'textarea[aria-label*="Message"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Ask"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Grok"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="消息"]', mode: 'textarea' },
            { selector: 'div[contenteditable="true"][data-testid*="chat"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][data-testid*="composer"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][aria-label*="Message"]', mode: 'contenteditable' },
            { selector: '[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: 'textarea', mode: 'textarea' },
            { selector: 'div[contenteditable="true"]', mode: 'contenteditable' }
        ],
        sendButtonSelectors: [
            'button[data-testid*="send"]',
            'button[data-testid*="submit"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="发送"]'
        ],
        sendKeywords: ['send', 'submit', '发送', 'ask'],
        sendDelayMs: 320,
        sendRetryAttempts: 12,
        sendRetryIntervalMs: 220
    });
})();
