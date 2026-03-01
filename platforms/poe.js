(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Poe',
        hosts: ['poe.com', 'www.poe.com'],
        inputStrategies: [
            { selector: 'textarea[data-testid*="chat"]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="message"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Ask"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Talk"]', mode: 'textarea' },
            { selector: 'div[contenteditable="true"][data-testid*="chat"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: 'textarea', mode: 'textarea' }
        ],
        sendButtonSelectors: [
            'button[data-testid*="send"]',
            'button[data-testid*="submit"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="Message"]'
        ],
        sendKeywords: ['send', '发送', 'submit', 'ask'],
        sendDelayMs: 320,
        sendRetryAttempts: 12,
        sendRetryIntervalMs: 220
    });
})();
