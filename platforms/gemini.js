(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Gemini',
        hosts: ['gemini.google.com'],
        inputStrategies: [
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: 'rich-textarea [contenteditable="true"]', mode: 'contenteditable' },
            { selector: 'rich-textarea p', mode: 'rich-paragraph' }
        ],
        sendButtonSelectors: [
            'button[aria-label*="发送"]',
            'button[aria-label*="提交"]',
            'button[aria-label*="Send" i]',
            'button[mattooltip*="发送"]',
            'button[mattooltip*="Send" i]',
            'button[data-testid*="send" i]',
            'button[data-testid*="submit" i]',
            'button[type="submit"]'
        ],
        sendKeywords: ['send', '发送', '發送', '傳送', 'enviar'],
        stopKeywords: ['stop', 'cancel', '停止', '终止', '終止'],
        sendDelayMs: 320
    });
})();
