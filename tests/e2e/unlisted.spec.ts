// T017 (FAIL FIRST — TDD): FR-008 unlisted management area guarantees.
import { expect, test } from '@playwright/test'

const STUDIO = process.env.STUDIO_BASE_PATH ?? '/studio'

test('home page HTML contains no reference to the studio path', async ({ page }) => {
	await page.goto('/')
	expect(await page.content()).not.toContain(STUDIO)
})

test('studio responses carry X-Robots-Tag: noindex', async ({ request }) => {
	const res = await request.get(`${STUDIO}/posts`)
	expect(res.ok()).toBeTruthy()
	expect(res.headers()['x-robots-tag']).toBe('noindex')
})

test('configured STUDIO_BASE_PATH alias serves the studio (rewrite)', async ({ request }) => {
	const res = await request.get(`${STUDIO}/posts`)
	expect(res.ok()).toBeTruthy()
})
