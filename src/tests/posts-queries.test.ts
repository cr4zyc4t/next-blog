// @vitest-environment node
// T013 (FAIL FIRST — TDD): Query contracts from data-model.md.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { addDaysMs, subDaysMs, subMinutesMs } from './test-dates'

import type { DbHandle } from '@/tests/db-harness'
import { createTestDb } from '@/tests/db-harness'
import {
  getVisibleBySlug,
  listAllForStudio,
  listFirstBatch,
  loadMoreBatch,
} from '@/lib/posts/queries'
import { posts } from '@/db/schema'

let handle: DbHandle

beforeAll(async () => {
  handle = await createTestDb()
})

afterAll(async () => {
  await handle.close()
})

beforeEach(async () => {
  await handle.reset()
})

const seed = async () => {
  const now = Date.now()
  await handle.db.insert(posts).values([
    {
      slug: 'third',
      title: 'Third',
      publishTime: new Date(now - subMinutesMs(30)),
      published: true,
      authorName: 'A',
    },
    {
      slug: 'first',
      title: 'First',
      publishTime: new Date(now - subDaysMs(1)),
      published: true,
      authorName: 'A',
    },
    {
      slug: 'second',
      title: 'Second',
      publishTime: new Date(now - subDaysMs(2)),
      published: true,
      authorName: 'A',
    },
    {
      slug: 'scheduled',
      title: 'Scheduled',
      publishTime: new Date(now + addDaysMs(1)),
      published: true,
      authorName: 'A',
    },
    {
      slug: 'draft',
      title: 'Draft',
      publishTime: new Date(now - subDaysMs(3)),
      published: false,
      authorName: 'A',
    },
  ])
}

describe('visibility + keyset queries', () => {
  it('first batch: only visible rows (published AND publish_time <= now), newest first, LIMIT respected', async () => {
    await seed()
    const { items, hasMore } = await listFirstBatch(handle.db, 2)
    expect(items.map((p) => p.title)).toEqual(['Third', 'First'])
    expect(hasMore).toBe(true)
  })

  it('unpublished and future-scheduled never appear (SC-004)', async () => {
    await seed()
    const { items, hasMore } = await listFirstBatch(handle.db, 10)
    expect(items.map((p) => p.slug).sort()).toEqual(['first', 'second', 'third'])
    expect(hasMore).toBe(false)
  })

  it('load-more cursor is strictly older (publish_time, id) — no overlap, no gaps', async () => {
    await seed()
    const page1 = await listFirstBatch(handle.db, 2)
    const last = page1.items[page1.items.length - 1]
    const page2 = await loadMoreBatch(handle.db, { publishTime: last.publishTime, id: last.id }, 2)
    expect(page2.items.map((p) => p.title)).toEqual(['Second'])
    expect(page2.hasMore).toBe(false)
  })

  it('exact-equality boundary: publish_time === now is visible', async () => {
    const at = new Date()
    await handle.db
      .insert(posts)
      .values({ slug: 'exact', title: 'Exact', publishTime: at, published: true, authorName: 'A' })
    const { items } = await listFirstBatch(handle.db, 10)
    expect(items.map((p) => p.slug)).toContain('exact')
  })

  it('getVisibleBySlug: returns visible only', async () => {
    await seed()
    expect((await getVisibleBySlug(handle.db, 'first'))?.title).toBe('First')
    expect(await getVisibleBySlug(handle.db, 'scheduled')).toBeUndefined()
    expect(await getVisibleBySlug(handle.db, 'draft')).toBeUndefined()
    expect(await getVisibleBySlug(handle.db, 'nope')).toBeUndefined()
  })

  it('listAllForStudio: ALL posts any state, newest updated_at first', async () => {
    await seed()
    const all = await listAllForStudio(handle.db)
    expect(all).toHaveLength(5)
    const slugs = all.map((p) => p.slug)
    expect(slugs).toEqual(expect.arrayContaining(['scheduled', 'draft']))
  })
})
