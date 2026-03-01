'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const STAGE_DIR = path.join(DIST_DIR, 'cws-package');
const STAGE_ZIP_DIR = path.join(DIST_DIR, 'cws-zips');

const INCLUDE_FILES = [
    'manifest.json',
    'background.js',
    'content.js'
];

const INCLUDE_DIRS = [
    '_locales',
    'icons',
    'platforms'
];

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function copyFile(relPath) {
    const src = path.join(ROOT, relPath);
    const dest = path.join(STAGE_DIR, relPath);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

function copyDir(relPath) {
    const src = path.join(ROOT, relPath);
    const dest = path.join(STAGE_DIR, relPath);
    fs.cpSync(src, dest, { recursive: true });
}

function main() {
    const manifestPath = path.join(ROOT, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const version = String(manifest.version || '').trim();
    if (!version) {
        throw new Error('manifest.version is empty.');
    }

    fs.rmSync(STAGE_DIR, { recursive: true, force: true });
    ensureDir(STAGE_DIR);
    ensureDir(STAGE_ZIP_DIR);

    for (const file of INCLUDE_FILES) {
        copyFile(file);
    }
    for (const dir of INCLUDE_DIRS) {
        copyDir(dir);
    }

    const zipName = `universal-ai-url-prompt-v${version}.zip`;
    const zipPath = path.join(STAGE_ZIP_DIR, zipName);
    if (fs.existsSync(zipPath)) {
        fs.rmSync(zipPath, { force: true });
    }

    execSync(`zip -r -q "${zipPath}" .`, {
        cwd: STAGE_DIR,
        stdio: 'inherit'
    });

    console.log(`CWS package generated: ${zipPath}`);
}

main();
