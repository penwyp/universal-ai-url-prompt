(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    register({
        name: 'Kimi',
        hosts: ['kimi.moonshot.cn', 'kimi.com', 'www.kimi.com'],
        inputStrategies: [
            { selector: 'div.chat-input-editor[contenteditable="true"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' }
        ],
        sendButtonSelectors: [
            'div.send-button-container',
            'div[class*="send-button"]',
            'div[class*="sendButton"]'
        ],
        sendKeywords: ['发送', '提交', 'send'],
        sendDelayMs: 260
    });
})();
