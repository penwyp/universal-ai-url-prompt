(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    function createInputEvent(type, text) {
        try {
            return new InputEvent(type, {
                bubbles: true,
                cancelable: true,
                data: text,
                inputType: 'insertText'
            });
        } catch (error) {
            return new Event(type, { bubbles: true, cancelable: true });
        }
    }

    function selectEditableContents(editable) {
        const selection = window.getSelection();
        if (!selection) return;

        const range = document.createRange();
        range.selectNodeContents(editable);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function isSlateEditable(editable) {
        if (!editable || editable.getAttribute('contenteditable') === 'false') return false;
        if (editable.getAttribute('data-slate-editor') === 'true') return true;
        if (editable.hasAttribute('data-slate-node')) return true;
        return !!editable.querySelector('[data-slate-node]');
    }

    function injectSlateText(editable, text) {
        editable.focus();
        selectEditableContents(editable);
        editable.dispatchEvent(createInputEvent('beforeinput', text));
        editable.dispatchEvent(createInputEvent('input', text));
        editable.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        return true;
    }

    function getSlatePlainText(editable) {
        if (!editable || typeof editable.cloneNode !== 'function') return '';

        const clone = editable.cloneNode(true);
        if (typeof clone.querySelectorAll === 'function') {
            clone.querySelectorAll('[data-slate-placeholder="true"]').forEach((node) => node.remove());
            clone.querySelectorAll('[data-slate-zero-width]').forEach((node) => node.remove());
        }

        return (clone.textContent || '').replace(/[\s\u200B-\u200D\uFEFF]+/g, '');
    }

    function hasSendTriggeredEvent() {
        const debug = globalThis.__UAUP_DEBUG__;
        const events = debug && Array.isArray(debug.events) ? debug.events : [];
        for (let index = events.length - 1; index >= 0; index -= 1) {
            if (events[index].stage === 'send_triggered') {
                return true;
            }
        }
        return false;
    }

    const SEND_WORDS = ['发送', '提交', 'send', 'submit', 'ask'];
    const STOP_WORDS = ['停止', '取消', '终止', 'stop', 'cancel', 'abort'];
    const NON_SEND_WORDS = [
        '上传', '附件', '图片', '图像', '相册', '语音', '麦克风', '录音', '工具', '设置', '搜索', '历史', '清空', '删除',
        'upload', 'attach', 'image', 'photo', 'voice', 'microphone', 'tool', 'setting', 'search', 'history', 'clear', 'delete'
    ];
    const PRIORITY_SEND_CONTROL_SELECTORS = [
        'button[data-testid*="send"]',
        'button[data-testid*="submit"]',
        'button[aria-label*="发送"]',
        'button[aria-label*="提交"]',
        'button[aria-label*="Send"]',
        'button[title*="发送"]',
        'button[title*="提交"]',
        'button[class*="send"]',
        'button[class*="submit"]',
        '[role="button"][aria-label*="发送"]',
        '[role="button"][aria-label*="提交"]',
        '[role="button"][aria-label*="Send"]',
        '[role="button"][title*="发送"]',
        'div[role="button"][class*="send"]',
        'div[role="button"][class*="submit"]',
        'div[class*="send"]',
        'div[class*="submit"]',
        'span[role="button"][class*="send"]',
        'span[role="button"][class*="submit"]'
    ];
    const GENERIC_ACTION_CONTROL_SELECTORS = [
        'button',
        '[role="button"]',
        'div[tabindex]',
        'span[tabindex]'
    ];

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

    function getControlLabelText(control) {
        return [
            control.getAttribute('aria-label'),
            control.getAttribute('title'),
            control.getAttribute('data-testid'),
            control.getAttribute('id'),
            String(control.className || ''),
            control.textContent
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

    function hasKeyword(context, text, keywords) {
        return getKeywordScore(context, text, keywords) > 0;
    }

    function getControlClassScore(control) {
        const className = String(control.className || '').toLowerCase();
        let score = 0;
        if (className.includes('send')) score += 220;
        if (className.includes('submit')) score += 180;
        if (className.includes('primary')) score += 42;
        if (className.includes('action')) score += 28;
        if (className.includes('control')) score += 18;
        if (className.includes('enter')) score += 80;
        if (className.includes('btn')) score += 20;
        return score;
    }

    function isControlDisabled(control) {
        const className = String(control.className || '').toLowerCase();
        if (className.includes('disabled') || className.includes('disable')) return true;
        if (className.includes('forbid') || className.includes('ban')) return true;

        if (control.getAttribute('aria-disabled') === 'true') return true;
        if (control.getAttribute('data-disabled') === 'true') return true;
        if (control.getAttribute('disabled') === 'true') return true;
        if (control.hasAttribute('disabled')) return true;

        return false;
    }

    function isWenxiaoyanControl(element) {
        if (!element || typeof element.matches !== 'function') return false;
        return element.matches([
            'button',
            '[role="button"]',
            '[data-testid*="send"]',
            '[data-testid*="submit"]',
            '[class*="send"]',
            '[class*="submit"]',
            '[class*="action"]'
        ].join(','));
    }

    function isElementEnabledForPlatform(element) {
        if (!element) return false;
        if (element.disabled) return false;
        if (element.getAttribute('aria-disabled') === 'true') return false;
        if (element.getAttribute('data-disabled') === 'true') return false;
        if (element.getAttribute('disabled') === 'true') return false;
        if (element.hasAttribute('disabled')) return false;
        if (isWenxiaoyanControl(element) && isControlDisabled(element)) return false;
        return true;
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
            addScope(targetElement.closest('[class*="editor"]'));
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

    function findImplicitSendControl(context, targetElement) {
        if (!targetElement) return null;

        const doc = context.document || document;
        const inputRect = targetElement.getBoundingClientRect();
        const scope = targetElement.closest('form')
            || targetElement.closest('[class*="editor"]')
            || targetElement.closest('[class*="input"]')
            || targetElement.closest('[class*="chat"]')
            || targetElement.parentElement
            || doc;

        const uniqueControls = new Set();
        for (const selector of GENERIC_ACTION_CONTROL_SELECTORS) {
            const nodes = scope.querySelectorAll(selector);
            nodes.forEach((node) => uniqueControls.add(node));
        }

        let best = null;

        for (const control of uniqueControls) {
            if (control === targetElement) continue;
            if (targetElement.contains(control) || control.contains(targetElement)) continue;
            if (!context.helpers.isVisible(control)) continue;
            if (!context.helpers.isEnabled(control)) continue;
            if (isControlDisabled(control)) continue;

            const labelText = getControlLabelText(control);
            if (hasKeyword(context, labelText, STOP_WORDS)) continue;
            if (hasKeyword(context, labelText, NON_SEND_WORDS)) continue;

            const distance = getElementDistance(control, targetElement);
            if (!Number.isFinite(distance) || distance > 520) continue;

            const rect = control.getBoundingClientRect();
            const area = rect.width * rect.height;
            const isRightSide = rect.left >= inputRect.left + inputRect.width * 0.45;
            const nearInputBand = rect.bottom >= inputRect.top - 30 && rect.top <= inputRect.bottom + 90;
            const afterInput = !!(targetElement.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING);

            let score = 620 - distance;
            if (isRightSide) score += 140;
            if (nearInputBand) score += 90;
            if (afterInput) score += 40;
            if (area >= 180 && area <= 4500) score += 35;
            if (rect.top + rect.height < inputRect.top - 40) score -= 160;
            if (rect.left + rect.width < inputRect.left - 20) score -= 140;

            if (!best || score > best.score || (score === best.score && distance < best.distance)) {
                best = {
                    button: control,
                    selector: '(wenxiaoyan-implicit)',
                    score,
                    labelScore: 0,
                    selectorScore: 0,
                    distance
                };
            }
        }

        if (!best || best.score < 160) return null;
        return best;
    }

    function findPrioritySendControl(context, rootElement, targetElement) {
        const doc = context.document || document;
        const scopes = collectSearchScopes(doc, rootElement, targetElement);
        let best = null;

        for (const scope of scopes) {
            const candidates = new Set();

            for (const selector of PRIORITY_SEND_CONTROL_SELECTORS) {
                const controls = scope.querySelectorAll(selector);
                controls.forEach((control) => candidates.add(control));
            }

            for (const control of candidates) {
                if (!context.helpers.isVisible(control)) continue;
                if (!context.helpers.isEnabled(control)) continue;
                if (isControlDisabled(control)) continue;

                const labelText = getControlLabelText(control);
                const stopScore = getKeywordScore(context, labelText, STOP_WORDS);
                if (stopScore > 0) continue;

                const labelScore = getKeywordScore(context, labelText, SEND_WORDS);
                const classScore = getControlClassScore(control);
                const isSubmitControl = String(control.getAttribute('type') || '').toLowerCase() === 'submit';
                if (!isSubmitControl && labelScore <= 0 && classScore <= 0) continue;

                const distance = getElementDistance(control, targetElement);
                const proximityScore = Number.isFinite(distance) ? Math.max(0, 140 - Math.min(distance, 1400) / 10) : 0;
                const targetRect = targetElement ? targetElement.getBoundingClientRect() : null;
                const controlRect = control.getBoundingClientRect();
                const isRightSide = targetRect
                    ? controlRect.left >= targetRect.left + targetRect.width * 0.5
                    : false;
                const nearInputBand = targetRect
                    ? controlRect.bottom >= targetRect.top - 36 && controlRect.top <= targetRect.bottom + 96
                    : false;
                const afterInput = targetElement
                    ? !!(targetElement.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING)
                    : false;

                let score = labelScore * 120 + classScore + (isSubmitControl ? 80 : 0) + proximityScore;
                if (isRightSide) score += 90;
                if (nearInputBand) score += 50;
                if (afterInput) score += 20;

                if (!best || score > best.score || (score === best.score && distance < best.distance)) {
                    best = {
                        button: control,
                        selector: '(wenxiaoyan-priority)',
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
        name: 'Wenxiaoyan',
        hosts: ['yiyan.baidu.com', 'wenxiaoyan.baidu.com', 'chat.baidu.com'],
        inputStrategies: [
            { selector: 'div[contenteditable="true"][data-slate-editor="true"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"][class*="editable"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][data-testid*="chat"]', mode: 'contenteditable' },
            { selector: 'textarea[data-testid*="chat"]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="input"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="文心"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="小言"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="输入"]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="发送"]', mode: 'textarea' },
            { selector: 'textarea', mode: 'textarea' }
        ],
        sendButtonSelectors: [
            'button[data-testid*="send"]',
            'button[data-testid*="submit"]',
            'button[aria-label*="发送"]',
            'button[aria-label*="提交"]',
            'button[title*="发送"]',
            'button[title*="提交"]',
            'button[class*="send"]',
            'button[class*="submit"]',
            '[role="button"][aria-label*="发送"]',
            '[role="button"][aria-label*="提交"]',
            '[role="button"][aria-label*="Send"]',
            'div[role="button"][class*="send"]',
            'div[role="button"][class*="submit"]',
            'div[class*="send"]',
            'div[class*="submit"]'
        ],
        sendKeywords: ['发送', '提交', 'send', 'submit'],
        sendDelayMs: 70,
        sendRetryAttempts: 16,
        sendRetryIntervalMs: 100,
        hooks: {
            isEnabled(context, element) {
                return isElementEnabledForPlatform(element);
            },
            findSendButton(context, rootElement, targetElement) {
                const fastMatch = findPrioritySendControl(context, rootElement, targetElement);
                if (fastMatch && fastMatch.button) return fastMatch;

                const implicitMatch = findImplicitSendControl(context, targetElement);
                if (implicitMatch && implicitMatch.button) return implicitMatch;

                if (rootElement && rootElement !== context.document) {
                    const scopedMatch = context.helpers.findSendButtonDefault(rootElement, targetElement);
                    if (scopedMatch) return scopedMatch;
                }

                return context.helpers.findSendButtonDefault(context.document || document, targetElement);
            },
            injectText(context, target, text) {
                if (!target || !target.element || target.mode !== 'contenteditable') {
                    return context.helpers.injectTextDefault(target, text);
                }

                if (!isSlateEditable(target.element)) {
                    return context.helpers.injectTextDefault(target, text);
                }

                return injectSlateText(target.element, text);
            },
            confirmSent(context, latestTarget) {
                if (!latestTarget || !latestTarget.element || latestTarget.mode !== 'contenteditable') {
                    return context.helpers.confirmSentDefault(latestTarget);
                }

                const submitTarget = context.helpers.resolveSubmitTarget(latestTarget);
                if (!isSlateEditable(submitTarget)) {
                    return context.helpers.confirmSentDefault(latestTarget);
                }

                const plainText = getSlatePlainText(submitTarget);
                if (!hasSendTriggeredEvent()) {
                    return false;
                }

                if (plainText.length === 0) {
                    return true;
                }

                return context.helpers.confirmSentDefault(latestTarget);
            }
        }
    });
})();
