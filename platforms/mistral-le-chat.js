(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Mistral Le Chat',
        hosts: ['chat.mistral.ai'],
        inputStrategies: [
            { selector: 'div.ProseMirror[contenteditable="true"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][translate="no"]', mode: 'contenteditable' },
            { selector: '[contenteditable="true"].ProseMirror', mode: 'contenteditable' },
            { selector: '[contenteditable="true"]', mode: 'contenteditable' },
            { selector: 'textarea[placeholder*="Message"]', mode: 'textarea' },
            { selector: 'textarea', mode: 'textarea' }
        ],
        sendButtonSelectors: [
            'button[type="submit"][aria-label*="Send"]',
            'button[type="submit"][aria-label*="Envoyer"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="Envoyer"]',
            'button[type="submit"]'
        ],
        sendKeywords: ['send', 'envoyer', 'senden'],
        stopKeywords: ['stop', 'cancel', 'abort', 'annuler', 'arrêter'],
        sendDelayMs: 260
    });
})();
