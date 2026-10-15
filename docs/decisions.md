# Decisions

A running log of the choices that shape this project, with the reasoning and the
alternatives that were rejected. Newest first within each section. **Don't edit history —
add an entry that supersedes it.**

## Way of working

- **W1 — Spec before code.** Every feature starts from a written spec with testable
  scenarios; code must trace to one. Planning artifacts live in `specs/` as history;
  `docs/` is the current truth.
- **W2 — Test-first, non-negotiable.** For each behavior, a failing test is written and
  observed before the implementation that satisfies it. Tests are never weakened,
  skipped, or deleted to make a gate pass.
- **W3 — Three mechanical gates.** `npm run lint`, `npm run typecheck`, `npm run test`
  must be green on any finished change — plus the end-to-end suite for user-facing work.
  A failing gate is investigated, never bypassed.
- **W4 — Strict typing everywhere; no `any`.** Drizzle gives typed rows; Zod gives typed
  inputs; end to end without casts except narrowly-justified third-party boundaries.
- **W5 — YAGNI.** One table, one app, no auth, no cache tiers — every dependency traces
  to a present need. Complexity must name the problem it solves.

## Product & security

- **D1 — No sign-in yet; the studio URL is the control.** The current phase protects the
  author area purely by keeping its address unlisted: no links from public pages,
  `X-Robots-Tag: noindex`, optional path renaming via `STUDIO_BASE_PATH`. Rejected:
  half-built auth (an account system done wrong is worse than none). Accepted risk:
  anyone who learns the URL can edit. Superseded by roadmap item 1 (authentication).
- **D2 — Permanent delete, with a mandatory confirmation step.** No trash/restore; the
  dialog ("cancel → nothing happens") is the safeguard. Rejected: soft-delete column +
  restore UI for a single-author blog that doesn't need it yet.
- **D3 — Title-derived slugs for public URLs, ids for the studio.** `/posts/my-post`
  reads well; regeneration on title change keeps URLs meaningful; `-2/-3` suffixes keep
  duplicate titles from erroring. Rejected: uuid-only URLs (worse for readers);
  author-editable slugs (extra validation surface, deferred); redirect tables for old
  titles (SEO nicety, deferred).

## Data & behavior

- **D4 — Body is canonical markdown; editors are two views of it.** Storing one format
  makes lossless WYSIWYG ⇄ raw-markdown switching a serialization property instead of a
  sync problem, and keeps "one post body" honest. Tiptap + tiptap-markdown both parse
  and serialize the same node set (h1–h3, bold, italic, links, lists, paragraphs).
  Rejected: HTML canonical + html→markdown conversion (lossier); storing both formats
  (two sources of truth drift apart).
- **D5 — Scheduled publishing is a query-time predicate, not a job.** Public ⇔
  `published AND publish_time <= now()` evaluated by Postgres per request. "Appears
  automatically" becomes free; no cron, queue, or flag can fail. Rejected: a scheduler
  that flips a visibility flag (extra moving parts), and client-side hiding (leaks
  unpublished content in the payload).
- **D6 — Keyset (cursor) pagination for "load more", batch size 10.** Cursor =
  `(publish_time, id)` of the last shown entry; stable against inserts. Batch size 10
  and the ≤2 s budget satisfy the browsing goal. Rejected: offset paging (rows shift as
  new posts appear), infinite scroll (the author asked for a button).
- **D7 — Publish times are exact instants.** The form takes the author's local
  wall-clock (`datetime-local`); the browser converts to a UTC instant at submit;
  Postgres `timestamptz` + `now()` keep comparisons correct across daylight saving.
  Server rejects nonsense dates (parseable, year 1970–2100). Rejected: naive timestamps
  (ambiguous across DST).
- **D8 — Content limits, set once, enforced identically on server and form.** Title ≤
  200 (required, trimmed), description ≤ 500, body ≤ 100,000, author ≤ 100, batches of
  10. Zod schemas are the single place they're defined.
- **D9 — No public REST API.** Mutations and pagination go through typed Server Actions.
  Fewer public surfaces to probe and validate — which matters precisely because there is
  no auth. Rejected: a route-handler API (works, but adds a surface for no benefit).

## Rendering & safety

- **D10 — Public pages are dynamically rendered** (no static cache): a cached home page
  could hold a scheduled post back past its minute-level visibility promise.
- **D11 — Every rendered body passes rehype-sanitize; the editor forbids raw HTML.**
  With no author authentication, stored content cannot be trusted, so rendering never
  executes HTML/scripts. Rejected: trusting author input (one malicious saved body would
  make the public site unsafe).
- **D12 — The database client is import-safe.** Creating the pg pool is deferred until
  the first query (`src/db/client.ts` proxy), because the production build imports route
  modules without runtime env. Misconfiguration still fails loudly and early — at first
  query, with "DATABASE_URL is not set". Rejected: a build-time env placeholder
  (bakes config into the image).

## Infrastructure

- **D13 — One Docker Compose, two profiles.** `docker compose up -d db` for local
  development (dev server runs natively under Node, per the operator's directive);
  `docker compose --profile deploy up -d --build` for deployment (multi-stage Dockerfile,
  Next standalone output). Rejected: separate compose files (duplication), developing
  inside a container (slower feedback loop than native).
- **D14 — Postgres is the one datastore for dev and deploy.** Dev uses the compose DB;
  the deploy profile reuses it. Tests seed/reset it deterministically (`npm run db:seed`).
- **D15 — E2E runs serially against a freshly seeded DB.** Specs mutate shared rows, so
  files run one at a time with a per-file re-seed; the scheduled-publishing scenario
  deliberately waits on the real clock instead of faking time.
