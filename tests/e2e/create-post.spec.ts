// T028 (FAIL FIRST — TDD): US2 create flow, validation, unpublished handling.
import { expect, test } from '@playwright/test'

test('author creates a post: WYSIWYG bold survives, appears on home within 2 s', async ({
  page,
}) => {
  await page.goto('/studio/posts/new')
  await page.getByLabel('Title').fill('Bold experiment')
  await page.getByLabel('Description').fill('Checking the rich-text editor')

  // WYSIWYG: type text, apply bold to a word via the toolbar (FR-015).
  await page.locator('.tiptap').click()
  await page.keyboard.type('Hello ')
  await page.getByRole('button', { name: 'Bold', exact: true }).click()
  await expect(page.locator('.tiptap')).toBeFocused() // toolbar focus chain must land before typing
  await page.keyboard.type('bold')
  await page.getByRole('button', { name: 'Bold', exact: true }).click()
  await expect(page.locator('.tiptap')).toBeFocused()

  // FR-016: switching to markdown shows equivalent markdown (FR-018, SC-005).
  await page.getByRole('button', { name: 'Markdown' }).click()
  await expect(page.getByLabel('Body (markdown)')).toHaveValue(/Hello \*\*bold\*\*/)

  await page.getByLabel('Published').check()
  const started = Date.now()
  await page.getByRole('button', { name: 'Save post' }).click()
  await expect(page).toHaveURL(/\/studio\/posts(\?.*)?$/, { timeout: 5000 })

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Bold experiment' })).toBeVisible({ timeout: 2000 })
  expect(Date.now() - started).toBeLessThan(180_000) // SC-002 sanity bound

  // Formatting preserved on the public page (FR-017).
  await page.getByRole('link', { name: 'Bold experiment', exact: true }).click()
  await expect(page.locator('strong')).toHaveText('bold')
})

test('empty title blocks the save with an inline message; nothing persists', async ({ page }) => {
  await page.goto('/studio/posts/new')
  await page.getByLabel('Title').fill('   ')
  await page.getByRole('button', { name: 'Save post' }).click()
  await expect(page.getByText('Title is required')).toBeVisible()
  await expect(page).toHaveURL(/\/studio\/posts\/new/)

  await page.goto('/')
  await expect(page.getByText('Draft seed post')).toHaveCount(0) // no accidental writes
})

test('markdown-mode content renders as formatting on the public page (US2-3)', async ({ page }) => {
  await page.goto('/studio/posts/new')
  await page.getByLabel('Title').fill('Markdown authored')
  await page.getByRole('button', { name: 'Markdown' }).click()
  await page
    .getByLabel('Body (markdown)')
    .fill('## Sub heading\n\nHello **bold** world\n\n- one\n- two')
  await page.getByLabel('Published').check()
  await page.getByRole('button', { name: 'Save post' }).click()
  await expect(page).toHaveURL(/\/studio\/posts(\?.*)?$/, { timeout: 5000 }) // save completed

  await page.goto('/posts/markdown-authored')
  await expect(page.getByRole('heading', { level: 2, name: 'Sub heading' })).toBeVisible()
  await expect(page.locator('strong')).toHaveText('bold')
  await expect(page.getByRole('listitem')).toHaveCount(2)
})

test('saving as unpublished stores the post but keeps it off the home page (US2-5)', async ({
  page,
}) => {
  await page.goto('/studio/posts/new')
  await page.getByLabel('Title').fill('Quiet draft')
  await page.getByRole('button', { name: 'Save post' }).click()
  await expect(page).toHaveURL(/\/studio\/posts(\?.*)?$/, { timeout: 5000 })

  await page.goto('/')
  await expect(page.getByText('Quiet draft')).toHaveCount(0)
})
