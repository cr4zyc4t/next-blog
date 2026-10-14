# Phase 0 Research: Blog Post Management

**Feature**: `specs/001-blog-management/spec.md` | **Date**: 2026-10-14

All technology choices were **user-directed** (Next.js latest, Postgres + Drizzle, Docker Compose, ESLint + Prettier); research resolves the remaining unknowns and versions.

## D1. Framework version & rendering model

- **Decision**: Next.js **16.4** (latest stable, Oct 2026) via App Router, Node.js **24 LTS**, TypeScript strict. Public pages are **dynamically rendered** server components (no static export, no ISR tiers).
- **Rationale**: Next.js 16 stable line ships Turbopack, React 19.3, Server Actions as the standard mutation path. Dynamic rendering is required because scheduled publication (FR-020, SC-003: visible within 1 minute) must not be frozen by a static cache; a ≤ 60 s cache or plain dynamic render satisfies SC-003.
- **Alternatives considered**: Next.js 15 (older stable — rejected, user asked for latest); static export + rebuild on schedule (rejected: needs a scheduler, breaks "within 1 minute"); ISR with 60 s revalidation (viable optimization, deferred as unneeded complexity — YAGNI).
- **Note**: Vercel announced an out-of-band Next.js security update dated 2026-10-14; implementation MUST install the freshest `next@16.4.x` patch at setup time.

## D2. Datastore & ORM

- **Decision**: PostgreSQL **18** (`postgres:18` image) accessed with **drizzle-orm 0.45.x** (latest stable; 1.0 still RC) + **drizzle-kit** for SQL migrations, driver `pg`.
- **Rationale**: User-directed stack. Drizzle 0.45 is the stable line (1.0 is release-candidate — avoid per YAGNI/stability); drizzle-kit generates deterministic migrations, satisfying FR-011 persistence with full TypeScript row typing (Principle IV).
- **Alternatives considered**: Drizzle 1.0 RC (not stable); Prisma (rejected — user directed Drizzle); SQLite (rejected — user directed Postgres, and `timestamptz` semantics matter for D5).

## D3. Editor & canonical body format (FR-015/016/017/018)

- **Decision**: Store the body **canonically as markdown** (single `text` column). Editing: **Tiptap** rich-text editor with the **`tiptap-markdown`** extension — it parses markdown into the WYSIWYG document and serializes back to markdown, giving true bidirectional equivalence. Public rendering (FR-017): `react-markdown` + `remark-gfm` + `rehype-sanitize` (server-side).
- **Rationale**: One canonical format makes "switch modes without data loss" (FR-018) a serialization property, not a sync problem; raw-markdown mode edits the stored value directly. Tiptap is the mainstream headless React editor with maintained markdown round-trip support; rehype sanitization addresses XSS from author-supplied links/HTML — important because this phase has **no auth**, so the renderer cannot trust input.
- **Alternatives considered**: HTML canonical + turndown (html→md) — lossier round-trip; Plate/Novel — heavier or block-collab oriented; storing both HTML and markdown — duplicate source of truth, contradicts clarification "one post body".
- **Supported formatting set** (maps to FR-015): headings (h1–h3), bold, italic, links, ordered/unordered lists, paragraphs; GFM extensions tolerated on render.

## D4. Visibility & scheduled publication (FR-002/019/020/021)

- **Decision**: No job/cron. Visibility is computed **at query time**: a post is listed iff `published = true AND publish_time <= now()` (Postgres `now()`, indexed on `(published, publish_time DESC)`).
- **Rationale**: "Appears automatically" (FR-020) reduces to a predicate on the request; zero moving parts (YAGNI). Query-time evaluation makes SC-003 trivially true whenever the page re-renders (dynamic rendering, D1).
- **Alternatives considered**: Cron/queue that flips a `visible` flag (rejected: extra infra, failure modes); client-side hiding (rejected: leaks unpublished posts in payload).

## D5. Load-more batching (FR-006, SC-001)

- **Decision**: Cursor-based batching via a **Server Action** `loadMorePosts(cursor)`: batch size **10**; cursor = `(publish_time, id)` of the last rendered post; response = serialized plain objects (title, description, authorName, publishTime ISO string, id/slug for link). No public REST API.
- **Rationale**: Server Actions keep the typed end-to-end path (Principle IV) without exposing endpoints a stranger could probe (FR-008 posture). Keyset pagination on the visibility index is stable against inserts, unlike offsets. Batch size 10 is the plan-time decision the spec deferred.
- **Alternatives considered**: Route handler GET `/api/posts` (works, but adds a public surface needing its own validation — more to secure for no benefit); offset pagination (drift on new posts); infinite scroll (user chose a button in clarification).

## D6. Unlisted management area (FR-008)

- **Decision**: Management routes live under one base path, `STUDIO_BASE_PATH` env var, **default `/studio`** for local dev; pages send `X-Robots-Tag: noindex` and are never linked from public pages or sitemap. No auth this phase (spec Assumption, accepted limitation). The route group is statically authored at `/studio`; a middleware rewrite maps any configured `STUDIO_BASE_PATH` to it, so deployments can rename the segment without code changes.
- **Rationale**: Spec explicitly defers auth; the env-configurable path lets deployments pick a non-guessable segment without code changes.
- **Alternatives considered**: Hardcoded `/admin` (more guessable); middleware IP allowlist (out of scope, unrequested).

## D7. Author identity (FR-009, Key Entities)

- **Decision**: Author is a **name string**, no accounts. Default from env `AUTHOR_DEFAULT_NAME` (fallback `"Author"`), pre-filled in the form and overridable per post; stored per post (`author_name`).
- **Rationale**: Clarification C removed sign-in; spec asks for "blog default, editable per post".
- **Alternatives considered**: Authors table (no data to normalize — YAGNI); full names on a User entity (no users this phase).

## D8. Publish-time entry & time zone (FR-019, FR-022, SC-003)

- **Decision**: Form uses `<input type="datetime-local">`; the browser interprets it in the author's local zone, submitted as an **ISO 8601 instant (UTC)**, stored as `timestamptz`. Server validates with Zod: parseable instant, year within a sane range (1970–2100); malformed → field error (FR-022). "Publish now" convenience sets `publish_time = now()` when publishing without a chosen time (spec Assumption).
- **Rationale**: Matches clarification "author's local wall-clock → exact instant, stored once"; `timestamptz` + `now()` keeps query-time comparison correct across DST.
- **Alternatives considered**: Separate date/time text fields + manual parse (more error states); storing naive timestamps (DST-ambiguous — violates the clarification).

## D9. Post page addressing (FR-005) — user-directed: use slug

- **Decision**: Public post URL `/posts/[slug]`. `slug` is a dedicated, **unique** column, auto-generated from the title (lowercase, ASCII-folded, non-alphanumerics → `-`, length-capped at 200) and regenerated whenever the title changes; uniqueness enforced by appending `-2`, `-3`, … (or a short uuid suffix on collision). Management routes keep addressing posts by `id`.
- **Rationale**: User directive. Slug generated deterministically from the title is the standard blog pattern and reads well; regenerating on title change keeps URLs meaningful (no stale title-slugs); unique-suffix fallback prevents 500s on duplicate titles. Admin stays id-keyed so slug churn never breaks the studio.
- **Alternatives considered**: Surrogate uuid in URL (previous default — overridden by user); slug editable by author + manual (adds a UX field and validation surface beyond spec — deferred); permanent slug + redirect table for old titles (SEO nicety, out of scope — old links 404 until a future redirects feature).

## D10. Content limits & batching numbers (spec-deferred decisions)

- **Decision**: title ≤ **200** chars (required, trimmed); description ≤ **500**; body ≤ **100,000**; author name ≤ **100**; list batch size **10**. Violations surface as per-field validation messages (FR-010, FR-022, SC-006).
- **Rationale**: The spec's own suggested limit (≤ 200 title) plus generous practical ceilings; all enforceable identically in Zod (server) and the form (client).
- **Alternatives considered**: No limits (FR "Very long title" edge case demands bounds); DB `varchar`-only enforcement (poor error UX).

## D11. Dev/deploy topology & tooling

- **Decision**: `docker-compose.yml` defines `db` (postgres:18, named volume) for **local dev** (`docker compose up -d db`, then native `npm run dev`), plus an `app` service (multi-stage `Dockerfile`) under a `deploy` profile for deployment (`docker compose --profile deploy up -d --build`). Gates as npm scripts: `lint` (ESLint), `typecheck` (`tsc --noEmit`), `test` (Vitest), `test:e2e` (Playwright). Lint: `eslint-config-next` + `eslint-config-prettier` + `eslint-plugin-prettier` (user-directed ESLint+Prettier pairing); Prettier owns formatting, ESLint owns correctness rules.
- **Rationale**: Exactly the topology the user directed; profiles keep dev (DB-only) and deploy (DB+app) in one file (simplicity).
- **Alternatives considered**: Separate compose files (duplicated config); running the dev server in a container too (explicitly rejected by the user's directive to run Next dev natively).

## D12. Testing strategy (constitution Principles II/III)

- **Decision**: **Vitest** unit tests (written first per TDD) over: visibility predicate query builder, validation schemas (title required, limits, malformed dates), markdown round-trip serialization, batch cursor logic. **Playwright** E2E covering the 5 user stories' acceptance scenarios against the dev stack.
- **Rationale**: Constitution mandates unit tests + TDD; Playwright maps 1:1 to Given/When/Then scenarios including scheduled-publication timing (create +2 min post, wait, assert appears — SC-003).
- **Alternatives considered**: Jest (weaker ESM/Next integration); Cypress (Playwright lighter to run in compose).

## Open items from spec, now resolved

| Spec item | Resolution |
|-----------|------------|
| "exact limits are set at planning time" (Assumptions) | D10 |
| "batch sizes set at planning time" (Assumptions) | D5/D10 |
| unlisted "management addresses" mechanism (FR-008) | D6 |
| author "configured default" (FR-009) | D7 |

No NEEDS CLARIFICATION markers remain.
