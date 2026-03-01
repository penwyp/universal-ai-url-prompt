(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Claude',
        hosts: ['claude.ai'],
        inputStrategies: [
            { selector: 'div[contenteditable="true"][data-testid="chat-input"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' }
        ],
        sendButtonSelectors: [
            'button[aria-label*="Send" i]',
            'button[data-testid*="send" i]',
            'button[data-testid*="submit" i]',
            'button[type="submit"]',
            '[role="button"][aria-label*="Send" i]'
        ],
        sendKeywords: ['send', 'envoyer', 'senden'],
        sendDelayMs: 260
    });
})();
