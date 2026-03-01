'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const PLATFORMS_DIR = path.join(ROOT, 'platforms');

function getPlatformFiles() {
    return fs
        .readdirSync(PLATFORMS_DIR)
        .filter((name) => name.endsWith('.js'))
        .sort((a, b) => a.localeCompare(b));
}

function runScriptInContext(context, filename) {
    const fullPath = path.join(PLATFORMS_DIR, filename);
    const source = fs.readFileSync(fullPath, 'utf8');
    const script = new vm.Script(source, { filename: fullPath });
    script.runInContext(context);
}

function loadPlatformDefinitions(platformFiles) {
    const sandbox = {
        console,
        globalThis: {}
    };

    sandbox.window = sandbox.globalThis;
    sandbox.global = sandbox.globalThis;

    const context = vm.createContext(sandbox);
    runScriptInContext(context, '_registry.js');

    for (const file of platformFiles) {
        if (file === '_registry.js') continue;
        runScriptInContext(context, file);
    }

    const defs = sandbox.globalThis.__UAUP_PLATFORM_DEFS__;
    if (!Array.isArray(defs)) {
        throw new Error('Failed to load platform definitions from registry.');
    }

    const errors = sandbox.globalThis.__UAUP_PLATFORM_ERRORS__;
    if (Array.isArray(errors) && errors.length > 0) {
        throw new Error(`Platform registry validation failed:\n${errors.join('\n')}`);
    }

    return defs;
}

function buildMatches(platformDefs) {
    const seen = new Set();
    const matches = [];

    for (const platform of platformDefs) {
        const matchPatterns = Array.isArray(platform.matchPatterns) && platform.matchPatterns.length > 0
            ? platform.matchPatterns
            : (platform.hosts || []).map((host) => `https://${host}/*`);

        for (const pattern of matchPatterns) {
            const match = String(pattern || '').trim();
            if (!match) continue;
            if (seen.has(match)) continue;
            seen.add(match);
            matches.push(match);
        }
    }

    return matches;
}

module.exports = {
    ROOT,
    PLATFORMS_DIR,
    getPlatformFiles,
    loadPlatformDefinitions,
    buildMatches
};
