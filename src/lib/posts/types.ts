/** Serialized post-list DTO crossing the server/client boundary (ISO timestamps). */
export type PostListItemDto = {
	id: string
	slug: string
	title: string
	description: string
	authorName: string
	publishTime: string // ISO 8601 UTC instant
}

export type CursorDto = { publishTime: string; id: string }
