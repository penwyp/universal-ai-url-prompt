(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Microsoft Copilot',
        hosts: ['copilot.microsoft.com'],
        inputStrategies: [
            { selector: 'textarea#userInput', mode: 'textarea' },
            { selector: 'textarea[name="userInput"]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="chat"]', mode: 'textarea' },
            { selector: 'textarea[aria-label*="Copilot"]', mode: 'textarea' },
            { selector: 'textarea[aria-label*="Message"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Message"]', mode: 'textarea' },
            { selector: 'div[contenteditable="true"][role="textbox"][aria-label*="Copilot"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"][aria-label*="Message"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][data-testid*="chat"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' }
        ],
        sendButtonSelectors: [
            'button[data-testid*="send"]',
            'button[data-testid*="submit"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="Submit"]',
            'button[aria-label*="发送"]'
        ],
        sendKeywords: ['send', 'submit', '发送', 'ask'],
        sendDelayMs: 320,
        sendRetryAttempts: 12,
        sendRetryIntervalMs: 220
    });
})();
