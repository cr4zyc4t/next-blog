import { defineConfig, devices } from '@playwright/test'

// T053: validate the Docker Compose `deploy` profile container (no dev webServer).
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
