// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * Tokenfly Agent Team Lab — Playwright E2E Config
 * Charlie (Frontend Engineer)
 *
 * Starts the dashboard server before tests, tears it down after.
 */
module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 0,
  workers: 1,

  use: {
    baseURL: "http://localhost:3199",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start the server before all tests
  webServer: {
    command: "RATE_LIMIT_MAX=500 RATE_LIMIT_WRITE_MAX=500 node server.js --port 3199 --dir .",
    port: 3199,
    reuseExistingServer: true,
    timeout: 10000,
  },

  outputDir: "test-results",
});
