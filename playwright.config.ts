import { defineConfig } from "@playwright/test";

const port = 3200;
const adminPassword = "test-admin-password";
const adminSessionSecret = "test-admin-session-secret";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `ADMIN_PASSWORD=${adminPassword} ADMIN_SESSION_SECRET=${adminSessionSecret} PORT=${port} npm run start`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
