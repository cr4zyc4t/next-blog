# Quickstart: Blog Post Management

**Feature**: `specs/001-blog-management/spec.md` | **Date**: 2026-10-14

Validation/run guide only — implementation details live in `tasks.md` and the code.

## Prerequisites

- Node.js **24 LTS** (≥ 20.19 required by Next.js 16)
- Docker (for the Postgres container, and the deploy profile)
- Free local ports: `3000` (app), `5432` (Postgres)

## Setup (local development)

```bash
cp .env.example .env          # DATABASE_URL, AUTHOR_DEFAULT_NAME, STUDIO_BASE_PATH (defaults are dev-safe)
docker compose up -d db       # postgres:18 with named volume — ONLY the DB runs in Docker
npm install                   # installs freshest next@16.4.x patch (security note in research D1)
npm run db:migrate            # drizzle-kit push/migrate against localhost:5432
npm run dev                   # Next.js dev server, natively under Node (user-directed topology)
```

App: http://localhost:3000 · Management (unlisted): http://localhost:3000/studio (per `STUDIO_BASE_PATH`).

## Quality gates (constitution Principle III — must be green)

```bash
npm run lint        # ESLint (+ Prettier via eslint-config-prettier)
npm run typecheck   # tsc --noEmit, strict
npm run test        # Vitest unit suite
npm run test:e2e    # Playwright (starts against dev server; DB from compose)
```

## Validation scenarios (map to spec user stories)

Reference contracts: [contracts/web-ui.md](./contracts/web-ui.md); rules: [data-model.md](./data-model.md).

1. **Create & publish (US2, SC-002)** — Open `/studio/posts/new`, enter title + a few formatted paragraphs in WYSIWYG, toggle to raw markdown (verify the same text appears as markdown), set published, save. **Expect**: redirect to studio list; post on `http://localhost:3000` within 2 s (SC-001).
2. **Validation (FR-010/022, SC-006)** — Save with empty title → inline "Title is required", nothing persisted. Enter malformed publish date → field error.
3. **Unpublished hidden (US2-5)** — Save a post with published off → absent from home; listed in `/studio/posts`.
4. **Scheduled post (US4, SC-003/004)** — Create a published post with publish time = now + 2 minutes (enter it as your local wall-clock; note its generated slug from the title). **Expect**: absent from home AND direct `/posts/{slug}` returns 404; after ≤ 1 minute past the instant, it appears on home automatically (run E2E scenario `e2e/scheduled-post.spec.ts`).
5. **Read page (US1-5, FR-005/017, SC-005)** — Click the scheduled-now-live post on home. **Expect**: `/posts/{slug}` (title-derived, lowercase-hyphenated) shows title, author, date, and body with headings/bold/italic/links/lists rendered; view body in markdown mode → equivalent source.
6. **Edit visibility (US3)** — Toggle a live post to unpublished → gone from home on next load (SC-007); toggle back → reappears.
7. **Load more (FR-006, SC-001)** — Seed 12+ published posts (`npm run db:seed`): home shows 10 newest-first; "load more" appends the remaining 2 then the button disappears (FR-006, Edge Case).
8. **Delete (US5)** — Delete from `/studio/posts`: cancel confirmation → post unchanged; confirm → permanently removed from home and studio list (FR-013/014).
9. **Empty state (FR-007)** — Fresh DB (drop volume, re-migrate): home shows the friendly empty state, no error.
10. **No public path to management (FR-008)** — `curl -s localhost:3000 | grep -i studio` finds no link; `/studio/*` responses carry `X-Robots-Tag: noindex`.

## Deploy validation (Docker Compose)

```bash
docker compose --profile deploy up -d --build   # postgres:18 + built Next.js app
npm run db:migrate                               # against the compose DB
# repeat scenarios 1, 4, 5 against the deployed container
```

## Unit-test focus (TDD entry points — constitution Principle II)

- Visibility predicate & keyset cursor queries (data-model "Query contracts") against a test database.
- Zod validation rules (all limits, malformed dates) — contracts in data-model.md.
- Markdown round-trip: `parse(serialize(doc)) ≡ doc` for the FR-015 node set.
