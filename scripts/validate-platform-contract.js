'use strict';

const path = require('path');
const {
    getPlatformFiles,
    loadPlatformDefinitions
} = require('./platform-loader');

const { SITE_CASES } = require(path.join(__dirname, '../tests/e2e/site-cases'));

function normalizeLabel(name) {
    return String(name || '')
        .replace(/\s*\([^)]*\)\s*$/u, '')
        .trim();
}

function main() {
    const platformFiles = getPlatformFiles();
    const defs = loadPlatformDefinitions(platformFiles);

    const hostOwner = new Map();
    for (const def of defs) {
        for (const host of def.hosts) {
            hostOwner.set(host.toLowerCase(), def.name);
        }
    }

    const platformCovered = new Set();
    const errors = [];

    for (const def of defs) {
        if (!Array.isArray(def.inputStrategies) || def.inputStrategies.length === 0) {
            errors.push(`平台缺少 inputStrategies: ${def.name}`);
        }
        if (!Array.isArray(def.sendButtonSelectors) || def.sendButtonSelectors.length === 0) {
            errors.push(`平台缺少 sendButtonSelectors: ${def.name}`);
        }
    }

    for (const siteCase of SITE_CASES) {
        const host = String(siteCase.host || '').trim().toLowerCase();
        const caseLabel = normalizeLabel(siteCase.platform);
        const ownerName = hostOwner.get(host);

        if (!ownerName) {
            errors.push(`E2E 用例 host 未注册平台: ${siteCase.platform} -> ${host}`);
            continue;
        }

        platformCovered.add(ownerName);
        const ownerLabel = normalizeLabel(ownerName);
        if (caseLabel && ownerLabel && caseLabel !== ownerLabel) {
            errors.push(
                `E2E 用例平台名与 host 所属平台不一致: case="${siteCase.platform}", host="${host}", owner="${ownerName}"`
            );
        }
    }

    for (const def of defs) {
        if (!platformCovered.has(def.name)) {
            errors.push(`缺少 E2E 覆盖的平台: ${def.name}`);
        }
    }

    if (errors.length > 0) {
        throw new Error(`Platform contract validation failed:\n${errors.map((item) => `- ${item}`).join('\n')}`);
    }

    console.log(
        `Platform contract validation passed: ${defs.length} platforms, ${SITE_CASES.length} site cases.`
    );
}

main();
