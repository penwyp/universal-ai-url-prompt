(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Meta AI',
        hosts: ['meta.ai', 'www.meta.ai'],
        inputStrategies: [
            { selector: 'textarea[placeholder*="Meta AI" i]', mode: 'textarea' },
            { selector: 'textarea[aria-label*="Meta" i]', mode: 'textarea' },
            { selector: 'textarea', mode: 'textarea' }
        ],
        sendButtonSelectors: [
            'button[aria-label*="Send" i]',
            'button[data-testid*="send" i]',
            'button[data-testid*="submit" i]',
            'button[type="submit"]',
            '[role="button"][aria-label*="Send" i]'
        ],
        sendKeywords: ['send', 'submit'],
        sendDelayMs: 260
    });
})();
