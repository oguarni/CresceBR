import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end coverage for the marketplace.
 *
 * The workspace already has unit and component tests — vitest across the React
 * app, jest across the Express API — and they run against mocked boundaries.
 * Nothing exercised the two together, so every defect that lives in the seam
 * (auth token handling, the vite proxy, role gating on a real response, a
 * migration the frontend does not expect) had no test that could see it.
 * That seam is what this config covers; it is not a second unit-test runner.
 *
 * Prerequisite: `npm run e2e:services` — postgres and redis up, migrated and
 * seeded. globalSetup fails loudly rather than starting infrastructure behind
 * your back.
 */

const FRONTEND_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
const API_URL = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001';
// server.ts mounts every route under API_PREFIX, which defaults to /api/v1 —
// not /api. Probing the wrong path costs a 120s webServer timeout whose error
// message says nothing about the URL being wrong.
const API_PREFIX = process.env.API_PREFIX ?? '/api/v1';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e/specs',
  globalSetup: './e2e/global-setup.ts',
  // A shared postgres means specs are not isolated from each other by default.
  // Parallelism stays on across files; anything that writes must namespace its
  // own data (see e2e/fixtures/unique.ts).
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  outputDir: './e2e/test-results',

  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // The buyer side is used on phones; the supplier dashboard is not.
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, testMatch: /buyer-.*\.spec\.ts/ },
  ],

  webServer: [
    {
      command: 'npm run backend:dev',
      url: `${API_URL}${API_PREFIX}/health`,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run frontend:dev',
      url: FRONTEND_URL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
