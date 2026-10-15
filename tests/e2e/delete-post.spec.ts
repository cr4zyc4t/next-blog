// T045 (FAIL FIRST — TDD): US5 delete with explicit confirmation (FR-013/014, SC-007).
import { expect, test } from '@playwright/test'

import { seedFresh } from './helpers'

test.beforeAll(seedFresh)
test.describe.configure({ mode: 'serial' })

const STUDIO = '/studio'

test('canceling the confirmation leaves the post unchanged (US5-2)', async ({ page }) => {
	await page.goto(`${STUDIO}/posts`)
	const row = page.getByRole('article').filter({ hasText: 'Seed post number 3' })
	await expect(row).toBeVisible()

	page.once('dialog', (dialog) => dialog.dismiss())
	await row.getByRole('button', { name: 'Delete' }).click()

	await expect(row).toBeVisible() // still there after cancel
	await page.goto('/posts/seed-post-number-3')
	await expect(page.getByRole('heading', { level: 1, name: 'Seed post number 3' })).toBeVisible()
})

test('confirming removes the post permanently from home, studio and its URL (US5-1)', async ({
	page,
}) => {
	await page.goto(`${STUDIO}/posts`)
	const row = page.getByRole('article').filter({ hasText: 'Seed post number 4' })
	await expect(row).toBeVisible()

	page.once('dialog', (dialog) => dialog.accept())
	await row.getByRole('button', { name: 'Delete' }).click()
	await expect(row).toHaveCount(0) // FR-014: gone from the studio list (SC-007)

	await page.goto('/')
	await expect(page.getByText('Seed post number 4')).toHaveCount(0) // gone from home
	expect((await page.request.get('/posts/seed-post-number-4')).status()).toBe(404) // no longer retrievable
})
