import { EmptyState } from '@/components/post-list/EmptyState'
import { LoadMoreButton } from '@/components/post-list/LoadMoreButton'
import { PostList } from '@/components/post-list/PostList'
import { db } from '@/db/client'
import { listFirstBatch } from '@/lib/posts/queries'

// SC-003: never cache past visibility changes — scheduled posts must appear
// within 1 minute (research D1).
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const page = await listFirstBatch(db)
  const items = page.items.map((item) => ({
    ...item,
    publishTime: item.publishTime.toISOString(),
  }))

  if (items.length === 0) {
    return (
      <main className="public-shell">
        <h1>Next Blog</h1>
        <EmptyState />
      </main>
    )
  }

  const last = items[items.length - 1]

  return (
    <main className="public-shell">
      <h1>Next Blog</h1>
      <PostList items={items} />
      <LoadMoreButton
        initialCursor={{ publishTime: last.publishTime, id: last.id }}
        initialHasMore={page.hasMore}
      />
    </main>
  )
}
