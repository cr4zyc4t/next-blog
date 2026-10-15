'use client'

import { useState } from 'react'

import { loadMorePosts } from '@/lib/actions/loadMorePosts'
import { PostListItemView } from './PostListItemView'
import type { CursorDto, PostListItemDto } from '@/lib/posts/types'

/**
 * FR-006: "load more" appends the next oldest batch; the control disappears
 * once everything qualifying is shown (Edge Case "All posts already loaded").
 */
export function LoadMoreButton({
	initialCursor,
	initialHasMore,
}: {
	initialCursor: CursorDto
	initialHasMore: boolean
}) {
	const [extra, setExtra] = useState<PostListItemDto[]>([])
	const [cursor, setCursor] = useState<CursorDto>(initialCursor)
	const [hasMore, setHasMore] = useState(initialHasMore)
	const [busy, setBusy] = useState(false)

	if (!hasMore && extra.length === 0) return null

	const onClick = async () => {
		setBusy(true)
		try {
			const page = await loadMorePosts(cursor)
			setExtra((prev) => [...prev, ...page.items])
			const last = page.items[page.items.length - 1]
			if (last) setCursor({ publishTime: last.publishTime, id: last.id })
			setHasMore(page.hasMore)
		} finally {
			setBusy(false)
		}
	}

	return (
		<>
			{extra.length > 0 ? (
				<ul className="post-list" aria-label="More published posts" data-testid="post-list-extra">
					{extra.map((item) => (
						<li key={item.id}>
							<PostListItemView item={item} />
						</li>
					))}
				</ul>
			) : null}
			{hasMore ? (
				<button type="button" onClick={onClick} disabled={busy} aria-label="Load more">
					{busy ? 'Loading…' : 'Load more'}
				</button>
			) : null}
		</>
	)
}
