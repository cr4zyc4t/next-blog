'use server'

import { loadMoreBatch } from '@/lib/posts/queries'
import type { CursorDto, PostListItemDto } from '@/lib/posts/types'
import { db } from '@/db/client'

/**
 * FR-006 / contracts: `loadMorePosts(cursor)` — ≤10 items strictly older than
 * the cursor; an invalid cursor fails closed (empty result, hasMore false).
 */
export async function loadMorePosts(
	cursor: CursorDto,
): Promise<{ items: PostListItemDto[]; hasMore: boolean }> {
	const publishTime = new Date(cursor?.publishTime ?? '')
	const isValid =
		!Number.isNaN(publishTime.getTime()) &&
		typeof cursor?.id === 'string' &&
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor.id)
	if (!isValid) {
		return { items: [], hasMore: false }
	}

	const page = await loadMoreBatch(db, { publishTime, id: cursor.id })
	return {
		items: page.items.map((item) => ({ ...item, publishTime: item.publishTime.toISOString() })),
		hasMore: page.hasMore,
	}
}
