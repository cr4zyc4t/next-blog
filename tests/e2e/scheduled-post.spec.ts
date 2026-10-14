// T040 (FAIL FIRST — TDD): US4 scheduled publication (SC-003, SC-004, US4-3).
import { expect, test } from '@playwright/test'

import { seedFresh } from './helpers'

test.beforeAll(seedFresh)
test.describe.configure({ mode: 'serial' })
test.setTimeout(300_000)

const STUDIO = '/studio'

/** datetime-local values are browser-local wall-clock (research D8). */
const localInputValue = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const isoFromLocal = (value: string) => new Date(value).toISOString()

test('seeded +30m scheduled post is hidden from home and 404 by direct slug', async ({
  page,
  request,
}) => {
  await page.goto('/')
  await expect(page.getByText('Scheduled seed post')).toHaveCount(0)
  expect((await request.get('/posts/scheduled-seed-post')).status()).toBe(404)
})

test('post scheduled ~1 minute ahead appears automatically within 1 minute (SC-003)', async ({
  page,
}) => {
  const when = new Date(Date.now() + 60_000)
  await page.goto(`${STUDIO}/posts/new`)
  await page.getByLabel('Title').fill('Timed post')
  await page.getByLabel('Published').check()
  await page.getByLabel('Publish at (local time)').fill(localInputValue(when))
  await page.getByRole('button', { name: 'Save post' }).click()
  await expect(page).toHaveURL(/\/studio\/posts$/, { timeout: 5000 })

  const slug = 'timed-post'
  // Hidden before the instant (SC-004).
  expect((await page.request.get(`/posts/${slug}`)).status()).toBe(404)
  await page.goto('/')
  await expect(page.getByText('Timed post')).toHaveCount(0)

  // Automatic appearance within 1 minute of the instant — poll (dynamic home page).
  const deadline = when.getTime() + 60_000
  let appeared = false
  while (Date.now() < deadline) {
    if ((await page.request.get(`/posts/${slug}`)).ok()) {
      appeared = true
      break
    }
    await page.waitForTimeout(3000)
  }
  expect(appeared).toBe(true)
  expect(Date.now()).toBeLessThanOrEqual(deadline)

  // And it is listed on the home page automatically.
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Timed post' })).toBeVisible()
})

test('pushing the publish time later re-hides the post until the new instant (US4-3)', async ({
  page,
}) => {
  const first = new Date(Date.now() + 30_000)
  const second = new Date(Date.now() + 120_000)

  await page.goto(`${STUDIO}/posts/new`)
  await page.getByLabel('Title').fill('Moved schedule')
  await page.getByLabel('Published').check()
  await page.getByLabel('Publish at (local time)').fill(localInputValue(first))
  await page.getByRole('button', { name: 'Save post' }).click()
  await expect(page).toHaveURL(/\/studio\/posts$/, { timeout: 5000 })

  await page.goto(`${STUDIO}/posts`)
  await page
    .getByRole('article')
    .filter({ hasText: 'Moved schedule' })
    .getByRole('link', { name: 'Edit' })
    .click()
  await page.getByLabel('Publish at (local time)').fill(localInputValue(second))
  await page.getByRole('button', { name: 'Save post' }).click()
  await expect(page).toHaveURL(/\/studio\/posts$/, { timeout: 5000 })

  // At first+5s the post must STILL be hidden — the new time controls (US4-3).
  await page.waitForTimeout(35_000)
  const isoWhen = isoFromLocal(localInputValue(first))
  expect(new Date(isoWhen).getTime()).toBeLessThan(Date.now()) // first instant has passed
  expect((await page.request.get('/posts/moved-schedule')).status()).toBe(404)

  // Then it appears after the new instant.
  const deadline = second.getTime() + 60_000
  let appeared = false
  while (Date.now() < deadline) {
    if ((await page.request.get('/posts/moved-schedule')).ok()) {
      appeared = true
      break
    }
    await page.waitForTimeout(3000)
  }
  expect(appeared).toBe(true)
})
