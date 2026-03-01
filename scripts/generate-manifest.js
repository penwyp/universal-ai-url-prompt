'use strict';

const fs = require('fs');
const path = require('path');
const {
    ROOT,
    getPlatformFiles,
    loadPlatformDefinitions,
    buildMatches
} = require('./platform-loader');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');

function main() {
    const platformFiles = getPlatformFiles();
    if (!platformFiles.includes('_registry.js')) {
        throw new Error('platforms/_registry.js is required.');
    }

    const defs = loadPlatformDefinitions(platformFiles);
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

    if (!Array.isArray(manifest.content_scripts) || manifest.content_scripts.length === 0) {
        throw new Error('manifest.content_scripts is empty.');
    }

    const scriptFiles = ['platforms/_registry.js'];
    for (const file of platformFiles) {
        if (file === '_registry.js') continue;
        scriptFiles.push(`platforms/${file}`);
    }
    scriptFiles.push('content.js');

    manifest.content_scripts[0].matches = buildMatches(defs);
    manifest.content_scripts[0].js = scriptFiles;

    fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    console.log(`Generated manifest from ${defs.length} platforms and ${scriptFiles.length} scripts.`);
}

main();
