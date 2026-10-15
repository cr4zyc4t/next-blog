# Development guide

## Prerequisites

- Node.js **24 LTS** (Next.js 16 needs ≥ 20.19)
- Docker (Postgres runs in a container in every setup)
- Free ports: `3000` (app), `5433` (Postgres host mapping)

## First run

```bash
cp .env.example .env          # sensible dev defaults, see Environment below
docker compose up -d db       # postgres:18 with a named volume
npm install
npm run db:migrate            # apply schema migrations
npm run db:seed               # optional: 12 live + 1 draft + 1 scheduled(+30m) posts
npm run dev                   # native Next.js dev server (the DB is what lives in Docker)
```

Public site: http://localhost:3000 · Author studio (unlisted): http://localhost:3000/studio

## Environment

| Variable | Meaning | Default |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://blog:blog@localhost:5433/blog` |
| `DATABASE_URL_TEST` | Separate DB used by unit tests hitting the database | — |
| `AUTHOR_DEFAULT_NAME` | Pre-filled author name in the form | `Author` |
| `STUDIO_BASE_PATH` | Studio base path; a rewrite in `next.config.ts` maps any alias to the internal `/studio` routes | `/studio` |

For deployment, set `STUDIO_BASE_PATH` to something unguessable — the app code doesn't
change, only the URL.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run test` | Vitest unit suite |
| `npm run test:e2e` | Playwright (starts the dev server, seeds the DB per spec file) |
| `npm run db:generate` / `db:migrate` / `db:push` | Drizzle migrations (generate / apply / dev push) |
| `npm run db:seed` | Deterministic sample data |

The three gates (lint, typecheck, test) must be green on any finished change — see
[decisions.md](decisions.md) W2/W3.

## How the tests are arranged

- **Unit (Vitest, `src/tests/`)** — validation rules, slug generation, visibility and
  keyset-cursor queries (against a real test database), markdown round-trip
  (`parse(serialize(doc)) ≡ doc`), sanitization, DB-client import safety.
- **End-to-end (Playwright, `tests/e2e/`)** — one spec file per capability:
  `home`, `post-page`, `create-post`, `edit-post`, `scheduled-post`, `delete-post`,
  `unlisted`. Files run serially; each re-seeds the database first.
  The scheduling scenario really waits for the post's moment (now + ~1 minute) rather
  than faking time.

## Verifying the product by hand

A quick walk-through that exercises everything (with seeded data):

1. **Create & publish** — `/studio/posts/new`: title + a few formatted paragraphs,
   toggle to markdown (same content, markdown syntax), publish, save. Expect: redirect
   to the studio list; the post on the home page within 2 s.
2. **Validation** — save with an empty title → "Title is required" under the field,
   nothing stored. Enter a nonsense publish date → field error.
3. **Drafts hidden** — save with "Published" off → absent from home, listed in the studio.
4. **Scheduled** — publish with time = now + 2 minutes → absent from home, its URL 404s;
   after ~1 minute it appears by itself.
5. **Read** — click it on home → `/posts/<title-derived-slug>` with headings/bold/lists
   rendered.
6. **Edit visibility** — flip a live post to unpublished → gone on next load; flip back
   → returns.
7. **Load more** — with 12 seeded live posts: 10 on home, "Load more" appends 2, then
   the button is gone.
8. **Delete** — cancel the confirmation → nothing changes; confirm → gone everywhere,
   URL 404s.
9. **Empty state** — fresh database → home shows "No posts yet", no error.
10. **Unlisted studio** — `curl -s localhost:3000 | grep -i studio` finds nothing;
    `curl -sI localhost:3000/studio/posts | grep -i x-robots` shows `noindex`.

## Deploying

```bash
docker compose --profile deploy up -d --build   # builds the Next standalone image, starts db + app
npm run db:migrate                              # against the compose DB
```

Verify against the deployed container the same way as locally — for example the full
end-to-end suite pointed at it (stop the local dev server first so port 3000 is free):

```bash
npx playwright test --config=playwright.deploy.config.ts
```

## Gotchas worth knowing

- The DB client (`src/db/client.ts`) defers pool creation so builds are import-safe —
  a missing `DATABASE_URL` surfaces at first query, not at import.
- Playwright specs share the seeded database, which is why they run one worker at a
  time; keep it that way unless you also give each spec its own schema.
- The dev and deploy setups use the same `db` service and volume — destructive local
  work (drop the volume) also wipes deployment data.
