(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'DuckDuckGo AI',
        hosts: ['duck.ai', 'www.duck.ai'],
        inputStrategies: [
            { selector: 'textarea[data-testid*="chat"]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="input"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Duck"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Ask"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Message"]', mode: 'textarea' },
            { selector: 'div[contenteditable="true"][data-testid*="chat"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: 'textarea', mode: 'textarea' }
        ],
        sendButtonSelectors: [
            'button[data-testid*="send"]',
            'button[data-testid*="submit"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="Submit"]',
            'button[title*="Send"]',
            'button[title*="Submit"]'
        ],
        sendKeywords: ['send', 'submit', 'ask'],
        sendDelayMs: 320,
        sendRetryAttempts: 12,
        sendRetryIntervalMs: 220
    });
})();
