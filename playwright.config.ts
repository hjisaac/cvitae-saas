import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 60000,
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  outputDir: "./tests/outputs",
  projects: [
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        channel: "chrome"
      },
    },
  ],
  // Do NOT start a webServer — we run dev-frontend ourselves
});
