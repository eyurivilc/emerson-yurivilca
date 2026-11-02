import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "reports/test-results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4322/emerson-yurivilca/",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --port 4322",
    url: "http://127.0.0.1:4322/emerson-yurivilca/",
    reuseExistingServer: false,
  },
});
