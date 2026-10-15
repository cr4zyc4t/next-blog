/**
 * Service queries (data-model.md Query contracts). Visibility is computed at
 * query time — never stored (research D4). Batch size default 10 (research D5/D10).
 */
import { and, desc, lt, or, eq, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import type { Post } from '@/db/schema'
import { posts } from '@/db/schema'

export const DEFAULT_BATCH_SIZE = 10

export type PostListItem = {
	id: string
	slug: string
	title: string
	description: string
	authorName: string
	publishTime: Date
}

export type Page<T> = { items: T[]; hasMore: boolean }

export type Cursor = { publishTime: Date; id: string }

type Db = NodePgDatabase<typeof import('@/db/schema')>

const visibleWhere = () => and(eq(posts.published, true), sql`${posts.publishTime} <= now()`)

function toItem(p: Post): PostListItem {
	return {
		id: p.id,
		slug: p.slug,
		title: p.title,
		description: p.description,
		authorName: p.authorName,
		publishTime: p.publishTime,
	}
}

async function pageWithHasMore(
	db: Db,
	where: ReturnType<typeof and>,
	limit: number,
): Promise<Page<PostListItem>> {
	const rows = await db
		.select()
		.from(posts)
		.where(where)
		.orderBy(desc(posts.publishTime), desc(posts.id))
		.limit(limit + 1)
	const hasMore = rows.length > limit
	return { items: rows.slice(0, limit).map(toItem), hasMore }
}

/** Contract 1: `WHERE published AND publish_time <= now() ORDER BY publish_time DESC, id DESC LIMIT n` */
export function listFirstBatch(db: Db, limit: number = DEFAULT_BATCH_SIZE) {
	return pageWithHasMore(db, visibleWhere(), limit)
}

/** Contract 2: keyset — `AND (publish_time, id) < (cursor.publish_time, cursor.id)` */
export function loadMoreBatch(db: Db, cursor: Cursor, limit: number = DEFAULT_BATCH_SIZE) {
	const where = and(
		visibleWhere(),
		or(
			lt(posts.publishTime, cursor.publishTime),
			sql`(${posts.publishTime} = ${cursor.publishTime} AND ${posts.id} < ${cursor.id})`,
		),
	)
	return pageWithHasMore(db, where, limit)
}

/** Contract 3: slug fetch — visible only (404 rule enforced by caller) */
export async function getVisibleBySlug(db: Db, slug: string): Promise<Post | undefined> {
	const rows = await db
		.select()
		.from(posts)
		.where(and(eq(posts.slug, slug), visibleWhere()))
		.limit(1)
	return rows[0]
}

/** Contract 4: studio list — ALL posts, newest updated_at first */
export async function listAllForStudio(db: Db): Promise<Post[]> {
	return db.select().from(posts).orderBy(desc(posts.updatedAt), desc(posts.id))
}
