'use strict';

const PROMPT_PARAM_KEYS = ['prompt', 'q', 'p'];
const CACHE_TTL_MS = 3 * 60 * 1000;
const CACHE_LIMIT = 200;
const promptCacheByTab = new Map();

function extractPromptRecord(urlLike, source) {
    if (!urlLike) return null;

    let parsedUrl = null;
    try {
        parsedUrl = new URL(urlLike);
    } catch (error) {
        return null;
    }

    const params = parsedUrl.searchParams;
    let promptParamKey = '';
    let promptText = '';
    for (const key of PROMPT_PARAM_KEYS) {
        const value = params.get(key);
        if (!value) continue;
        promptParamKey = key;
        promptText = value;
        break;
    }

    if (!promptText) return null;

    const normalizedParams = {
        [promptParamKey]: promptText
    };
    const autosend = params.get('autosend');
    if (typeof autosend === 'string') {
        normalizedParams.autosend = autosend;
    }

    return {
        promptText,
        promptParamKey,
        params: normalizedParams,
        source,
        sourceUrl: parsedUrl.toString(),
        host: parsedUrl.hostname.toLowerCase(),
        capturedAt: Date.now()
    };
}

function pruneCache(now = Date.now()) {
    for (const [tabId, record] of promptCacheByTab.entries()) {
        if (now - record.capturedAt > CACHE_TTL_MS) {
            promptCacheByTab.delete(tabId);
        }
    }

    if (promptCacheByTab.size <= CACHE_LIMIT) {
        return;
    }

    const records = Array.from(promptCacheByTab.entries()).sort((a, b) => {
        return a[1].capturedAt - b[1].capturedAt;
    });

    const deleteCount = promptCacheByTab.size - CACHE_LIMIT;
    for (let i = 0; i < deleteCount; i += 1) {
        promptCacheByTab.delete(records[i][0]);
    }
}

function cachePromptFromNavigation(details, source) {
    if (!details || details.frameId !== 0) return;
    if (typeof details.tabId !== 'number' || details.tabId < 0) return;

    const record = extractPromptRecord(details.url, source);
    if (!record) return;

    promptCacheByTab.set(details.tabId, record);
    pruneCache(record.capturedAt);
}

function isSameHostFamily(hostA, hostB) {
    if (!hostA || !hostB) return false;
    if (hostA === hostB) return true;
    return hostA.endsWith(`.${hostB}`) || hostB.endsWith(`.${hostA}`);
}

function readCachedPrompt(tabId, host) {
    if (typeof tabId !== 'number' || tabId < 0) return null;

    const record = promptCacheByTab.get(tabId);
    if (!record) return null;

    if (Date.now() - record.capturedAt > CACHE_TTL_MS) {
        promptCacheByTab.delete(tabId);
        return null;
    }

    if (host && !isSameHostFamily(record.host, host)) {
        return null;
    }

    promptCacheByTab.delete(tabId);
    return record;
}

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    cachePromptFromNavigation(details, 'before_navigate');
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    cachePromptFromNavigation(details, 'history_state');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== 'UAUP_GET_CACHED_PROMPT') return;

    const tabId = sender && sender.tab ? sender.tab.id : -1;
    const host = typeof message.host === 'string' ? message.host.toLowerCase() : '';
    const record = readCachedPrompt(tabId, host);

    if (!record) {
        sendResponse({ ok: false });
        return;
    }

    sendResponse({
        ok: true,
        record
    });
});
