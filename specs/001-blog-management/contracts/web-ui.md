# Phase 1 Contract: Web UI (routes & Server Actions)

**Feature**: `specs/001-blog-management/spec.md` | **Date**: 2026-10-14

This app is a server-rendered Next.js application: its interfaces to users are **routes** and **Server Actions** (no public REST API — research D5). `STUDIO_BASE` = env `STUDIO_BASE_PATH`, default `/studio` (research D6).

## Public routes

### `GET /` — home page (FR-001…FR-007)

- Renders dynamically (no cache longer than 60 s — SC-003).
- First batch: 10 visible posts, `publish_time DESC` (D4/D5 predicate in data-model.md).
- Each entry: title (link → `/posts/{slug}`), description, author name, publish date (FR-004).
- "Load more" button visible iff more visible posts exist beyond loaded batch; hidden when exhausted (FR-006, Edge Case).
- Zero visible posts → friendly empty state (FR-007).
- Never linked, referenced, or containing links to `STUDIO_BASE` (FR-008).

### `GET /posts/{slug}` — public post page (FR-005, FR-017)

- 200: title, author name, publish date, sanitized rendered markdown body (D3).
- 404 when the post does not exist **or** is not currently visible (`published && publish_time <= now()`) — unpublished/scheduled posts are unreachable even by direct link (SC-004).

## Server Action: `loadMorePosts(cursor)` (FR-006)

- Input: `cursor = { publishTime: ISO-8601 string, id: uuid }` of the last displayed entry.
- Output: `{ posts: PostListItem[], hasMore: boolean }`, `PostListItem = { slug, title, description, authorName, publishTime }`; ≤ 10 items, strictly older than the cursor.
- Invalid cursor → empty result + `hasMore: false` (fail closed, no error page).

## Management routes & actions (under `STUDIO_BASE`, noindex, unlisted — FR-008)

### `GET {STUDIO_BASE}/posts` — author's post list

- ALL posts regardless of state, newest `updated_at` first; row actions: Edit, Delete.

### `GET {STUDIO_BASE}/posts/new` · `GET {STUDIO_BASE}/posts/{id}` — create/edit form (FR-009…FR-012)

Form fields: title*, description, author name (default from `AUTHOR_DEFAULT_NAME`), publish datetime (local, D8), published toggle, body editor.

### Body editor contract (FR-015/016/018)

- Modes: **WYSIWYG** (Tiptap) ⇄ **raw markdown** (plain-textarea of the canonical markdown).
- Toggle WYSIWYG→markdown: shows markdown serialization of current document.
- Toggle markdown→WYSIWYG: parses markdown into the document.
- Round-trip guarantee: `parse(serialize(doc)) ≡ doc` for the supported node set (headings h1–h3, bold, italic, links, ordered/unordered lists, paragraphs) — acceptance for FR-018/SC-005 (unit-tested, D12).
- Editor state is uncontrolled until save; the saved value is always markdown text.

### Server Action: `savePost(input)` (create & update)

- Input (plain object): `{ id?: uuid, title, description, body, authorName, publishTime?: string, published: boolean }`.
- Validation: Zod rules from data-model.md; on failure returns `{ ok: false, fieldErrors: { field: message } }` rendered inline (FR-010/022, SC-006).
- On success: persists (FR-011), returns `{ ok: true, id, slug }` (slug auto-generated/regenerated from title per D9); UI redirects to the studio list; home page reflects change on next load (SC-007, dynamic rendering).
- Publish semantics: `published=true` with no `publishTime` → `publish_time = now()`; future instant → scheduled hidden until then (FR-019/020).

### Server Action: `deletePost(id)` (FR-013/014)

- UI must confirm before invoking (client dialog; cancel → no action, US5-2).
- Deletes the row permanently; home page and studio list drop it on next load (SC-007).

## Cross-cutting guarantees

- No route other than the public two is linked from public pages; all `STUDIO_BASE` pages send `X-Robots-Tag: noindex` (FR-008).
- All rendered post bodies pass `rehype-sanitize` (no raw HTML/script execution) — required because there is no author authentication this phase.
- Timestamps cross the wire only as ISO-8601 UTC instants; display localized (D8).
