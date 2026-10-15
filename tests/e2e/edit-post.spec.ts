// T035 (FAIL FIRST — TDD): US3 edit acceptance scenarios (FR-012, SC-007).
import { expect, test } from '@playwright/test'

import { seedFresh } from './helpers'
test.beforeAll(seedFresh)

const STUDIO = '/studio'

test('editing title/body is reflected on home and the post page; slug regenerates', async ({
	page,
}) => {
	// Seed creates "Seed post number 12" at /posts/seed-post-number-12.
	await page.goto(`${STUDIO}/posts`)
	const row = page.getByRole('article').filter({ hasText: 'Seed post number 12' })
	await expect(row).toBeVisible()
	await row.getByRole('link', { name: 'Edit' }).click()
	await expect(page).toHaveURL(/\/studio\/posts\/[0-9a-f-]{36}$/)

	await page.getByLabel('Title').fill('Renamed via edit')
	await page.getByRole('button', { name: 'Markdown' }).click()
	await page.getByLabel('Body (markdown)').fill('Updated **body** text')
	await page.getByRole('button', { name: 'Save post' }).click()
	await expect(page).toHaveURL(/\/studio\/posts$/, { timeout: 5000 })

	await page.goto('/')
	await page.getByRole('button', { name: 'Load more' }).click() // post 12 is the oldest — beyond batch 1
	await expect(page.getByRole('link', { name: 'Renamed via edit' })).toBeVisible()

	await page.goto('/posts/renamed-via-edit')
	await expect(page.getByRole('heading', { level: 1, name: 'Renamed via edit' })).toBeVisible()
	await expect(page.locator('strong')).toHaveText('body')

	// Regenerated slug: the old address no longer resolves (research D9).
	const old = await page.request.get('/posts/seed-post-number-12')
	expect(old.status()).toBe(404)
})

test('published -> unpublished hides from home on next load (US3-2, SC-007)', async ({ page }) => {
	await page.goto(`${STUDIO}/posts`)
	const row = page.getByRole('article').filter({ hasText: 'Seed post number 11' })
	await row.getByRole('link', { name: 'Edit' }).click()
	await expect(page.getByLabel('Published')).toBeChecked()
	await page.getByLabel('Published').uncheck()
	await page.getByRole('button', { name: 'Save post' }).click()
	await expect(page).toHaveURL(/\/studio\/posts$/, { timeout: 5000 })

	await page.goto('/')
	await page.getByRole('button', { name: 'Load more' }).click()
	await expect(page.getByText('Seed post number 11')).toHaveCount(0)
})

test('unpublished -> published appears on home (US3-3)', async ({ page }) => {
	await page.goto(`${STUDIO}/posts`)
	const row = page.getByRole('article').filter({ hasText: 'Draft seed post' })
	await row.getByRole('link', { name: 'Edit' }).click()
	await page.getByLabel('Published').check()
	await page.getByRole('button', { name: 'Save post' }).click()
	await expect(page).toHaveURL(/\/studio\/posts$/, { timeout: 5000 })

	await page.goto('/')
	await page.getByRole('button', { name: 'Load more' }).click() // draft's publish time is oldest
	await expect(page.getByRole('link', { name: 'Draft seed post' })).toBeVisible()
})
