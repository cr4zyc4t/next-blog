// T020 (FAIL FIRST — TDD): FR-005/FR-017 public post page + SC-004 404 rule.
import { expect, test } from '@playwright/test'

import { seedFresh } from './helpers'
test.beforeAll(seedFresh)

test('clicking a home entry opens the post page with the full formatted body', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Seed post number 1', exact: true }).click()
  await expect(page).toHaveURL(/\/posts\/seed-post-number-1$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seed post number 1')
  await expect(page.getByText('Author')).toBeVisible()
  await expect(page.locator('time')).toBeVisible()
  // Formatting preserved (FR-017): markdown → heading + bold + list + link
  await expect(page.getByRole('heading', { level: 2, name: 'Post 1' })).toBeVisible()
  await expect(page.locator('strong')).toContainText('post 1')
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await expect(page.getByRole('link', { name: 'A link' })).toBeVisible()
})

test('direct slug of a scheduled post is 404 until its publish time (SC-004)', async ({
  request,
}) => {
  const res = await request.get('/posts/scheduled-seed-post')
  expect(res.status()).toBe(404)
})

test('direct slug of an unpublished post is 404 (SC-004)', async ({ request }) => {
  const res = await request.get('/posts/draft-seed-post')
  expect(res.status()).toBe(404)
})
