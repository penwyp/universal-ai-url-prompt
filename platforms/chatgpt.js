(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'ChatGPT',
        hosts: ['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com'],
        inputStrategies: [
            { selector: 'textarea#prompt-textarea', mode: 'textarea' },
            { selector: 'textarea[data-testid="prompt-textarea"]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="prompt"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Ask"]', mode: 'textarea' },
            { selector: 'textarea[class*="fallbackTextarea"]', mode: 'textarea' },
            { selector: 'div[contenteditable="true"][data-testid*="composer"]', mode: 'contenteditable' }
        ],
        sendButtonSelectors: [
            'button[data-testid="send-button"]',
            'button[data-testid*="send" i]',
            'button[aria-label*="send" i]',
            'button[aria-label*="发送"]',
            'button[aria-label*="送信"]'
        ],
        sendKeywords: ['send', '发送', '送信'],
        sendDelayMs: 620,
        sendRetryAttempts: 16,
        sendRetryIntervalMs: 260
    });
})();
