const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
  },
  webServer: {
    command: "npx http-server . -a 127.0.0.1 -p 4173 -c-1",
    port: 4173,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
