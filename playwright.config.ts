import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './tests/e2e',
	// Serial + per-file re-seed (seedFresh): specs mutate shared dev-DB rows, so
	// parallel files would race. Fast enough at this scale.
	fullyParallel: false,
	workers: 1,
	reporter: 'list',
	globalSetup: './tests/e2e/global-setup.ts',
	use: {
		baseURL: 'http://localhost:3000',
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:3000',
		reuseExistingServer: true,
		timeout: 120_000,
	},
})
