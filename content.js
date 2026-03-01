(function() {
    'use strict';

    const SCRIPT_VERSION = '2026-03-01-strict-runtime-1';
    const root = globalThis;
    const LOG_PREFIX = '[Universal AI URL Prompt]';
    let currentConfig = null;

    if (root.__UNIVERSAL_AI_URL_PROMPT_LOADED__) {
        console.log(`${LOG_PREFIX}[lifecycle] script already loaded, skip duplicate run.`);
        return;
    }

    root.__UNIVERSAL_AI_URL_PROMPT_LOADED__ = true;
    root.__UNIVERSAL_AI_URL_PROMPT_HOST__ = window.location.hostname;
    document.documentElement.setAttribute('data-uaup-loaded', '1');
    document.documentElement.setAttribute('data-uaup-version', SCRIPT_VERSION);

    if (!root.__UAUP_DEBUG__ || typeof root.__UAUP_DEBUG__ !== 'object') {
        root.__UAUP_DEBUG__ = { events: [] };
    }

    function pushDebugEvent(event) {
        if (!Array.isArray(root.__UAUP_DEBUG__.events)) {
            root.__UAUP_DEBUG__.events = [];
        }
        root.__UAUP_DEBUG__.events.push(event);
        if (root.__UAUP_DEBUG__.events.length > 300) {
            root.__UAUP_DEBUG__.events.shift();
        }
    }

    function logEvent(stage, message, meta = {}) {
        const event = {
            ts: Date.now(),
            stage,
            message,
            platform: currentConfig ? currentConfig.name : null,
            host: window.location.hostname,
            meta
        };

        pushDebugEvent(event);
        console.log(`${LOG_PREFIX}[${stage}] ${message}`, meta);
    }

    // Global send-button keywords: core languages plus extended language coverage.
    const LANGUAGE_SEND_KEYWORDS = {
        en: ['send', 'submit'],
        zhHans: ['发送', '提交'],
        zhHant: ['發送', '傳送', '送出'],
        es: ['enviar'],
        hi: ['भेजें', 'भेजना'],
        ar: ['إرسال'],
        fr: ['envoyer'],
        pt: ['enviar'],
        ru: ['отправить'],
        ja: ['送信']
    };

    const LANGUAGE_STOP_KEYWORDS = {
        en: ['stop', 'cancel', 'abort'],
        zhHans: ['停止', '取消', '终止'],
        zhHant: ['停止', '取消', '終止'],
        es: ['detener', 'cancelar'],
        hi: ['रोकें', 'रद्द करें'],
        ar: ['إيقاف', 'إلغاء'],
        fr: ['arrêter', 'annuler'],
        pt: ['parar', 'cancelar'],
        ru: ['стоп', 'остановить', 'отмена'],
        ja: ['停止', 'キャンセル']
    };

    // Keep broad language coverage while guaranteeing core support:
    // English / Chinese (Simplified + Traditional) / Japanese / Spanish.
    const CORE_SEND_LANGUAGE_KEYWORDS = {
        en: ['send', 'submit'],
        zhHans: ['发送', '提交'],
        zhHant: ['發送', '傳送', '送出'],
        ja: ['送信'],
        es: ['enviar']
    };

    const CORE_STOP_LANGUAGE_KEYWORDS = {
        en: ['stop', 'cancel', 'abort'],
        zhHans: ['停止', '取消', '终止'],
        zhHant: ['停止', '取消', '終止'],
        ja: ['停止', 'キャンセル'],
        es: ['detener', 'cancelar']
    };

    function ensureCoreLanguageKeywords(keywordMap, coreKeywordMap, keywordType) {
        const mergedMap = {};

        for (const [language, keywords] of Object.entries(keywordMap || {})) {
            mergedMap[language] = Array.isArray(keywords) ? [...keywords] : [];
        }

        for (const [language, coreKeywords] of Object.entries(coreKeywordMap || {})) {
            const currentKeywords = Array.isArray(mergedMap[language]) ? mergedMap[language] : [];
            const mergedKeywords = Array.from(new Set([...currentKeywords, ...(coreKeywords || [])].filter(Boolean)));

            if (mergedKeywords.length > currentKeywords.length) {
                console.warn(
                    `${LOG_PREFIX}[i18n_guard] extended ${keywordType} keywords for "${language}" with core defaults.`
                );
            }

            mergedMap[language] = mergedKeywords;
        }

        return mergedMap;
    }

    const EFFECTIVE_LANGUAGE_SEND_KEYWORDS = ensureCoreLanguageKeywords(
        LANGUAGE_SEND_KEYWORDS,
        CORE_SEND_LANGUAGE_KEYWORDS,
        'send'
    );

    const EFFECTIVE_LANGUAGE_STOP_KEYWORDS = ensureCoreLanguageKeywords(
        LANGUAGE_STOP_KEYWORDS,
        CORE_STOP_LANGUAGE_KEYWORDS,
        'stop'
    );

    const GLOBAL_SEND_KEYWORDS = Array.from(new Set(Object.values(EFFECTIVE_LANGUAGE_SEND_KEYWORDS).flat()));
    const GLOBAL_STOP_KEYWORDS = Array.from(new Set(Object.values(EFFECTIVE_LANGUAGE_STOP_KEYWORDS).flat()));

    const DEFAULT_INPUT_STRATEGIES = [
        { selector: 'textarea#prompt-textarea', mode: 'textarea' },
        { selector: 'textarea[data-testid*="prompt"]', mode: 'textarea' },
        { selector: 'textarea[data-testid*="chat"]', mode: 'textarea' },
        { selector: 'textarea[id*="chat"]', mode: 'textarea' },
        { selector: 'textarea[placeholder]', mode: 'textarea' },
        { selector: 'textarea', mode: 'textarea' },
        { selector: '[contenteditable="true"][role="textbox"]', mode: 'contenteditable' },
        { selector: 'div[contenteditable="true"]', mode: 'contenteditable' },
        { selector: 'rich-textarea [contenteditable="true"]', mode: 'contenteditable' },
        { selector: 'rich-textarea p', mode: 'rich-paragraph' }
    ];

    const DEFAULT_SEND_BUTTON_SELECTORS = [
        'button[aria-label]',
        'button[data-testid*="send"]',
        'button[data-testid*="submit"]',
        'button[mattooltip]',
        'button[data-tooltip]',
        'button[title]',
        'button[type="submit"]',
        'button[class*="send"]',
        'button[class*="submit"]',
        'button'
    ];

    const DEFAULT_RUNTIME_FLAGS = Object.freeze({
        strictRuntime: true,
        allowGenericFallback: false
    });

    function resolveRuntimeFlags() {
        const rawFlags = root.__UAUP_RUNTIME_FLAGS__;
        if (!rawFlags || typeof rawFlags !== 'object') {
            return DEFAULT_RUNTIME_FLAGS;
        }

        const strictRuntime = typeof rawFlags.strictRuntime === 'boolean'
            ? rawFlags.strictRuntime
            : DEFAULT_RUNTIME_FLAGS.strictRuntime;
        const allowGenericFallback = typeof rawFlags.allowGenericFallback === 'boolean'
            ? rawFlags.allowGenericFallback
            : !strictRuntime;

        return {
            strictRuntime,
            allowGenericFallback
        };
    }

    const RUNTIME_FLAGS = resolveRuntimeFlags();

    const PLATFORM_DEFS = Array.isArray(root.__UAUP_PLATFORM_DEFS__) ? root.__UAUP_PLATFORM_DEFS__ : [];

    if (!PLATFORM_DEFS.length) {
        logEvent('bootstrap_error', 'no platform definitions registered');
        return;
    }

    function buildSiteConfigs(platforms) {
        const configs = {};

        for (const platform of platforms) {
            const platformInputStrategies = Array.isArray(platform.inputStrategies) ? platform.inputStrategies : [];
            const platformSendButtonSelectors = Array.isArray(platform.sendButtonSelectors)
                ? platform.sendButtonSelectors
                : [];

            const inputStrategies = (RUNTIME_FLAGS.allowGenericFallback && platformInputStrategies.length === 0)
                ? DEFAULT_INPUT_STRATEGIES
                : platformInputStrategies;
            const sendButtonSelectors = (RUNTIME_FLAGS.allowGenericFallback && platformSendButtonSelectors.length === 0)
                ? DEFAULT_SEND_BUTTON_SELECTORS
                : platformSendButtonSelectors;

            if (inputStrategies.length === 0 || sendButtonSelectors.length === 0) {
                console.warn(
                    `${LOG_PREFIX}[config_invalid] platform "${platform.name}" skipped: missing required strategies/selectors in strict runtime.`
                );
                continue;
            }

            const normalizedInputStrategies = inputStrategies.map((strategy) => ({
                selector: strategy.selector,
                mode: strategy.mode
            }));
            const normalizedSendButtonSelectors = Array.from(new Set(sendButtonSelectors));

            for (const host of platform.hosts) {
                if (configs[host]) {
                    console.warn(
                        `${LOG_PREFIX}[config_conflict] host "${host}" is already bound to "${configs[host].name}", skip "${platform.name}".`
                    );
                    continue;
                }

                configs[host] = {
                    name: platform.name,
                    hosts: platform.hosts,
                    inputStrategies: normalizedInputStrategies,
                    sendButtonSelectors: normalizedSendButtonSelectors,
                    sendKeywords: platform.sendKeywords || [],
                    stopKeywords: platform.stopKeywords || [],
                    sendDelayMs: platform.sendDelayMs || 260,
                    sendRetryAttempts: platform.sendRetryAttempts || 8,
                    sendRetryIntervalMs: platform.sendRetryIntervalMs || 200,
                    hooks: platform.hooks || {}
                };
            }
        }

        return configs;
    }

    const SITE_CONFIGS = buildSiteConfigs(PLATFORM_DEFS);
    const host = window.location.hostname;
    currentConfig = SITE_CONFIGS[host] || null;

    if (!currentConfig) {
        logEvent('host_skip', `unsupported host: ${host}`);
        return;
    }

    function normalizeText(text) {
        return String(text || '')
            .normalize('NFKC')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, '');
    }

    const normalizedSendKeywords = Array.from(
        new Set([...GLOBAL_SEND_KEYWORDS, ...currentConfig.sendKeywords].map(normalizeText).filter(Boolean))
    );
    const normalizedStopKeywords = Array.from(
        new Set([...GLOBAL_STOP_KEYWORDS, ...currentConfig.stopKeywords].map(normalizeText).filter(Boolean))
    );
    const PROMPT_PARAM_KEYS = ['prompt', 'q', 'p'];
    const PLATFORM_SETTINGS_STORAGE_KEY = 'platformEnabledByName';
    const CACHE_MESSAGE_TIMEOUT_MS = 600;
    let promptText = '';
    let autoSendRaw = '1';
    let shouldAutoSend = true;

    function getStorageArea() {
        if (!root.chrome || !root.chrome.storage) return null;
        if (root.chrome.storage.sync && typeof root.chrome.storage.sync.get === 'function') {
            return root.chrome.storage.sync;
        }
        if (root.chrome.storage.local && typeof root.chrome.storage.local.get === 'function') {
            return root.chrome.storage.local;
        }
        return null;
    }

    function normalizePlatformEnabledMap(rawMap) {
        const normalized = {};
        if (!rawMap || typeof rawMap !== 'object') return normalized;

        for (const [name, value] of Object.entries(rawMap)) {
            if (typeof value === 'boolean') {
                normalized[name] = value;
            }
        }

        return normalized;
    }

    function readPlatformEnabledMap() {
        const storageArea = getStorageArea();
        if (!storageArea) {
            return Promise.resolve({});
        }

        return new Promise((resolve) => {
            let finished = false;
            const done = (value) => {
                if (finished) return;
                finished = true;
                clearTimeout(timeoutId);
                resolve(value);
            };
            const timeoutId = setTimeout(() => done({}), CACHE_MESSAGE_TIMEOUT_MS);

            try {
                storageArea.get([PLATFORM_SETTINGS_STORAGE_KEY], (result) => {
                    if (root.chrome.runtime && root.chrome.runtime.lastError) {
                        done({});
                        return;
                    }

                    const rawMap = result && typeof result === 'object'
                        ? result[PLATFORM_SETTINGS_STORAGE_KEY]
                        : null;
                    done(normalizePlatformEnabledMap(rawMap));
                });
            } catch (error) {
                done({});
            }
        });
    }

    async function isCurrentPlatformEnabled() {
        const enabledMap = await readPlatformEnabledMap();
        const configured = enabledMap[currentConfig.name];
        if (typeof configured === 'boolean') {
            return configured;
        }
        return true;
    }

    function getSearchParamsFromUrl(urlLike) {
        if (!urlLike) return null;
        try {
            return new URL(urlLike, window.location.origin).searchParams;
        } catch (error) {
            return null;
        }
    }

    function resolvePromptParamsDefault() {
        const candidateUrls = [];
        const seen = new Set();

        const addCandidate = (urlLike, source) => {
            if (!urlLike || seen.has(urlLike)) return;
            seen.add(urlLike);
            candidateUrls.push({ urlLike, source });
        };

        addCandidate(window.location.href, 'location');

        try {
            const navigationEntries = performance.getEntriesByType('navigation');
            if (navigationEntries.length > 0 && navigationEntries[0].name) {
                addCandidate(navigationEntries[0].name, 'navigation');
            }
        } catch (error) {
            // Ignore unsupported performance APIs.
        }

        if (document.referrer) {
            addCandidate(document.referrer, 'referrer');
        }

        let fallbackParams = new URLSearchParams(window.location.search);

        for (const candidate of candidateUrls) {
            const parsedParams = getSearchParamsFromUrl(candidate.urlLike);
            if (!parsedParams) continue;
            fallbackParams = parsedParams;

            const promptValue = parsedParams.get('prompt') || parsedParams.get('q') || parsedParams.get('p');
            if (promptValue) {
                return {
                    params: parsedParams,
                    promptText: promptValue,
                    source: candidate.source
                };
            }
        }

        return {
            params: fallbackParams,
            promptText: '',
            source: 'none'
        };
    }

    function getPromptFromParams(params) {
        if (!params) return '';
        return params.get('prompt') || params.get('q') || params.get('p') || '';
    }

    function getParamsFromObject(rawParams) {
        const params = new URLSearchParams();
        if (!rawParams || typeof rawParams !== 'object') return params;

        for (const [key, value] of Object.entries(rawParams)) {
            if (typeof value !== 'string') continue;
            params.set(key, value);
        }

        return params;
    }

    function normalizeResolvedPrompt(resolvedPrompt) {
        const fallbackParams = new URLSearchParams(window.location.search);
        if (!resolvedPrompt || typeof resolvedPrompt !== 'object') {
            return {
                params: fallbackParams,
                promptText: '',
                source: 'none'
            };
        }

        const params = resolvedPrompt.params instanceof URLSearchParams
            ? resolvedPrompt.params
            : getParamsFromObject(resolvedPrompt.params);
        const promptValue = typeof resolvedPrompt.promptText === 'string'
            ? resolvedPrompt.promptText
            : getPromptFromParams(params);

        return {
            params,
            promptText: promptValue || '',
            source: typeof resolvedPrompt.source === 'string' && resolvedPrompt.source ? resolvedPrompt.source : 'none'
        };
    }

    function requestPromptFromBackground() {
        if (!root.chrome || !root.chrome.runtime || typeof root.chrome.runtime.sendMessage !== 'function') {
            return Promise.resolve(null);
        }

        return new Promise((resolve) => {
            let finished = false;
            const done = (value) => {
                if (finished) return;
                finished = true;
                clearTimeout(timeoutId);
                resolve(value);
            };
            const timeoutId = setTimeout(() => done(null), CACHE_MESSAGE_TIMEOUT_MS);

            try {
                root.chrome.runtime.sendMessage(
                    {
                        type: 'UAUP_GET_CACHED_PROMPT',
                        host,
                        href: window.location.href
                    },
                    (response) => {
                        if (root.chrome.runtime && root.chrome.runtime.lastError) {
                            done(null);
                            return;
                        }

                        if (!response || response.ok !== true || !response.record) {
                            done(null);
                            return;
                        }

                        const params = getParamsFromObject(response.record.params);
                        const cachedPromptText = typeof response.record.promptText === 'string'
                            ? response.record.promptText
                            : getPromptFromParams(params);

                        if (!cachedPromptText) {
                            done(null);
                            return;
                        }

                        const fallbackParams = new URLSearchParams(params.toString());
                        const promptParamKey = typeof response.record.promptParamKey === 'string'
                            ? response.record.promptParamKey
                            : '';
                        if (!getPromptFromParams(fallbackParams)) {
                            const safeKey = PROMPT_PARAM_KEYS.includes(promptParamKey) ? promptParamKey : 'prompt';
                            fallbackParams.set(safeKey, cachedPromptText);
                        }

                        done({
                            params: fallbackParams,
                            promptText: cachedPromptText,
                            source: `background:${response.record.source || 'cache'}`
                        });
                    }
                );
            } catch (error) {
                done(null);
            }
        });
    }

    function getHookContext(extra = {}) {
        return {
            config: currentConfig,
            host,
            document,
            window,
            normalizeText,
            log: logEvent,
            helpers: {
                isVisible,
                isEnabled,
                isValidInput,
                resolveSubmitTarget,
                findInputTargetDefault,
                findSendButtonDefault,
                injectTextDefault,
                confirmSentDefault,
                getTargetText,
                hasAnyPendingText,
                submitByForm,
                triggerButtonClick,
                pressEnter
            },
            ...extra
        };
    }

    function callHook(hookName, fallback, args = [], meta = {}) {
        const hook = currentConfig.hooks && currentConfig.hooks[hookName];
        if (typeof hook !== 'function') {
            return fallback(...args);
        }

        try {
            return hook(getHookContext(meta), ...args);
        } catch (error) {
            logEvent('hook_error', `${hookName} failed`, {
                hook: hookName,
                error: error instanceof Error ? error.message : String(error)
            });
            return fallback(...args);
        }
    }

    async function resolvePromptParams() {
        const localResolvedPrompt = normalizeResolvedPrompt(
            callHook('resolvePromptParams', resolvePromptParamsDefault)
        );
        if (localResolvedPrompt.promptText) {
            return localResolvedPrompt;
        }

        const backgroundResolvedPrompt = await requestPromptFromBackground();
        if (!backgroundResolvedPrompt) {
            return localResolvedPrompt;
        }

        return normalizeResolvedPrompt(backgroundResolvedPrompt);
    }

    async function bootstrap() {
        const platformEnabled = await isCurrentPlatformEnabled();
        if (!platformEnabled) {
            logEvent('platform_disabled', 'platform disabled by user options', {
                platform: currentConfig.name,
                host
            });
            return;
        }

        const resolvedPrompt = await resolvePromptParams();
        const params = resolvedPrompt && resolvedPrompt.params
            ? resolvedPrompt.params
            : new URLSearchParams(window.location.search);
        promptText = resolvedPrompt && typeof resolvedPrompt.promptText === 'string' ? resolvedPrompt.promptText : '';

        if (!promptText) {
            logEvent('prompt_skip', 'no prompt parameter found in URL');
            return;
        }

        if (resolvedPrompt && resolvedPrompt.source && resolvedPrompt.source !== 'location') {
            logEvent('prompt_resolved', `prompt parameter resolved from ${resolvedPrompt.source}`, {
                source: resolvedPrompt.source
            });
        }

        autoSendRaw = (params.get('autosend') || '1').toLowerCase();
        shouldAutoSend = !['0', 'false', 'no', 'off'].includes(autoSendRaw);

        logEvent('init', 'runtime initialized', {
            platform: currentConfig.name,
            host,
            shouldAutoSend,
            strictRuntime: RUNTIME_FLAGS.strictRuntime,
            allowGenericFallback: RUNTIME_FLAGS.allowGenericFallback,
            version: SCRIPT_VERSION
        });

        startInjectionFlow();
    }

    function isVisible(element) {
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function isEnabledDefault(element) {
        return !element.disabled && element.getAttribute('aria-disabled') !== 'true';
    }

    function isEnabled(element) {
        return !!callHook('isEnabled', isEnabledDefault, [element], { element });
    }

    function createInputEvent(text) {
        try {
            return new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                data: text,
                inputType: 'insertText'
            });
        } catch (error) {
            return new Event('input', { bubbles: true, cancelable: true });
        }
    }

    function dispatchInputEvents(element, text) {
        element.dispatchEvent(createInputEvent(text));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function setNativeTextareaValue(textarea, value) {
        const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
        if (descriptor && typeof descriptor.set === 'function') {
            descriptor.set.call(textarea, value);
        } else {
            textarea.value = value;
        }
    }

    function fillTextarea(textarea, text) {
        textarea.focus();
        setNativeTextareaValue(textarea, text);
        dispatchInputEvents(textarea, text);
    }

    function fillContentEditable(editable, text) {
        editable.focus();
        let inserted = false;

        try {
            const selection = window.getSelection();
            if (selection) {
                const range = document.createRange();
                range.selectNodeContents(editable);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            inserted = document.execCommand('insertText', false, text);
        } catch (error) {
            inserted = false;
        }

        if (inserted) {
            return;
        }

        editable.innerHTML = '';
        editable.textContent = text;
        dispatchInputEvents(editable, text);
    }

    function fillRichParagraph(paragraphElement, text) {
        const editable = paragraphElement.closest('[contenteditable="true"]');
        if (editable) {
            fillContentEditable(editable, text);
            return;
        }

        paragraphElement.textContent = text;
        dispatchInputEvents(paragraphElement, text);
    }

    function isValidInput(element, mode) {
        if (!element || !isVisible(element) || !isEnabled(element)) return false;
        if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
        if (mode === 'textarea') return !element.readOnly;
        if (mode === 'contenteditable' || mode === 'rich-paragraph') {
            return element.getAttribute('contenteditable') !== 'false';
        }
        return true;
    }

    function findInputTargetDefault() {
        for (const strategy of currentConfig.inputStrategies) {
            const candidates = Array.from(document.querySelectorAll(strategy.selector));
            const target = candidates.find((element) => isValidInput(element, strategy.mode));
            if (target) {
                return {
                    element: target,
                    mode: strategy.mode,
                    selector: strategy.selector,
                    provider: 'default'
                };
            }
        }
        return null;
    }

    function findInputTarget() {
        const result = callHook('findInputTarget', findInputTargetDefault);
        if (!result || !result.element || !result.mode) return null;

        if (!result.selector) {
            return {
                ...result,
                selector: '(hook)',
                provider: result.provider || 'hook'
            };
        }

        return result;
    }

    function getButtonLabels(button) {
        return [
            button.getAttribute('aria-label'),
            button.getAttribute('mattooltip'),
            button.getAttribute('data-tooltip'),
            button.getAttribute('title'),
            button.getAttribute('data-testid'),
            button.getAttribute('id'),
            String(button.className || ''),
            button.textContent
        ].filter(Boolean);
    }

    function getKeywordMatchScore(button, keywords) {
        const labels = getButtonLabels(button);
        let bestScore = 0;

        for (const label of labels) {
            const normalizedLabel = normalizeText(label);
            if (!normalizedLabel) continue;

            for (const keyword of keywords) {
                if (normalizedLabel.includes(keyword)) {
                    bestScore = Math.max(bestScore, keyword.length);
                }
            }
        }

        return bestScore;
    }

    function getSendMatchScore(button) {
        return getKeywordMatchScore(button, normalizedSendKeywords);
    }

    function getStopMatchScore(button) {
        return getKeywordMatchScore(button, normalizedStopKeywords);
    }

    function getSelectorMatchScore(selector) {
        const normalizedSelector = normalizeText(selector);
        if (!normalizedSelector) return 0;

        let bestScore = 0;
        for (const keyword of normalizedSendKeywords) {
            if (normalizedSelector.includes(keyword)) {
                bestScore = Math.max(bestScore, keyword.length);
            }
        }

        return bestScore;
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

    function findSendButtonDefault(rootElement = document, targetElement = null) {
        const uniqueButtons = new Set();
        const selectorScores = new Map();
        const selectorMap = new Map();

        for (const selector of currentConfig.sendButtonSelectors) {
            const selectorScore = getSelectorMatchScore(selector);
            const buttons = rootElement.querySelectorAll(selector);
            buttons.forEach((button) => {
                uniqueButtons.add(button);
                if (!selectorMap.has(button)) selectorMap.set(button, selector);

                if (selectorScore <= 0) return;
                const currentScore = selectorScores.get(button) || 0;
                if (selectorScore > currentScore) {
                    selectorScores.set(button, selectorScore);
                }
            });
        }

        let best = null;
        let fallback = null;

        for (const button of uniqueButtons) {
            if (!isVisible(button) || !isEnabled(button)) continue;
            if (getStopMatchScore(button) > 0) continue;

            const distance = getElementDistance(button, targetElement);
            const labelScore = getSendMatchScore(button);
            const selectorScore = selectorScores.get(button) || 0;
            const score = Math.max(labelScore, selectorScore);

            const candidate = {
                button,
                selector: selectorMap.get(button) || '(unknown)',
                score,
                labelScore,
                selectorScore,
                distance
            };

            if (button.getAttribute('type') === 'submit') {
                if (!fallback || distance < fallback.distance) {
                    fallback = candidate;
                }
            }

            if (score > 0 && (!best || score > best.score || (score === best.score && distance < best.distance))) {
                best = candidate;
            }
        }

        return best || fallback || null;
    }

    function findSendButton(rootElement = document, targetElement = null) {
        const result = callHook(
            'findSendButton',
            () => findSendButtonDefault(rootElement, targetElement),
            [rootElement, targetElement],
            { rootElement, targetElement }
        );

        if (!result) return null;
        if (result.button) return result;

        return {
            button: result,
            selector: '(hook)',
            score: 0,
            labelScore: 0,
            selectorScore: 0,
            distance: getElementDistance(result, targetElement)
        };
    }

    function pressEnter(element) {
        element.focus();
        for (const type of ['keydown', 'keypress', 'keyup']) {
            element.dispatchEvent(new KeyboardEvent(type, {
                bubbles: true,
                cancelable: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13
            }));
        }
    }

    function submitByForm(targetElement, submitter = null) {
        const form = targetElement.closest('form');
        if (!form) return false;

        if (typeof form.requestSubmit === 'function') {
            form.requestSubmit(submitter || undefined);
            return true;
        }

        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return true;
    }

    function triggerButtonClick(button) {
        button.focus();
        for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
            button.dispatchEvent(new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window
            }));
        }
        button.click();
    }

    function injectTextDefault(target, text) {
        if (target.mode === 'textarea') {
            fillTextarea(target.element, text);
            return true;
        }

        if (target.mode === 'contenteditable') {
            fillContentEditable(target.element, text);
            return true;
        }

        if (target.mode === 'rich-paragraph') {
            fillRichParagraph(target.element, text);
            return true;
        }

        return false;
    }

    function injectText(target, text) {
        return !!callHook('injectText', injectTextDefault, [target, text], { target, text });
    }

    function resolveSubmitTarget(target) {
        if (target.mode !== 'rich-paragraph') return target.element;
        return target.element.closest('[contenteditable="true"]') || target.element;
    }

    function getElementTextByMode(element, mode) {
        if (!element) return '';

        if (mode === 'textarea') {
            return element.value || element.textContent || '';
        }

        return element.textContent || '';
    }

    function getTargetText(target) {
        if (!target || !target.element) return '';
        const submitTarget = resolveSubmitTarget(target);
        return getElementTextByMode(submitTarget, target.mode);
    }

    function normalizeInjectedText(value) {
        return String(value || '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function hasInjectedPromptText(target, expectedText) {
        const normalizedExpected = normalizeInjectedText(expectedText);
        const normalizedActual = normalizeInjectedText(getTargetText(target));

        if (!normalizedExpected) {
            return normalizedActual.length === 0;
        }

        return normalizedActual.includes(normalizedExpected);
    }

    function hasAnyPendingText(fallbackTarget = null) {
        const candidates = [];
        const seen = new Set();

        const addCandidate = (candidate) => {
            if (!candidate || !candidate.element) return;
            if (seen.has(candidate.element)) return;
            seen.add(candidate.element);
            candidates.push(candidate);
        };

        addCandidate(fallbackTarget);

        for (const strategy of currentConfig.inputStrategies) {
            const elements = document.querySelectorAll(strategy.selector);
            elements.forEach((element) => addCandidate({ element, mode: strategy.mode }));
        }

        for (const candidate of candidates) {
            const { element, mode } = candidate;
            if (!isVisible(element)) continue;
            if (!isEnabled(element)) continue;
            if (mode === 'textarea' && element.readOnly) continue;

            const text = getElementTextByMode(resolveSubmitTarget(candidate), mode);
            if (text.replace(/[\s\u200B-\u200D\uFEFF]+/g, '').length > 0) {
                return true;
            }
        }

        return false;
    }

    function hasStopActionControl(targetElement = null) {
        const scopes = [];
        const seen = new Set();

        if (targetElement && typeof targetElement.closest === 'function') {
            const form = targetElement.closest('form');
            if (form) scopes.push(form);
        }
        scopes.push(document);

        for (const scope of scopes) {
            for (const selector of currentConfig.sendButtonSelectors) {
                const controls = scope.querySelectorAll(selector);
                for (const control of controls) {
                    if (seen.has(control)) continue;
                    seen.add(control);
                    if (!isVisible(control) || !isEnabled(control)) continue;
                    if (getStopMatchScore(control) <= 0) continue;
                    return true;
                }
            }
        }

        return false;
    }

    function confirmSentDefault(latestTarget) {
        if (!hasAnyPendingText(latestTarget)) return true;
        if (!latestTarget || !latestTarget.element) return false;
        return hasStopActionControl(resolveSubmitTarget(latestTarget));
    }

    function confirmSent(latestTarget) {
        return !!callHook('confirmSent', confirmSentDefault, [latestTarget], { latestTarget });
    }

    function resolveSendDelayMs(initialTarget) {
        const fallbackDelayMs = Math.max(0, Math.floor(currentConfig.sendDelayMs || 0));
        const resolved = callHook(
            'resolveSendDelayMs',
            () => fallbackDelayMs,
            [initialTarget, fallbackDelayMs],
            { initialTarget, fallbackDelayMs }
        );

        if (typeof resolved !== 'number' || !Number.isFinite(resolved)) {
            return fallbackDelayMs;
        }

        return Math.max(0, Math.floor(resolved));
    }

    function detectSendReadiness(initialTarget) {
        const activeTarget = findInputTarget() || initialTarget;
        if (!activeTarget || !activeTarget.element) {
            return {
                ready: false,
                reason: 'input_target_missing'
            };
        }

        const submitTarget = resolveSubmitTarget(activeTarget);
        if (hasStopActionControl(submitTarget)) {
            return {
                ready: false,
                reason: 'stop_control_active'
            };
        }

        const form = submitTarget.closest('form');
        const sendMatch = (form && findSendButton(form, submitTarget)) || findSendButton(document, submitTarget);
        if (sendMatch && sendMatch.button) {
            return {
                ready: true,
                reason: 'button_ready',
                selector: sendMatch.selector || '(unknown)'
            };
        }

        return {
            ready: false,
            reason: 'send_control_missing'
        };
    }

    function scheduleAutoSend(initialTarget) {
        const configuredDelayMs = resolveSendDelayMs(initialTarget);
        if (configuredDelayMs <= 0) {
            logEvent('autosend_schedule', 'auto-send scheduled without delay', {
                configuredDelayMs
            });
            tryAutoSend(initialTarget);
            return;
        }

        const startedAt = Date.now();
        const probeIntervalMs = Math.max(16, Math.min(80, Math.floor(configuredDelayMs / 4) || 16));
        let dispatched = false;
        let deadlineTimer = null;
        let probeTimer = null;

        const cleanupTimers = () => {
            if (deadlineTimer) clearTimeout(deadlineTimer);
            if (probeTimer) clearTimeout(probeTimer);
            deadlineTimer = null;
            probeTimer = null;
        };

        const dispatch = (trigger, meta = {}) => {
            if (dispatched) return;
            dispatched = true;
            cleanupTimers();

            logEvent('autosend_dispatch', 'auto-send dispatch started', {
                trigger,
                configuredDelayMs,
                waitedMs: Date.now() - startedAt,
                ...meta
            });

            tryAutoSend(initialTarget);
        };

        const runProbe = () => {
            if (dispatched) return;

            const waitedMs = Date.now() - startedAt;
            if (waitedMs >= configuredDelayMs) return;

            const readiness = detectSendReadiness(initialTarget);
            if (readiness.ready) {
                dispatch('ready_before_delay', readiness);
                return;
            }

            probeTimer = setTimeout(runProbe, probeIntervalMs);
        };

        logEvent('autosend_schedule', 'auto-send scheduler armed', {
            configuredDelayMs,
            probeIntervalMs
        });

        const initialReadiness = detectSendReadiness(initialTarget);
        if (initialReadiness.ready) {
            dispatch('ready_immediate', initialReadiness);
            return;
        }

        probeTimer = setTimeout(runProbe, probeIntervalMs);
        deadlineTimer = setTimeout(() => {
            dispatch('delay_elapsed');
        }, configuredDelayMs);
    }

    function tryAutoSend(initialTarget) {
        let attempts = 0;
        let hasClickedSubmitFallback = false;
        const clickedSelectorOnlyButtons = new WeakSet();
        let sendDispatchLocked = false;
        let hasEscalatedAfterLock = false;
        let firstDispatchPath = '';
        let firstDispatchAttempt = 0;
        const maxAttempts = Math.max(1, currentConfig.sendRetryAttempts || 8);
        const retryIntervalMs = Math.max(80, currentConfig.sendRetryIntervalMs || 200);
        const lockedDispatchEscalationAttempts = Math.max(2, Math.ceil(1200 / retryIntervalMs));

        const tryEscalateLockedDispatch = (submitTarget, stopControlActive) => {
            if (!sendDispatchLocked || hasEscalatedAfterLock || stopControlActive) return false;

            const lockAge = attempts - firstDispatchAttempt;
            if (lockAge < lockedDispatchEscalationAttempts) return false;

            if (submitByForm(submitTarget)) {
                hasEscalatedAfterLock = true;
                logEvent('send_triggered', 'send escalated by form submit after unconfirmed dispatch', {
                    path: 'form',
                    attempt: attempts,
                    escalatedFrom: firstDispatchPath,
                    initialDispatchAttempt: firstDispatchAttempt
                });
                return true;
            }

            if (attempts >= maxAttempts - 1) {
                pressEnter(submitTarget);
                hasEscalatedAfterLock = true;
                logEvent('send_triggered', 'send escalated by Enter fallback after unconfirmed dispatch', {
                    path: 'enter',
                    attempt: attempts,
                    escalatedFrom: firstDispatchPath,
                    initialDispatchAttempt: firstDispatchAttempt
                });
                return true;
            }

            return false;
        };

        const trySendOnce = () => {
            attempts += 1;
            const activeTarget = findInputTarget() || initialTarget;
            if (!activeTarget) {
                logEvent('send_retry', 'input target missing during send retry', { attempts, maxAttempts });
                return attempts >= maxAttempts;
            }

            const submitTarget = resolveSubmitTarget(activeTarget);
            const form = submitTarget.closest('form');
            const sendMatch = (form && findSendButton(form, submitTarget)) || findSendButton(document, submitTarget);
            const stopControlActive = hasStopActionControl(submitTarget);

            logEvent('send_attempt', 'sending attempt started', {
                attempt: attempts,
                maxAttempts,
                inputSelector: activeTarget.selector || '(unknown)',
                inputMode: activeTarget.mode,
                stopControlActive
            });

            if (sendMatch && sendMatch.button) {
                const matchScore = typeof sendMatch.score === 'number' ? sendMatch.score : 0;
                const labelScore = typeof sendMatch.labelScore === 'number'
                    ? sendMatch.labelScore
                    : getSendMatchScore(sendMatch.button);
                const isSubmitFallback = matchScore <= 0 && sendMatch.button.getAttribute('type') === 'submit';
                const isSelectorOnlyMatch = labelScore <= 0 && matchScore > 0;

                if (sendDispatchLocked) {
                    const escalated = tryEscalateLockedDispatch(submitTarget, stopControlActive);
                    if (!escalated) {
                        logEvent('send_guard', 'skipped duplicate send trigger after initial dispatch', {
                            attempt: attempts,
                            selector: sendMatch.selector,
                            distance: sendMatch.distance,
                            lockedPath: firstDispatchPath,
                            lockedAttempt: firstDispatchAttempt
                        });
                    }
                } else if (stopControlActive) {
                    logEvent('send_retry', 'stop-state control detected before initial dispatch, waiting for send state', {
                        attempt: attempts,
                        selector: sendMatch.selector,
                        distance: sendMatch.distance
                    });
                } else if (isSubmitFallback && hasClickedSubmitFallback) {
                    logEvent('send_guard', 'skipped repeated submit-fallback click', {
                        attempt: attempts,
                        selector: sendMatch.selector,
                        distance: sendMatch.distance
                    });
                } else if (isSelectorOnlyMatch && clickedSelectorOnlyButtons.has(sendMatch.button)) {
                    logEvent('send_guard', 'skipped repeated selector-only button click', {
                        attempt: attempts,
                        selector: sendMatch.selector,
                        distance: sendMatch.distance
                    });
                } else {
                    if (isSubmitFallback) {
                        hasClickedSubmitFallback = true;
                    }
                    if (isSelectorOnlyMatch) {
                        clickedSelectorOnlyButtons.add(sendMatch.button);
                    }
                    triggerButtonClick(sendMatch.button);
                    sendDispatchLocked = true;
                    firstDispatchPath = 'button';
                    firstDispatchAttempt = attempts;
                    logEvent('send_triggered', 'send triggered by button click', {
                        path: 'button',
                        selector: sendMatch.selector,
                        score: matchScore,
                        distance: sendMatch.distance,
                        attempt: attempts
                    });
                }
            } else if (sendDispatchLocked) {
                const escalated = tryEscalateLockedDispatch(submitTarget, stopControlActive);
                if (!escalated) {
                    logEvent('send_guard', 'skipped duplicate form submit after initial dispatch', {
                        attempt: attempts,
                        lockedPath: firstDispatchPath,
                        lockedAttempt: firstDispatchAttempt
                    });
                }
            } else if (stopControlActive) {
                logEvent('send_retry', 'stop-state control detected before initial dispatch, waiting for send state', {
                    attempt: attempts
                });
            } else if (attempts >= maxAttempts && !sendDispatchLocked) {
                pressEnter(submitTarget);
                sendDispatchLocked = true;
                firstDispatchPath = 'enter';
                firstDispatchAttempt = attempts;
                logEvent('send_triggered', 'send triggered by Enter fallback', {
                    path: 'enter',
                    attempt: attempts
                });
            }

            const latestTarget = findInputTarget() || activeTarget;
            if (confirmSent(latestTarget)) {
                logEvent('send_confirmed', 'prompt submission confirmed', {
                    attempt: attempts
                });
                return true;
            }

            if (attempts >= maxAttempts) {
                logEvent('send_timeout', 'send retries exhausted without confirmation', {
                    attempts,
                    maxAttempts
                });
                return true;
            }

            logEvent('send_retry', 'send not confirmed yet', {
                attempt: attempts,
                maxAttempts,
                nextRetryInMs: retryIntervalMs
            });
            return false;
        };

        if (trySendOnce()) return;

        const retryTimer = setInterval(() => {
            if (trySendOnce()) {
                clearInterval(retryTimer);
            }
        }, retryIntervalMs);
    }

    function startInjectionFlow() {
        const maxAttempts = 45;
        const intervalMs = 300;
        const timeoutMs = maxAttempts * intervalMs;
        const mutationCooldownMs = 80;
        const injectionSettleMs = 180;

        let completed = false;
        let attempts = 0;
        let intervalAttempts = 0;
        let observer = null;
        let fallbackTimer = null;
        let timeoutTimer = null;
        let settleTimer = null;
        let mutationQueued = false;
        let lastMutationAttemptAt = 0;

        const cleanup = () => {
            if (observer) observer.disconnect();
            if (fallbackTimer) clearInterval(fallbackTimer);
            if (timeoutTimer) clearTimeout(timeoutTimer);
            if (settleTimer) clearTimeout(settleTimer);
            observer = null;
            fallbackTimer = null;
            timeoutTimer = null;
            settleTimer = null;
        };

        const finalize = (target) => {
            completed = true;
            cleanup();

            logEvent('input_injected', 'prompt inserted', {
                selector: target.selector,
                mode: target.mode
            });

            if (!shouldAutoSend) {
                logEvent('autosend_skip', 'autosend disabled by URL parameter', {
                    autosend: autoSendRaw
                });
                return;
            }

            scheduleAutoSend(target);
        };

        const attemptInject = (source) => {
            if (completed) return;
            if (settleTimer) return;

            if (source === 'mutation') {
                const now = Date.now();
                if (now - lastMutationAttemptAt < mutationCooldownMs) {
                    return;
                }
                lastMutationAttemptAt = now;
            }

            attempts += 1;

            const target = findInputTarget();
            if (!target) {
                if (attempts % 5 === 0) {
                    logEvent('input_wait', 'waiting for input target', {
                        source,
                        attempts,
                        maxAttempts
                    });
                }
                return;
            }

            logEvent('input_selected', 'input target selected', {
                source,
                selector: target.selector,
                mode: target.mode,
                provider: target.provider || 'default'
            });

            const injected = injectText(target, promptText);
            if (!injected) {
                logEvent('input_inject_failed', 'failed to inject prompt', {
                    source,
                    selector: target.selector,
                    mode: target.mode
                });
                return;
            }

            const verifyInjectedPrompt = (verifySource) => {
                if (completed) return true;

                const latestTarget = findInputTarget() || target;
                if (!latestTarget) {
                    logEvent('input_verify_retry', 'input target missing during injection verify', {
                        source: verifySource,
                        selector: target.selector,
                        mode: target.mode
                    });
                    return false;
                }

                if (hasInjectedPromptText(latestTarget, promptText)) {
                    finalize(latestTarget);
                    return true;
                }

                logEvent('input_verify_retry', 'injected text not stable yet, will retry', {
                    source: verifySource,
                    selector: latestTarget.selector,
                    mode: latestTarget.mode
                });
                return false;
            };

            if (verifyInjectedPrompt(`${source}:sync`)) {
                return;
            }

            settleTimer = setTimeout(() => {
                settleTimer = null;
                verifyInjectedPrompt(`${source}:settle`);
            }, injectionSettleMs);
        };

        logEvent('injection_start', 'starting injection scheduler', {
            maxAttempts,
            intervalMs,
            timeoutMs,
            mutationCooldownMs,
            injectionSettleMs
        });

        attemptInject('bootstrap');
        if (completed) return;

        observer = new MutationObserver(() => {
            if (completed || mutationQueued) return;
            mutationQueued = true;
            setTimeout(() => {
                mutationQueued = false;
                attemptInject('mutation');
            }, 0);
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        fallbackTimer = setInterval(() => {
            if (completed) return;
            intervalAttempts += 1;
            attemptInject('interval');
            if (intervalAttempts >= maxAttempts && !completed) {
                logEvent('input_timeout', 'input box not found before timeout', {
                    attempts,
                    intervalAttempts,
                    maxAttempts
                });
                completed = true;
                cleanup();
            }
        }, intervalMs);

        timeoutTimer = setTimeout(() => {
            if (completed) return;
            logEvent('input_timeout', 'injection timeout reached', {
                timeoutMs,
                attempts,
                intervalAttempts,
                maxAttempts
            });
            completed = true;
            cleanup();
        }, timeoutMs + 100);
    }

    void bootstrap();
})();
