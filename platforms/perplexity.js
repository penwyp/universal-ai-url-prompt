(function() {
    'use strict';

    const register = globalThis.__UAUP_REGISTER_PLATFORM__;
    if (typeof register !== 'function') return;

    const PRIORITY_INPUT_SELECTORS = [
        'div#ask-input[contenteditable="true"][data-lexical-editor="true"]',
        'div#ask-input[contenteditable="true"]',
        'div[contenteditable="true"][data-lexical-editor="true"][role="textbox"]',
        'div[contenteditable="true"][data-testid*="ask" i]',
        'div[contenteditable="true"][role="textbox"]'
    ];

    function selectEditableContents(editable) {
        const selection = window.getSelection();
        if (!selection) return;

        const range = document.createRange();
        range.selectNodeContents(editable);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function normalizeEditableText(value) {
        return String(value || '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function applyEditableFallbackDom(editable, text) {
        editable.innerHTML = '';

        const paragraph = document.createElement('p');
        paragraph.setAttribute('dir', 'auto');

        if (text) {
            const span = document.createElement('span');
            span.setAttribute('data-lexical-text', 'true');
            span.textContent = text;
            paragraph.appendChild(span);
        } else {
            paragraph.appendChild(document.createElement('br'));
        }

        editable.appendChild(paragraph);
    }

    function hasExpectedEditableText(editable, expectedText) {
        return normalizeEditableText(editable.textContent) === normalizeEditableText(expectedText);
    }

    function injectLexicalText(editable, text) {
        editable.focus();
        selectEditableContents(editable);

        let execInserted = false;
        try {
            execInserted = document.execCommand('insertText', false, text);
        } catch (error) {
            execInserted = false;
        }

        if (hasExpectedEditableText(editable, text)) {
            return true;
        }

        if (execInserted) {
            // In some builds, execCommand applies asynchronously.
            // Let the runtime-level verification confirm the final state before retrying.
            return true;
        }

        applyEditableFallbackDom(editable, text);
        editable.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        editable.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        return hasExpectedEditableText(editable, text);
    }

    function findPriorityInputTarget(context) {
        const doc = context.document || document;

        for (const selector of PRIORITY_INPUT_SELECTORS) {
            const candidates = Array.from(doc.querySelectorAll(selector));
            const target = candidates.find((element) => context.helpers.isValidInput(element, 'contenteditable'));
            if (!target) continue;

            return {
                element: target,
                mode: 'contenteditable',
                selector,
                provider: 'perplexity-priority'
            };
        }

        return null;
    }

    register({
        name: 'Perplexity',
        hosts: ['perplexity.ai', 'www.perplexity.ai'],
        inputStrategies: [
            { selector: 'div#ask-input[contenteditable="true"][data-lexical-editor="true"]', mode: 'contenteditable' },
            { selector: 'div#ask-input[contenteditable="true"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][data-lexical-editor="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][data-lexical-editor="true"]', mode: 'contenteditable' },
            { selector: 'textarea[data-testid*="ask" i]', mode: 'textarea' },
            { selector: 'textarea[data-testid*="chat" i]', mode: 'textarea' },
            { selector: 'textarea[aria-label*="ask" i]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="ask" i]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="anything" i]', mode: 'textarea' },
            { selector: 'textarea[placeholder*="search" i]', mode: 'textarea' },
            { selector: 'div[contenteditable="true"][data-testid*="ask" i]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"][class*="ProseMirror"]', mode: 'contenteditable' },
            { selector: 'div[contenteditable="true"]', mode: 'contenteditable' },
            { selector: 'textarea', mode: 'textarea' }
        ],
        sendButtonSelectors: [
            'button[data-testid*="ask" i]',
            'button[data-testid*="send" i]',
            'button[data-testid*="submit" i]',
            'button[aria-label*="ask" i]',
            'button[aria-label*="send" i]',
            'button[aria-label*="submit" i]',
            'button[title*="ask" i]',
            'button[title*="send" i]',
            'button[title*="submit" i]',
            'button[type="submit"]',
            '[role="button"][aria-label*="ask" i]',
            '[role="button"][aria-label*="send" i]',
            '[role="button"][aria-label*="submit" i]'
        ],
        sendKeywords: ['send', 'ask', 'submit', '发送', '询问'],
        sendDelayMs: 320,
        sendRetryAttempts: 12,
        sendRetryIntervalMs: 220,
        hooks: {
            findInputTarget(context) {
                const priorityTarget = findPriorityInputTarget(context);
                if (priorityTarget) return priorityTarget;
                return context.helpers.findInputTargetDefault();
            },
            injectText(context, target, text) {
                if (!target || !target.element || target.mode !== 'contenteditable') {
                    return context.helpers.injectTextDefault(target, text);
                }

                const editable = target.element;
                const lexicalEditor = editable.getAttribute('data-lexical-editor') === 'true' || editable.id === 'ask-input';
                if (!lexicalEditor) {
                    return context.helpers.injectTextDefault(target, text);
                }

                if (injectLexicalText(editable, text)) {
                    return true;
                }

                return context.helpers.injectTextDefault(target, text);
            }
        }
    });
})();
