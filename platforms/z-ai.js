(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Z.ai',
        hosts: ['z.ai', 'www.z.ai', 'chat.z.ai'],
        inputStrategies: [
            { selector: 'textarea[placeholder*="Z.ai" i]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="Z AI" i]', mode: 'textarea' },
            { selector: 'textarea[aria-label*="Z.ai" i]', mode: 'textarea' },
            { selector: 'textarea', mode: 'textarea' }
        ],
        sendButtonSelectors: [
            'button[aria-label*="发送"]',
            'button[aria-label*="提交"]',
            'button[aria-label*="Send" i]',
            'button[data-testid*="send" i]',
            'button[data-testid*="submit" i]',
            'button[type="submit"]',
            '[role="button"][aria-label*="发送"]',
            '[role="button"][aria-label*="提交"]'
        ],
        sendKeywords: ['send', '发送', '提交'],
        sendDelayMs: 260
    });
})();
