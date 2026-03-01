(function() {
    'use strict';

    const root = globalThis;
    const ALLOWED_INPUT_MODES = new Set(['textarea', 'contenteditable', 'rich-paragraph']);
    const ALLOWED_TOP_LEVEL_FIELDS = new Set([
        'name',
        'hosts',
        'matchPatterns',
        'inputStrategies',
        'sendButtonSelectors',
        'sendKeywords',
        'stopKeywords',
        'sendDelayMs',
        'sendRetryAttempts',
        'sendRetryIntervalMs',
        'hooks'
    ]);
    const ALLOWED_HOOKS = new Set([
        'findInputTarget',
        'injectText',
        'findSendButton',
        'confirmSent',
        'resolvePromptParams',
        'isEnabled'
    ]);

    if (!Array.isArray(root.__UAUP_PLATFORM_DEFS__)) {
        root.__UAUP_PLATFORM_DEFS__ = [];
    }
    if (!(root.__UAUP_PLATFORM_KEYS__ instanceof Set)) {
        root.__UAUP_PLATFORM_KEYS__ = new Set();
    }
    if (!(root.__UAUP_PLATFORM_NAMES__ instanceof Set)) {
        root.__UAUP_PLATFORM_NAMES__ = new Set();
    }
    if (!(root.__UAUP_PLATFORM_HOST_MAP__ instanceof Map)) {
        root.__UAUP_PLATFORM_HOST_MAP__ = new Map();
    }
    if (!Array.isArray(root.__UAUP_PLATFORM_ERRORS__)) {
        root.__UAUP_PLATFORM_ERRORS__ = [];
    }

    function reportError(name, reason) {
        const message = `[Universal AI URL Prompt][registry][invalid_platform] ${name}: ${reason}`;
        root.__UAUP_PLATFORM_ERRORS__.push(message);
        console.warn(message);
    }

    function sanitizeStringArray(values) {
        return Array.from(
            new Set(
                values
                    .filter((value) => typeof value === 'string')
                    .map((value) => value.trim())
                    .filter(Boolean)
            )
        );
    }

    function sanitizeRequiredStringArray(name, fieldName, values) {
        if (!Array.isArray(values)) {
            reportError(name, `${fieldName} must be a non-empty array.`);
            return null;
        }

        const normalized = sanitizeStringArray(values);
        if (normalized.length === 0) {
            reportError(name, `${fieldName} must contain at least one non-empty item.`);
            return null;
        }

        return normalized;
    }

    function sanitizeInputStrategies(name, inputStrategies) {
        if (!Array.isArray(inputStrategies)) {
            reportError(name, 'inputStrategies must be a non-empty array.');
            return null;
        }

        const normalized = [];
        for (const strategy of inputStrategies) {
            if (!strategy || typeof strategy !== 'object') {
                reportError(name, 'inputStrategies contains a non-object item.');
                return null;
            }

            const selector = typeof strategy.selector === 'string' ? strategy.selector.trim() : '';
            const mode = typeof strategy.mode === 'string' ? strategy.mode.trim() : '';
            if (!selector) {
                reportError(name, 'inputStrategies contains empty selector.');
                return null;
            }
            if (!ALLOWED_INPUT_MODES.has(mode)) {
                reportError(name, `inputStrategies contains invalid mode: ${mode || '(empty)'}.`);
                return null;
            }

            normalized.push({ selector, mode });
        }

        if (normalized.length === 0) {
            reportError(name, 'inputStrategies must contain at least one strategy.');
            return null;
        }

        return normalized;
    }

    function sanitizeHooks(name, hooks) {
        if (hooks == null) return undefined;
        if (!hooks || typeof hooks !== 'object' || Array.isArray(hooks)) {
            reportError(name, 'hooks must be an object.');
            return null;
        }

        const normalized = {};
        for (const [key, value] of Object.entries(hooks)) {
            if (!ALLOWED_HOOKS.has(key)) {
                reportError(name, `hooks contains unsupported key: ${key}.`);
                return null;
            }
            if (typeof value !== 'function') {
                reportError(name, `hooks.${key} must be a function.`);
                return null;
            }
            normalized[key] = value;
        }

        return normalized;
    }

    function normalizePlatformDefinition(definition) {
        if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
            reportError('(unknown)', 'definition must be an object.');
            return null;
        }

        const name = typeof definition.name === 'string' ? definition.name.trim() : '';
        if (!name) {
            reportError('(unknown)', 'name is required.');
            return null;
        }

        for (const key of Object.keys(definition)) {
            if (!ALLOWED_TOP_LEVEL_FIELDS.has(key)) {
                reportError(name, `contains unsupported field: ${key}.`);
                return null;
            }
        }

        if (!Array.isArray(definition.hosts) || definition.hosts.length === 0) {
            reportError(name, 'hosts must be a non-empty array.');
            return null;
        }

        const hosts = sanitizeStringArray(definition.hosts).map((host) => host.toLowerCase());
        if (hosts.length === 0) {
            reportError(name, 'hosts has no valid entries.');
            return null;
        }

        const matchPatterns = definition.matchPatterns == null
            ? undefined
            : sanitizeRequiredStringArray(name, 'matchPatterns', definition.matchPatterns);
        if (definition.matchPatterns != null && matchPatterns === null) {
            return null;
        }

        const inputStrategies = sanitizeInputStrategies(name, definition.inputStrategies);
        if (inputStrategies === null) return null;

        const sendButtonSelectors = sanitizeRequiredStringArray(
            name,
            'sendButtonSelectors',
            definition.sendButtonSelectors
        );
        if (sendButtonSelectors === null) return null;

        const sendKeywords = definition.sendKeywords == null
            ? undefined
            : sanitizeStringArray(Array.isArray(definition.sendKeywords) ? definition.sendKeywords : []);
        if (definition.sendKeywords != null && !Array.isArray(definition.sendKeywords)) {
            reportError(name, 'sendKeywords must be an array.');
            return null;
        }

        const stopKeywords = definition.stopKeywords == null
            ? undefined
            : sanitizeStringArray(Array.isArray(definition.stopKeywords) ? definition.stopKeywords : []);
        if (definition.stopKeywords != null && !Array.isArray(definition.stopKeywords)) {
            reportError(name, 'stopKeywords must be an array.');
            return null;
        }

        const hooks = sanitizeHooks(name, definition.hooks);
        if (hooks === null) return null;

        const numberFields = ['sendDelayMs', 'sendRetryAttempts', 'sendRetryIntervalMs'];
        const numericOptions = {};
        for (const field of numberFields) {
            if (definition[field] == null) continue;
            const value = definition[field];
            if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
                reportError(name, `${field} must be an integer.`);
                return null;
            }
            if (field === 'sendRetryAttempts' && value < 1) {
                reportError(name, 'sendRetryAttempts must be at least 1.');
                return null;
            }
            if (field !== 'sendRetryAttempts' && value < 0) {
                reportError(name, `${field} must be non-negative.`);
                return null;
            }
            numericOptions[field] = value;
        }

        return {
            name,
            hosts,
            ...(matchPatterns ? { matchPatterns } : {}),
            inputStrategies,
            sendButtonSelectors,
            ...(sendKeywords ? { sendKeywords } : {}),
            ...(stopKeywords ? { stopKeywords } : {}),
            ...(hooks ? { hooks } : {}),
            ...numericOptions
        };
    }

    root.__UAUP_REGISTER_PLATFORM__ = function registerPlatform(definition) {
        const normalized = normalizePlatformDefinition(definition);
        if (!normalized) return;

        if (root.__UAUP_PLATFORM_NAMES__.has(normalized.name)) {
            reportError(normalized.name, 'duplicate platform name is not allowed.');
            return;
        }

        for (const host of normalized.hosts) {
            const owner = root.__UAUP_PLATFORM_HOST_MAP__.get(host);
            if (owner && owner !== normalized.name) {
                reportError(
                    normalized.name,
                    `host "${host}" already registered by platform "${owner}".`
                );
                return;
            }
        }

        const key = `${normalized.name}:${normalized.hosts.join(',')}`;
        if (root.__UAUP_PLATFORM_KEYS__.has(key)) return;

        root.__UAUP_PLATFORM_KEYS__.add(key);
        root.__UAUP_PLATFORM_NAMES__.add(normalized.name);
        for (const host of normalized.hosts) {
            root.__UAUP_PLATFORM_HOST_MAP__.set(host, normalized.name);
        }
        root.__UAUP_PLATFORM_DEFS__.push(normalized);
    };
})();
