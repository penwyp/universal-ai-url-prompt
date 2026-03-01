(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    const SEND_SELECTORS = [
        'button[data-testid="send-button"]',
        'button[data-testid*="send"]',
        'button[data-testid*="submit"]',
        'button[aria-label*="发送"]',
        'button[aria-label*="Send"]',
        'button[title*="发送"]',
        'button[title*="Send"]',
        'button[class*="send"]',
        'button[type="submit"]'
    ];

    const SEND_KEYWORDS = ['send', '发送', '提交', '发出'];
    const STOP_KEYWORDS = ['stop', '停止', '取消', '终止'];

    function collectSearchScopes(doc, rootElement, targetElement) {
        const scopes = [];
        const seen = new Set();

        const addScope = (scope) => {
            if (!scope || typeof scope.querySelectorAll !== 'function') return;
            if (seen.has(scope)) return;
            seen.add(scope);
            scopes.push(scope);
        };

        if (targetElement) {
            addScope(targetElement.closest('form'));
            addScope(targetElement.closest('[data-testid*="chat"]'));
            addScope(targetElement.closest('[class*="chat"]'));
            addScope(targetElement.closest('[class*="input"]'));
            addScope(targetElement.parentElement);
            addScope(targetElement.closest('main'));
        }

        if (rootElement && rootElement !== doc) {
            addScope(rootElement);
        }

        addScope(doc);
        return scopes;
    }

    function computeDistance(source, target) {
        if (!source || !target) return Number.POSITIVE_INFINITY;
        const sourceRect = source.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        const sourceCenterX = sourceRect.left + sourceRect.width / 2;
        const sourceCenterY = sourceRect.top + sourceRect.height / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        return Math.abs(sourceCenterX - targetCenterX) + Math.abs(sourceCenterY - targetCenterY);
    }

    function getButtonLabels(button) {
        return [
            button.getAttribute('aria-label'),
            button.getAttribute('title'),
            button.getAttribute('data-testid'),
            button.getAttribute('id'),
            String(button.className || ''),
            button.textContent
        ].filter(Boolean).join(' ');
    }

    function getKeywordScore(normalizeText, value, keywords) {
        const normalizedValue = normalizeText(value);
        if (!normalizedValue) return 0;

        let bestScore = 0;
        for (const keyword of keywords) {
            const normalizedKeyword = normalizeText(keyword);
            if (!normalizedKeyword) continue;
            if (normalizedValue.includes(normalizedKeyword)) {
                bestScore = Math.max(bestScore, normalizedKeyword.length);
            }
        }
        return bestScore;
    }

    function findSendButtonWithPriority(context, rootElement, targetElement) {
        const doc = context.document || document;
        const scopes = collectSearchScopes(doc, rootElement, targetElement);
        let bestFallback = null;

        for (const scope of scopes) {
            const uniqueButtons = new Set();
            for (const selector of SEND_SELECTORS) {
                const buttons = scope.querySelectorAll(selector);
                buttons.forEach((button) => uniqueButtons.add(button));
            }

            for (const button of uniqueButtons) {
                if (!context.helpers.isVisible(button) || !context.helpers.isEnabled(button)) continue;

                const labels = getButtonLabels(button);
                const stopScore = getKeywordScore(context.normalizeText, labels, STOP_KEYWORDS);
                if (stopScore > 0) continue;

                const labelScore = getKeywordScore(context.normalizeText, labels, SEND_KEYWORDS);
                const distance = computeDistance(button, targetElement);

                const candidate = {
                    button,
                    selector: '(deepseek-priority)',
                    score: labelScore > 0 ? (200 + labelScore) : 100,
                    labelScore,
                    selectorScore: 1,
                    distance
                };

                if (labelScore > 0) {
                    if (!bestFallback || candidate.distance < bestFallback.distance || bestFallback.labelScore <= 0) {
                        bestFallback = candidate;
                    }
                } else if (!bestFallback || (bestFallback.labelScore <= 0 && candidate.distance < bestFallback.distance)) {
                    bestFallback = candidate;
                }
            }

            if (bestFallback && bestFallback.labelScore > 0) {
                return bestFallback;
            }
        }

        return bestFallback;
    }

    register({
        name: 'DeepSeek',
        hosts: ['chat.deepseek.com', 'www.deepseek.com', 'deepseek.com'],
        inputStrategies: [
            { selector: 'textarea#chat-input', mode: 'textarea' },
            { selector: 'textarea[data-testid="chat-input"]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="chat"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="DeepSeek"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="发送"]', mode: 'textarea' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: '[contenteditable="true"][data-testid*="chat"]', mode: 'contenteditable' }
        ],
        sendButtonSelectors: [
            'button[data-testid*="send"]',
            'button[data-testid*="submit"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="发送"]'
        ],
        sendKeywords: ['send', '发送', '提交', '发出'],
        sendDelayMs: 90,
        sendRetryAttempts: 12,
        sendRetryIntervalMs: 100,
        hooks: {
            findSendButton(context, rootElement, targetElement) {
                const fastMatch = findSendButtonWithPriority(context, rootElement, targetElement);
                if (fastMatch && fastMatch.button) {
                    return fastMatch;
                }

                if (rootElement && rootElement !== context.document) {
                    const scopedMatch = context.helpers.findSendButtonDefault(rootElement, targetElement);
                    if (scopedMatch) return scopedMatch;
                }

                return context.helpers.findSendButtonDefault(context.document || document, targetElement);
            }
        }
    });
})();
