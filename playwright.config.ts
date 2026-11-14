import { defineConfig, devices } from "@playwright/test";

const port = 4329;
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}/vibe-coding-hub/`,
    trace: "retain-on-failure",
    // No transitions, so accessibility checks never measure colors mid-animation
    reducedMotion: "reduce",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx astro preview --port ${port}`,
    cwd: "site",
    url: `http://localhost:${port}/vibe-coding-hub/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
