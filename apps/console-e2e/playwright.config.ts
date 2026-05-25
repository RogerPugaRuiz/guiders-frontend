import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, PLAYWRIGHT_BASE_URL is set by the e2e.yml workflow.
const baseURL = process.env['PLAYWRIGHT_BASE_URL'] ?? process.env['BASE_URL'] ?? 'http://localhost:4200';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  /* Default timeout per test (ms). Real SSO + page load needs more than 30 s. */
  timeout: 60_000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    // Bypass autenticación Keycloak en las pruebas
    // Interceptar todas las navegaciones a Keycloak y bloquearlas
    bypassCSP: true,
  },
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'VITE_USE_MOCK_DATA=false npx nx run console:serve',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    cwd: workspaceRoot,
    env: {
      VITE_USE_MOCK_DATA: 'false',
      // Point the Angular app at the E2E backend (port 3099) when running tests.
      // In normal dev the backend is on :3000 (environment.ts default).
      // The E2E Docker stack starts the backend on :3099 to avoid port collisions.
      VITE_API_BASE_URL: process.env['E2E_API_URL']
        ? process.env['E2E_API_URL'] + '/api'
        : 'http://localhost:3099/api',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-audio-output',
            '--autoplay-policy=no-user-gesture-required',
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ],
        },
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
