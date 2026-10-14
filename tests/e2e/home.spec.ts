// T019 (FAIL FIRST — TDD): US1 home page acceptance scenarios + SC-001 timing.
import { expect, test } from '@playwright/test'

test('published posts are listed newest-first with title, description, author, date', async ({
  page,
}) => {
  const started = Date.now()
  await page.goto('/')
  const list = page.getByRole('list', { name: 'Published posts' })
  await expect(list).toBeVisible()
  const titles = list.locator('article h2 a')
  await expect(titles).toHaveCount(10) // SC-001: initial batch = 10 (research D5)
  await expect(titles.first()).toHaveText('Seed post number 1') // newest first (FR-003)
  const first = list.locator('article').first()
  await expect(first).toContainText('Description for seed post 1') // FR-004
  await expect(first).toContainText('Author') // author name
  await expect(first.locator('time')).toBeVisible() // publication date

  // SC-001: initial batch visible within 2 s of navigation (dev-profile, warmed).
  expect(Date.now() - started).toBeLessThan(2000)
})

test('unpublished and future-scheduled posts never appear (SC-004)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Draft seed post')).toHaveCount(0)
  await expect(page.getByText('Scheduled seed post')).toHaveCount(0)
})

test('load more appends older batches and disappears when exhausted (FR-006)', async ({
  page,
}) => {
  await page.goto('/')
  const list = page.getByRole('list', { name: 'Published posts' })
  const button = page.getByRole('button', { name: 'Load more' })
  await expect(button).toBeVisible()

  const started = Date.now()
  await button.click()
  await expect(page.locator('.post-list article')).toHaveCount(12, { timeout: 2000 }) // SC-001 per batch
  expect(Date.now() - started).toBeLessThan(2000)
  await expect(page.getByText('Seed post number 12')).toBeVisible()

  await expect(button).toHaveCount(0) // control disappears when exhausted
})
