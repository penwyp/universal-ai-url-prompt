(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    const INPUT_STRATEGIES = [
        { selector: 'textarea[placeholder*="医疗问题"]', mode: 'textarea', priority: 240 },
        { selector: 'textarea[maxlength="15000"][placeholder*="请输入"]', mode: 'textarea', priority: 220 },
        { selector: 'textarea[class*="caret-brand-main"][placeholder]', mode: 'textarea', priority: 210 },
        { selector: 'textarea[data-testid*="chat"]', mode: 'textarea', priority: 190 },
        { selector: 'textarea[data-testid*="input"]', mode: 'textarea', priority: 185 },
        { selector: 'textarea[placeholder*="百川"]', mode: 'textarea', priority: 180 },
        { selector: 'textarea[placeholder*="百小应"]', mode: 'textarea', priority: 178 },
        { selector: 'textarea[placeholder*="问题"]', mode: 'textarea', priority: 170 },
        { selector: 'textarea[placeholder*="发送"]', mode: 'textarea', priority: 160 },
        { selector: 'textarea[placeholder*="输入"]', mode: 'textarea', priority: 120 },
        { selector: 'div[contenteditable="true"][data-testid*="chat"]', mode: 'contenteditable', priority: 160 },
        { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable', priority: 150 },
        { selector: 'textarea', mode: 'textarea', priority: 80 }
    ];

    const SEND_WORDS = ['发送', '提交', 'send', 'submit'];
    const STOP_WORDS = ['停止', '取消', '终止', 'stop', 'cancel', 'abort'];
    const PRIORITY_SEND_BUTTON_SELECTORS = [
        'button.group.self-end',
        'button[class*="self-end"]',
        'button[aria-label*="发送"]',
        'button[aria-label*="提交"]',
        'button[aria-label*="Send"]',
        'button[title*="发送"]',
        'button[title*="提交"]',
        'button[data-testid*="send"]',
        'button[data-testid*="submit"]',
        'button[type="submit"]'
    ];

    function parseNumber(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim()) {
            const parsed = Number(value.trim());
            if (Number.isFinite(parsed)) return parsed;
        }
        return 0;
    }

    function getElementDistance(source, target) {
        if (!source || !target) return Number.POSITIVE_INFINITY;
        const sourceRect = source.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        const sourceCenterX = sourceRect.left + sourceRect.width / 2;
        const sourceCenterY = sourceRect.top + sourceRect.height / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        return Math.abs(sourceCenterX - targetCenterX) + Math.abs(sourceCenterY - targetCenterY);
    }

    function getComposerAnchors(context) {
        const doc = context.document || document;
        const anchors = [];
        const seen = new Set();

        for (const selector of PRIORITY_SEND_BUTTON_SELECTORS) {
            const buttons = doc.querySelectorAll(selector);
            buttons.forEach((button) => {
                if (seen.has(button)) return;
                if (!context.helpers.isVisible(button)) return;
                seen.add(button);
                anchors.push(button);
            });
        }

        return anchors;
    }

    function computeInputScore(context, element, mode, baseScore, anchors) {
        let score = baseScore;
        const placeholder = String(element.getAttribute('placeholder') || '');
        const placeholderLower = placeholder.toLowerCase();
        const className = String(element.className || '').toLowerCase();
        const maxLength = parseNumber(element.getAttribute('maxlength'));
        const rect = element.getBoundingClientRect();

        if (mode === 'textarea') score += 8;
        if (placeholder.includes('医疗')) score += 100;
        if (placeholder.includes('问题')) score += 40;
        if (placeholder.includes('百川') || placeholder.includes('百小应')) score += 25;
        if (placeholder.includes('请输入')) score += 15;
        if (placeholderLower.includes('search') || placeholder.includes('搜索')) score -= 60;

        if (maxLength >= 12000) score += 60;
        else if (maxLength >= 4000) score += 30;
        else if (maxLength > 0 && maxLength < 500) score -= 20;

        if (className.includes('caret-brand-main')) score += 28;
        if (className.includes('bc-scrollbar')) score += 16;
        if (className.includes('editor')) score += 12;

        if (rect.width >= 420) score += 15;
        if (rect.height >= 20) score += 8;
        if (rect.y >= window.innerHeight * 0.25) score += 6;

        let bestDistance = Number.POSITIVE_INFINITY;
        for (const anchor of anchors) {
            const distance = getElementDistance(element, anchor);
            if (distance < bestDistance) bestDistance = distance;
        }

        if (Number.isFinite(bestDistance)) {
            if (bestDistance <= 120) score += 42;
            else if (bestDistance <= 220) score += 28;
            else if (bestDistance <= 360) score += 14;
        }

        return { score, distance: bestDistance };
    }

    function findInputTargetByPriority(context) {
        const anchors = getComposerAnchors(context);
        let best = null;

        for (const strategy of INPUT_STRATEGIES) {
            const nodes = context.document.querySelectorAll(strategy.selector);
            for (const element of nodes) {
                if (!context.helpers.isValidInput(element, strategy.mode)) continue;

                const scored = computeInputScore(context, element, strategy.mode, strategy.priority, anchors);
                if (
                    !best
                    || scored.score > best.score
                    || (scored.score === best.score && scored.distance < best.distance)
                ) {
                    best = {
                        element,
                        mode: strategy.mode,
                        selector: strategy.selector,
                        provider: 'hook',
                        score: scored.score,
                        distance: scored.distance
                    };
                }
            }
        }

        return best;
    }

    function getButtonLabelText(button) {
        return [
            button.getAttribute('aria-label'),
            button.getAttribute('title'),
            button.getAttribute('data-testid'),
            button.getAttribute('id'),
            String(button.className || ''),
            button.textContent
        ].filter(Boolean).join(' ');
    }

    function getKeywordScore(context, text, keywords) {
        const normalizedText = context.normalizeText(text);
        if (!normalizedText) return 0;

        let best = 0;
        for (const keyword of keywords) {
            const normalizedKeyword = context.normalizeText(keyword);
            if (!normalizedKeyword) continue;
            if (normalizedText.includes(normalizedKeyword)) {
                best = Math.max(best, normalizedKeyword.length);
            }
        }
        return best;
    }

    function getButtonClassScore(button) {
        const className = String(button.className || '').toLowerCase();
        let score = 0;

        if (className.includes('self-end')) score += 260;
        if (className.includes('send')) score += 140;
        if (className.includes('submit')) score += 120;
        if (className.includes('group')) score += 30;
        return score;
    }

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
            addScope(targetElement.closest('[class*="input"]'));
            addScope(targetElement.closest('[class*="chat"]'));
            addScope(targetElement.parentElement);
            addScope(targetElement.closest('main'));
        }

        if (rootElement && rootElement !== doc) {
            addScope(rootElement);
        }

        addScope(doc);
        return scopes;
    }

    function findPrioritySendButton(context, rootElement, targetElement) {
        const doc = context.document || document;
        const scopes = collectSearchScopes(doc, rootElement, targetElement);
        let best = null;

        for (const scope of scopes) {
            const uniqueButtons = new Set();
            for (const selector of PRIORITY_SEND_BUTTON_SELECTORS) {
                const buttons = scope.querySelectorAll(selector);
                buttons.forEach((button) => uniqueButtons.add(button));
            }

            for (const button of uniqueButtons) {
                if (!context.helpers.isVisible(button) || !context.helpers.isEnabled(button)) continue;

                const label = getButtonLabelText(button);
                const stopScore = getKeywordScore(context, label, STOP_WORDS);
                if (stopScore > 0) continue;

                const labelScore = getKeywordScore(context, label, SEND_WORDS);
                const classScore = getButtonClassScore(button);
                const isSubmitButton = String(button.getAttribute('type') || '').toLowerCase() === 'submit';
                if (!isSubmitButton && labelScore <= 0 && classScore <= 0) continue;

                const distance = getElementDistance(button, targetElement);
                const score = classScore + labelScore + (isSubmitButton ? 80 : 0);

                if (!best || score > best.score || (score === best.score && distance < best.distance)) {
                    best = {
                        button,
                        selector: '(baichuan-priority)',
                        score,
                        labelScore,
                        selectorScore: classScore,
                        distance
                    };
                }
            }

            if (best) return best;
        }

        return null;
    }

    register({
        name: 'Baichuan',
        hosts: ['ying.baichuan-ai.com', 'chat.baichuan-ai.com', 'baichuan-ai.com', 'www.baichuan-ai.com'],
        inputStrategies: INPUT_STRATEGIES.map((strategy) => ({
            selector: strategy.selector,
            mode: strategy.mode
        })),
        sendButtonSelectors: [
            'button.group.self-end',
            'button[class*="self-end"]',
            'button[data-testid*="send"]',
            'button[data-testid*="submit"]',
            'button[aria-label*="发送"]',
            'button[aria-label*="提交"]',
            'button[aria-label*="Send"]',
            'button[title*="发送"]',
            'button[title*="提交"]'
        ],
        sendKeywords: ['发送', '提交', 'send', 'submit', '问诊'],
        sendDelayMs: 300,
        sendRetryAttempts: 12,
        sendRetryIntervalMs: 180,
        hooks: {
            findInputTarget(context) {
                const fastMatch = findInputTargetByPriority(context);
                if (fastMatch && fastMatch.element) return fastMatch;
                return context.helpers.findInputTargetDefault();
            },
            findSendButton(context, rootElement, targetElement) {
                const fastMatch = findPrioritySendButton(context, rootElement, targetElement);
                if (fastMatch && fastMatch.button) return fastMatch;

                if (rootElement && rootElement !== context.document) {
                    const scopedMatch = context.helpers.findSendButtonDefault(rootElement, targetElement);
                    if (scopedMatch) return scopedMatch;
                }

                return context.helpers.findSendButtonDefault(context.document || document, targetElement);
            }
        }
    });
})();
