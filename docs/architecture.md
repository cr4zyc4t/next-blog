# Architecture

One Next.js application, one PostgreSQL database. Everything — public pages, the author
studio, data access, and mutations — lives in this repo as a single typed codebase.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), server-rendered; mutations are Server Actions — there is no public REST API |
| Language | TypeScript (strict) on Node.js 24 LTS |
| Database | PostgreSQL 18, accessed via Drizzle ORM (typed rows end-to-end) + drizzle-kit migrations |
| Editing | Tiptap + tiptap-markdown (bidirectional WYSIWYG ⇄ markdown) |
| Public rendering | react-markdown + remark-gfm + **rehype-sanitize** |
| Validation | Zod schemas shared by forms and server actions |
| Testing | Vitest (unit) + Playwright (end-to-end) |
| Packaging | Docker Compose: `db` always; `app` under a `deploy` profile |

## Shape of the system

```
visitor ──HTTP──▶ ┌────────────────────────────── Next.js app ─────────────────────────────┐
                  │ GET /                 home: visible posts, batch of 10                 │
                  │ GET /posts/{slug}     post page (sanitized markdown)                   │
                  │ action loadMorePosts  keyset "next 10 older" (cursor)                  │
 author ─────────▶│ /studio/**            unlisted author area (noindex, never linked)     │
 (private URL)    │   action savePost     create + update (Zod-validated)                  │
                  │   action deletePost   permanent delete (UI confirms first)             │
                  └────────────┬───────────────────────────────────────────────────────────┘
                               ▼
                        PostgreSQL: single table `posts`
```

## Key behavioral rules

- **Visibility is computed at query time**, never stored: a post is public iff
  `published = true AND publish_time <= now()` (Postgres' clock). Scheduling therefore
  needs no cron, queue, or flag flipping — it's just a predicate on every request.
- **Public pages are rendered dynamically** (`force-dynamic`): a cached page could hide a
  newly-due scheduled post, which the product promises never to do (visible within 1 min).
- **Load-more is cursor (keyset) pagination**, not offsets: each batch asks for the 10
  posts older than the last one shown, so new posts appearing mid-scroll never shift or
  duplicate the list. An invalid cursor fails closed (empty page, no button).
- **The studio is unlisted, not protected**: routes live under one base path
  (`STUDIO_BASE_PATH`, default `/studio`; the Next config rewrites a configured alias to
  the internal `/studio` routes, and the Next.js proxy in `src/proxy.ts` stamps every
  studio response with `X-Robots-Tag: noindex`). No public page ever links or refers
  to the studio path (enforced by an E2E scenario).
- **Bodies are stored as canonical markdown** — one source of truth for both editor modes.
  Public rendering always runs through rehype-sanitize; because there's no author
  authentication yet, rendered content is never trusted.
- **Timestamps cross the wire only as ISO-8601 UTC instants**; the browser converts the
  author's local wall-clock input to an instant at submit time.
- **The DB client is import-safe**: creating the connection pool is deferred to first
  query so `next build` (which imports route modules without runtime env) never crashes;
  a missing `DATABASE_URL` then fails clearly at first query.

## Route map

| Route | Purpose |
|---|---|
| `GET /` | Home: first batch of visible posts, newest-first, load-more, empty state |
| `GET /posts/{slug}` | Post page; 404 unless the post exists and is currently visible |
| `GET /studio/posts` | Author list of **all** posts in any state, newest-updated first |
| `GET /studio/posts/new` | Create form |
| `GET /studio/posts/{id}` | Edit form (studio addresses posts by id, not slug) |

Server Actions: `loadMorePosts(cursor)`, `savePost(input)` (create + update),
`deletePost(id)`. All shared validation lives in Zod schemas; failed saves return
per-field error messages and persist nothing.

## Source layout

```
src/
  proxy.ts        Next.js proxy: stamps X-Robots-Tag: noindex on /studio responses
  app/            routes: / , /posts/[slug], /studio/** (the unlisted area)
  components/     post-list/ · post-editor/ (editor, form, publish controls) · markdown/
  db/             schema.ts (Drizzle table) · client.ts (lazy pool) · migrations/
  lib/
    posts/        query service (visibility, keyset batching, lookups)
    actions/      server actions: savePost, deletePost, loadMorePosts
    validation/   Zod schemas + field-error mapping
    editor/       Tiptap config + markdown serialization
    slugify.ts    title → URL slug rules
  tests/          Vitest unit tests (mirrors of lib/db/validation)
tests/e2e/        Playwright scenarios, one per capability
scripts/seed.ts   deterministic sample data (12 live, 1 draft, 1 scheduled +30m)
```

## Security posture (this phase)

- No authentication: knowing the studio URL grants full write access. Accepted risk;
  the URL is the control. The first roadmap item is replacing this.
- XSS defense: all stored bodies are rendered through rehype-sanitize; the Tiptap editor
  runs with `html: false` so raw HTML never enters the markdown either.
- Fail-closed pagination: malformed cursors yield empty pages, not errors.
