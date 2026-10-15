# Implementation Plan: Blog Post Management

**Branch**: `001-blog-management` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-blog-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

A single-user blog application: a public home page listing published posts (newest-first, "load more" batches), a dedicated public post page rendering the formatted body, and an unlisted management area to create/edit/delete posts. The body is stored canonically as **markdown** and edited through a bidirectional WYSIWYG ⇄ raw-markdown editor. Posts can be scheduled: a post is publicly visible only when `published = true` AND `publish_time <= now()`. Stack (user-directed): Next.js 16 (App Router, TypeScript strict), PostgreSQL 18 accessed via Drizzle ORM, deployment via Docker Compose; in local development Postgres runs in Docker while the Next.js dev server runs natively under Node. ESLint is configured with Prettier. Development follows TDD with three mechanical gates: lint, typecheck, unit tests.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 24 LTS (Next.js 16 requires Node ≥ 20.19; 24 is the active LTS)

**Primary Dependencies**: Next.js 16.4 (App Router, Server Components + Server Actions), drizzle-orm 0.45.x + drizzle-kit (migrations), `pg` (node-postgres driver), Tiptap + `tiptap-markdown` (bidirectional WYSIWYG ⇄ markdown editor), react-markdown + remark-gfm + rehype-sanitize (public rendering, XSS-safe), Zod (validation), Vitest + Testing Library (unit), Playwright (E2E acceptance), ESLint (`eslint-config-next`) + Prettier (`eslint-config-prettier`)

**Storage**: PostgreSQL 18 (Docker image `postgres:18`); single table `posts`

**Testing**: Vitest (unit — TDD gate), Playwright (E2E for acceptance scenarios), plus ESLint and `tsc --noEmit` gates

**Target Platform**: Linux server via Docker Compose (`db` + `app` services); local dev = native `next dev` on Node + Postgres from `docker compose up -d db`

**Project Type**: Web application (single Next.js app, server-rendered; no separate frontend/backend)

**Performance Goals**: Home page initial batch and each "load more" batch visible < 2 s (SC-001); scheduled post visible within 1 minute of publish time (SC-003)

**Constraints**: Post list must not be statically cached past visibility changes (dynamic render or revalidate ≤ 60 s); no auth this phase (unlisted management URL is the accepted control); single Postgres container is both dev and deploy datastore

**Scale/Scope**: Personal-scale blog (~10² posts, ~10¹ concurrent readers); 7 public/management routes, 1 DB table, ~2–3k LOC

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                                    | Status           | How satisfied                                                                                                                                                    |
| ------------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Spec-Driven Development                                   | PASS             | Spec approved with 5 clarifications; this plan and all tasks trace to FR-001…FR-022                                                                              |
| II. Test-First (TDD) — NON-NEGOTIABLE                        | PASS (committed) | Vitest unit tests written first per task; Playwright covers the 5 user stories' acceptance scenarios; Red-Green-Refactor recorded per task                       |
| III. Quality Gates — lint, typecheck, tests — NON-NEGOTIABLE | PASS (committed) | Exposed as repeatable npm scripts: `npm run lint`, `npm run typecheck`, `npm run test`; run green at feature completion                                          |
| IV. Static Typing Discipline                                 | PASS             | `typescript` strict mode; Drizzle gives end-to-end row types; no `any` without documented suppression                                                            |
| V. Simplicity / YAGNI                                        | PASS             | One table, one app, no auth, no Redis/CDN/ISR tiers, no slug machinery; every dependency maps to a spec FR (editor → FR-015/016/018; markdown renderer → FR-017) |
| Additional Constraints (Next.js, ESLint, gate scripts)       | PASS             | Next.js 16 App Router as named in constitution; ESLint + Prettier per user directive; gate scripts as above                                                      |

**Gate evaluation**: No violations → Complexity Tracking unused. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-blog-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── web-ui.md        # Route + Server Action contract for public & management UI
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

Single Next.js 16 application at the repository root (App Router). No separate frontend/backend — data access, rendering, and mutations (Server Actions) live in one typed codebase.

```text
/
├── docker-compose.yml           # dev+deploy: postgres:18 (+ app service for deploy profile)
├── Dockerfile                   # production Next.js build for the app service
├── drizzle.config.ts            # schema + migration config
├── package.json                 # dev/lint/typecheck/test/db scripts (quality gates)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # home: published-only list, load-more (FR-001…007)
│   │   ├── posts/[slug]/page.tsx        # public post page (FR-005, FR-017)
│   │   └── (studio)/                    # unlisted management area, noindex, not linked (FR-008)
│   │       ├── studio/posts/page.tsx            # author's post list + delete (FR-013/014)
│   │       └── studio/posts/[id]/page.tsx       # create/edit form (FR-009…012)
│   ├── components/
│   │   ├── post-list/                   # list item, load-more control (FR-004/006)
│   │   ├── post-editor/                 # Tiptap + markdown toggle (FR-015/016/018)
│   │   └── markdown/                    # sanitized renderer for public pages (FR-017)
│   ├── db/
│   │   ├── schema.ts                    # posts table (Drizzle)
│   │   ├── client.ts                    # pg + drizzle client
│   │   └── migrations/                  # drizzle-kit generated SQL migrations
│   ├── lib/
│   │   ├── posts/                       # service: list (visibility filter, batching), CRUD
│   │   ├── actions/posts.ts             # Server Actions: create/update/delete (validation via Zod)
│   │   └── validation/                  # Zod schemas shared by actions + forms
│   └── tests/                           # Vitest unit tests (co-located mirrors of lib/db/actions)
├── tests/e2e/                           # Playwright scenarios mapped to acceptance scenarios
└── specs/                               # as above
```

**Structure Decision**: Single web application (Option "single project" specialized for Next.js). The spec's "author area" and "public pages" are route groups within one App Router app, not separate deployables — there is no auth boundary and one datastore, so splitting would violate YAGNI (Principle V). The `(studio)` route group lives under a single non-linked base path; its exact prefix is env-configurable (see research.md D6).

## Complexity Tracking

> No constitution violations — table intentionally unused.

## Post-Design Re-check (after Phase 1)

Constitution Check re-run against `research.md`, `data-model.md`, `contracts/web-ui.md`, `quickstart.md`:

- V (YAGNI): one table, no extra services, editor/renderer libraries are the minimum to satisfy FR-015/016/017/018 — PASS.
- II/III (TDD & gates): quickstart lists the gate commands and E2E scenarios per user story; every FR traces to a contract/validation rule in data-model.md — PASS.
- IV (typing): Zod schemas + Drizzle inferred row types give typed end-to-end flow — PASS.
- Gates remain passable with no exceptions; no Complexity Tracking entries.

**Status: PASS — plan ready for `/speckit.tasks`.**
