'use strict';

(function() {
    const root = globalThis;
    const STORAGE_KEY = 'platformEnabledByName';
    const STATUS_VISIBLE_MS = 1800;

    const refs = {
        pageTitle: document.getElementById('page-title'),
        pageDescription: document.getElementById('page-description'),
        enableAllBtn: document.getElementById('enable-all-btn'),
        disableAllBtn: document.getElementById('disable-all-btn'),
        summary: document.getElementById('summary'),
        status: document.getElementById('status'),
        platformList: document.getElementById('platform-list')
    };

    let platformDefs = [];
    let enabledByName = {};
    let statusTimer = null;

    function t(key, fallback, substitutions = undefined) {
        if (!root.chrome || !root.chrome.i18n || typeof root.chrome.i18n.getMessage !== 'function') {
            return fallback;
        }
        const message = root.chrome.i18n.getMessage(key, substitutions);
        return message || fallback;
    }

    function setTextContent(element, text) {
        if (!element) return;
        element.textContent = text;
    }

    function initStaticTexts() {
        const appName = t('appName', 'Universal AI URL Prompt');
        const title = t('optionsTitle', 'Platform Settings');
        document.title = `${appName} - ${title}`;

        setTextContent(refs.pageTitle, title);
        setTextContent(
            refs.pageDescription,
            t('optionsDescription', 'Choose which AI platforms are enabled for URL prompt injection.')
        );
        setTextContent(refs.enableAllBtn, t('optionsEnableAll', 'Enable All'));
        setTextContent(refs.disableAllBtn, t('optionsDisableAll', 'Disable All'));
    }

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

    function storageGet(storageArea, key) {
        return new Promise((resolve) => {
            if (!storageArea || typeof storageArea.get !== 'function') {
                resolve({});
                return;
            }

            storageArea.get([key], (result) => {
                if (root.chrome && root.chrome.runtime && root.chrome.runtime.lastError) {
                    resolve({});
                    return;
                }
                resolve(result && typeof result === 'object' ? result : {});
            });
        });
    }

    function storageSet(storageArea, value) {
        return new Promise((resolve, reject) => {
            if (!storageArea || typeof storageArea.set !== 'function') {
                reject(new Error('Storage API unavailable.'));
                return;
            }

            storageArea.set(value, () => {
                if (root.chrome && root.chrome.runtime && root.chrome.runtime.lastError) {
                    reject(new Error(root.chrome.runtime.lastError.message || 'Unknown storage error.'));
                    return;
                }
                resolve();
            });
        });
    }

    function normalizeEnabledMap(rawMap) {
        const normalized = {};
        if (!rawMap || typeof rawMap !== 'object') return normalized;
        for (const [name, value] of Object.entries(rawMap)) {
            if (typeof value === 'boolean') {
                normalized[name] = value;
            }
        }
        return normalized;
    }

    function getResolvedEnabledState(name) {
        const value = enabledByName[name];
        if (typeof value === 'boolean') return value;
        return true;
    }

    function renderSummary() {
        const total = platformDefs.length;
        const enabledCount = platformDefs.reduce((count, platform) => {
            return count + (getResolvedEnabledState(platform.name) ? 1 : 0);
        }, 0);
        setTextContent(
            refs.summary,
            t('optionsSummary', '$1 / $2 platforms enabled', [String(enabledCount), String(total)])
        );
    }

    function showStatus(kind, message) {
        if (!refs.status) return;
        refs.status.classList.remove('is-ok', 'is-error', 'is-visible');
        refs.status.textContent = message;

        if (kind === 'ok') {
            refs.status.classList.add('is-ok');
        } else if (kind === 'error') {
            refs.status.classList.add('is-error');
        }

        refs.status.classList.add('is-visible');
        if (statusTimer) {
            clearTimeout(statusTimer);
        }
        statusTimer = setTimeout(() => {
            refs.status.classList.remove('is-visible');
        }, STATUS_VISIBLE_MS);
    }

    function setAllButtonsDisabled(disabled) {
        if (refs.enableAllBtn) refs.enableAllBtn.disabled = disabled;
        if (refs.disableAllBtn) refs.disableAllBtn.disabled = disabled;
        const checkboxes = refs.platformList ? refs.platformList.querySelectorAll('input[type="checkbox"]') : [];
        checkboxes.forEach((checkbox) => {
            checkbox.disabled = disabled;
        });
    }

    async function persistState() {
        const storageArea = getStorageArea();
        await storageSet(storageArea, { [STORAGE_KEY]: enabledByName });
    }

    function renderErrorCard(message) {
        if (!refs.platformList) return;
        refs.platformList.innerHTML = '';
        const card = document.createElement('li');
        card.className = 'error-card';
        card.textContent = message;
        refs.platformList.appendChild(card);
    }

    function createPlatformItem(platform) {
        const item = document.createElement('li');
        item.className = 'platform-item';

        const label = document.createElement('label');
        label.className = 'platform-label';

        const top = document.createElement('div');
        top.className = 'platform-top';

        const checkbox = document.createElement('input');
        checkbox.className = 'platform-checkbox';
        checkbox.type = 'checkbox';
        checkbox.checked = getResolvedEnabledState(platform.name);
        checkbox.dataset.platform = platform.name;

        const name = document.createElement('span');
        name.className = 'platform-name';
        name.textContent = platform.name;

        const hosts = document.createElement('div');
        hosts.className = 'platform-hosts';
        const hostText = Array.isArray(platform.hosts) ? platform.hosts.join(', ') : '';
        hosts.textContent = `${t('optionsHosts', 'Hosts')}: ${hostText}`;

        top.appendChild(checkbox);
        top.appendChild(name);
        label.appendChild(top);
        label.appendChild(hosts);
        item.appendChild(label);

        checkbox.addEventListener('change', async () => {
            enabledByName[platform.name] = checkbox.checked;
            renderSummary();
            try {
                await persistState();
                showStatus('ok', t('optionsSaved', 'Saved'));
            } catch (error) {
                showStatus('error', t('optionsSaveFailed', 'Save failed'));
                checkbox.checked = !checkbox.checked;
                enabledByName[platform.name] = checkbox.checked;
                renderSummary();
            }
        });

        return item;
    }

    function renderPlatformList() {
        if (!refs.platformList) return;
        refs.platformList.innerHTML = '';

        for (const platform of platformDefs) {
            refs.platformList.appendChild(createPlatformItem(platform));
        }
        renderSummary();
    }

    function setAllPlatformsEnabled(enabled) {
        for (const platform of platformDefs) {
            enabledByName[platform.name] = enabled;
        }
    }

    async function applyAllSwitch(enabled) {
        const previousState = { ...enabledByName };
        setAllButtonsDisabled(true);
        setAllPlatformsEnabled(enabled);

        const checkboxes = refs.platformList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
            checkbox.checked = enabled;
        });
        renderSummary();

        try {
            await persistState();
            showStatus('ok', t('optionsSaved', 'Saved'));
        } catch (error) {
            showStatus('error', t('optionsSaveFailed', 'Save failed'));
            enabledByName = previousState;
            checkboxes.forEach((checkbox) => {
                const platformName = checkbox.dataset.platform || '';
                checkbox.checked = getResolvedEnabledState(platformName);
            });
            renderSummary();
        } finally {
            setAllButtonsDisabled(false);
        }
    }

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = false;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    async function loadPlatformDefinitions() {
        if (!root.chrome || !root.chrome.runtime || typeof root.chrome.runtime.getManifest !== 'function') {
            throw new Error('Manifest API unavailable.');
        }

        const manifest = root.chrome.runtime.getManifest();
        const contentScripts = Array.isArray(manifest.content_scripts) ? manifest.content_scripts : [];
        const scripts = [];
        const seen = new Set();

        for (const contentScript of contentScripts) {
            const jsFiles = Array.isArray(contentScript.js) ? contentScript.js : [];
            for (const file of jsFiles) {
                if (!file.startsWith('platforms/') || !file.endsWith('.js')) continue;
                if (seen.has(file)) continue;
                seen.add(file);
                scripts.push(file);
            }
        }

        if (!scripts.includes('platforms/_registry.js')) {
            throw new Error('Platform registry script missing.');
        }

        const sortedScripts = [
            'platforms/_registry.js',
            ...scripts.filter((file) => file !== 'platforms/_registry.js')
        ];

        for (const file of sortedScripts) {
            await loadScript(root.chrome.runtime.getURL(file));
        }

        const defs = Array.isArray(root.__UAUP_PLATFORM_DEFS__) ? root.__UAUP_PLATFORM_DEFS__ : [];
        if (!defs.length) {
            throw new Error('No platform definitions loaded.');
        }

        const errors = Array.isArray(root.__UAUP_PLATFORM_ERRORS__) ? root.__UAUP_PLATFORM_ERRORS__ : [];
        if (errors.length > 0) {
            throw new Error(errors[0]);
        }

        return defs
            .map((item) => ({
                name: item.name,
                hosts: Array.isArray(item.hosts) ? item.hosts : []
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
    }

    async function loadStoredState() {
        const storageArea = getStorageArea();
        const stored = await storageGet(storageArea, STORAGE_KEY);
        enabledByName = normalizeEnabledMap(stored[STORAGE_KEY]);
    }

    function bindActions() {
        if (refs.enableAllBtn) {
            refs.enableAllBtn.addEventListener('click', () => {
                void applyAllSwitch(true);
            });
        }

        if (refs.disableAllBtn) {
            refs.disableAllBtn.addEventListener('click', () => {
                void applyAllSwitch(false);
            });
        }
    }

    async function init() {
        initStaticTexts();
        bindActions();

        try {
            setAllButtonsDisabled(true);
            platformDefs = await loadPlatformDefinitions();
            await loadStoredState();
            renderPlatformList();
            setAllButtonsDisabled(false);
        } catch (error) {
            renderErrorCard(t('optionsLoadFailed', 'Failed to load platform settings.'));
            showStatus('error', t('optionsLoadFailed', 'Failed to load platform settings.'));
        }
    }

    void init();
})();
