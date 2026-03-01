'use strict';

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 30000,
    expect: {
        timeout: 8000
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: [
        ['list'],
        ['html', { open: 'never' }]
    ],
    use: {
        headless: true,
        viewport: { width: 1366, height: 900 },
        ignoreHTTPSErrors: true
    }
});
