---

description: "Tasks for Blog Post Management (001-blog-management)"
---

# Tasks: Blog Post Management

**Input**: Design documents from `specs/001-blog-management/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/web-ui.md, quickstart.md

**Tests**: INCLUDED — the project constitution makes TDD NON-NEGOTIABLE (Principle II): for every behavior, the failing test task precedes the implementation task. Gates `lint` / `typecheck` / `test` (Principle III) must be green at each checkpoint.

**Organization**: Tasks grouped by user story (US1–US5 from spec.md). Each story is independently implementable and testable after the Foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 home browsing · US2 create · US3 edit · US4 scheduling · US5 delete
- Paths are relative to repository root (single Next.js app per plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization per plan.md Technical Context

- [X] T001 Initialize Next.js 16.4 (latest patch — security note research D1) at repository root: `npx create-next-app@latest . --typescript --app --eslint` with TypeScript `strict: true` in tsconfig.json, App Router, `src/` layout (`src/app/layout.tsx`, `src/app/page.tsx` placeholder)
- [X] T002 [P] Configure ESLint with Prettier per user directive: `eslint.config.mjs` extending `eslint-config-next` + `eslint-config-prettier`, prettier formatting rules in `.prettierrc`; add `lint` script (`next lint` or `eslint .`)
- [X] T003 [P] Configure Vitest: `vitest.config.ts` (unit tests in `src/tests/`, Testing Library + jsdom for component tests); add `test` script
- [X] T004 [P] Configure Playwright: `playwright.config.ts` (baseURL http://localhost:3000, `webServer` starts `npm run dev`), specs in `tests/e2e/`; add `test:e2e` script
- [X] T005 [P] Docker topology per research D11: `docker-compose.yml` with `db` service (`postgres:18`, named volume, port 5432) for local dev and `app` service (multi-stage `Dockerfile` building `next build`) under profile `deploy`; dev flow = `docker compose up -d db` + native `npm run dev`
- [X] T006 Configure Drizzle + env: `drizzle.config.ts` (pgres dialect, schema `src/db/schema.ts`, out `src/db/migrations/`), pg-pooled client in `src/db/client.ts` reading `DATABASE_URL`; `.env.example` with `DATABASE_URL`, `AUTHOR_DEFAULT_NAME` (fallback "Author", research D7), `STUDIO_BASE_PATH` (default `/studio`)
- [X] T007 Add repeatable gate/db scripts to package.json (constitution Principle III): `lint`, `typecheck` (`tsc --noEmit`), `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:push` (dev), `db:seed`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, shared services, and shared components required by every story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Create Drizzle schema in `src/db/schema.ts` and run initial migration: `posts` table with `id` uuidv7 PK; `slug` varchar(220) NOT NULL UNIQUE; `title` "varchar(200) NOT NULL, trimmed, non-empty"; `description` "varchar(500) NOT NULL, default ''"; `body` "text NOT NULL, default '', canonical markdown"; `author_name` "varchar(100) NOT NULL"; `published` "boolean NOT NULL, default false"; `publish_time` "timestamptz NOT NULL, default now() at creation when publishing without a chosen time"; `created_at`/`updated_at` timestamptz; indexes `idx_posts_visible (published, publish_time DESC)` and `uq_posts_slug`
- [X] T009 [P] Write FAILING unit tests in `src/tests/slugify.test.ts` for research D9: lowercase, ASCII-fold, non-alphanumerics → single `-`, length cap 200, uniqueness suffix `-2`/`-3` on collision, regeneration from new title
- [X] T010 Implement slug generation in `src/lib/slugify.ts` to make T009 pass
- [X] T011 [P] Write FAILING unit tests in `src/tests/post-schema.test.ts` for data-model rules quoted verbatim: `title`: required, trimmed length 1–200 → error "Title is required" / "Title must be 200 characters or fewer"; `description`: ≤ 500 chars; `body`: ≤ 100,000 chars, empty allowed; `authorName`: required, 1–100 chars; `publishTime`: parseable ISO instant, year 1970–2100 → malformed/nonsensical rejected with field error
- [X] T012 Implement shared Zod schemas + field-error mapping in `src/lib/validation/post-schema.ts` to make T011 pass
- [X] T013 [P] Write FAILING unit tests in `src/tests/posts-queries.test.ts` (against a test database from compose) for data-model Query contracts: first batch predicate "published = true AND publish_time <= now()" `ORDER BY publish_time DESC, id DESC LIMIT 10`; keyset cursor "(publish_time, id) < (cursor.publish_time, cursor.id) LIMIT 10"; slug fetch returns row only if visible (else none); studio list returns ALL posts any state, "newest updated_at first"
- [X] T014 Implement service queries in `src/lib/posts/queries.ts` (`listFirstBatch`, `loadMoreBatch`, `getVisibleBySlug`, `listAllForStudio`) to make T013 pass, plus the test-DB harness in `src/tests/db-harness.ts`
- [X] T015 [P] FIRST write FAILING component tests in `src/tests/markdown-body.test.ts`: script tags and raw HTML in post bodies are sanitized away ("no raw HTML/script execution" per contracts cross-cutting guarantees); headings/bold/italic/links/lists render correctly. THEN implement `src/components/markdown/MarkdownBody.tsx` (react-markdown + remark-gfm + rehype-sanitize) until the tests pass
- [X] T016 Seed script `scripts/seed.ts` (`npm run db:seed`): ≥12 published posts (fast-load-more validation), 1 unpublished, 1 future-scheduled — used by US1/US4 E2E and quickstart scenarios
- [X] T017 FIRST write FAILING E2E `tests/e2e/unlisted.spec.ts` for FR-008: home page HTML contains no reference to the studio path; every `/studio/*` response carries `X-Robots-Tag: noindex` (quickstart scenario 10). THEN implement `src/middleware.ts` — rewrite configured `STUDIO_BASE_PATH` → `/studio` route group, add `X-Robots-Tag: noindex` to all `/studio` responses — until the spec passes (contracts Cross-cutting)
- [X] T018 Studio scaffold: `src/app/(studio)/layout.tsx` shell (not linked from any public page, FR-008) and `robots.txt` handling that omits `/studio`

**Checkpoint**: DB, validation, queries, renderer, seed, and studio routing exist — user stories can begin (US1 and US2 may proceed in parallel)

---

## Phase 3: User Story 1 - Browse published posts on the home page (Priority: P1) 🎯 MVP half 1

**Goal**: Public home page lists only visible posts, newest first, with load-more batches, and a dedicated public post page

**Independent Test**: `npm run db:seed` then load `http://localhost:3000` — only published-and-past posts listed newest-first; scheduled/unpublished absent; load more appends then disappears (spec US1 Independent Test; quickstart scenarios 4-partial, 5, 7, 9)

### Tests for User Story 1 ⚠️ (write FIRST, verify they fail)

- [X] T019 [P] [US1] Failing E2E `tests/e2e/home.spec.ts` for acceptance scenarios: two+ published posts listed newest-first; unpublished absent; future-scheduled absent; each entry shows "title, description, author name, and publication date"; zero posts → friendly empty state; 12+ seeded posts → first batch 10, "load more" appends remaining, control disappears when exhausted (FR-001…007); assert SC-001 timing — initial batch visible within 2 s of navigation and each "load more" batch within 2 s of the click (Playwright `expect.poll` with 2000 ms budget, dev-profile numbers, not CI-critical)
- [X] T020 [P] [US1] Failing E2E `tests/e2e/post-page.spec.ts`: clicking a home entry opens `/posts/{slug}` with full body formatting preserved (FR-005, FR-017); direct GET of an unpublished or not-yet-visible post's slug → 404 (SC-004)

### Implementation for User Story 1

- [X] T021 [P] [US1] List components in `src/components/post-list/PostList.tsx`, `PostListItem.tsx` (title link → `/posts/{slug}`, description, author name, publish date), `EmptyState.tsx` (FR-004, FR-007)
- [X] T022 [US1] Home page `src/app/page.tsx`: dynamic rendering (no cache > 60 s — research D1), first batch via `listFirstBatch` (T014), renders T021 components (FR-001, FR-002, FR-003)
- [X] T023 [US1] Server Action `loadMorePosts` in `src/lib/actions/loadMorePosts.ts` per contract: input `cursor = { publishTime: ISO-8601 string, id: uuid }`, output `{ posts: PostListItem[], hasMore: boolean }`, ≤10 items strictly older, invalid cursor → "empty result + hasMore: false (fail closed)"
- [X] T024 [US1] Load-more control in `src/components/post-list/LoadMoreButton.tsx`: client component calling T023, appends batches newest-first order preserved, hidden when `hasMore` false (FR-006, Edge Case "All posts already loaded")
- [X] T025 [US1] Public post page `src/app/posts/[slug]/page.tsx`: fetch via `getVisibleBySlug`; render title, author name, publish date, `MarkdownBody` (T015); not-found → 404 for missing OR non-visible posts (FR-005, FR-017, SC-004)
- [X] T026 [US1] Run `tests/e2e/home.spec.ts` + `tests/e2e/post-page.spec.ts` green, then `npm run lint && npm run typecheck && npm run test`

**Checkpoint**: Public blog is fully browsable (with seeded content) — US1 functional independently

---

## Phase 4: User Story 2 - Create a blog post (Priority: P1) 🎯 MVP half 2

**Goal**: Author creates a post at the unlisted `/studio` area with WYSIWYG ⇄ raw markdown body editing

**Independent Test**: Open `/studio/posts/new`, create published + unpublished posts, verify home inclusion/exclusion and validation errors — spec US2 Independent Test; quickstart scenarios 1, 2-partial, 3

### Tests for User Story 2 ⚠️ (write FIRST, verify they fail)

- [X] T027 [P] [US2] Failing unit tests `src/tests/markdown-roundtrip.test.ts` for the contract guarantee "parse(serialize(doc)) ≡ doc" over "headings h1–h3, bold, italic, links, ordered/unordered lists, paragraphs" (FR-015, FR-016, FR-018, SC-005)
- [X] T028 [P] [US2] Failing E2E `tests/e2e/create-post.spec.ts`: valid post appears on home within 2 s of save (SC-001, SC-002); empty title → inline "Title is required", nothing persisted (FR-010, SC-006); save unpublished → stored but absent from home (US2-5); markdown-mode typing renders as formatting on public page (US2-3)

### Implementation for User Story 2

- [X] T029 [US2] Editor serialization helper `src/lib/editor/serialization.ts`: Tiptap + `tiptap-markdown` config limited to the FR-015 node set; make T027 pass (research D3)
- [X] T030 [US2] Dual-mode editor `src/components/post-editor/PostEditor.tsx`: WYSIWYG ⇄ raw-markdown toggle over one body value — toggle shows serialized/parse-converted content, "edits in either mode MUST be reflected in the other" (FR-016, FR-018)
- [X] T031 [US2] Form component `src/components/post-editor/PostForm.tsx`: fields title/description/authorName (default `AUTHOR_DEFAULT_NAME`) /published toggle/body (T030); inline field errors from server (FR-009, FR-010, SC-006)
- [X] T032 [US2] Server Action `savePost` (CREATE path only) in `src/lib/actions/savePost.ts`: Zod-validate via T012 (failure → `{ ok: false, fieldErrors }`, nothing persisted), slug via T010, success → `{ ok: true, id, slug }` (contracts)
- [X] T033 [US2] Create page `src/app/(studio)/studio/posts/new/page.tsx` wiring PostForm → `savePost`, redirect to `/studio/posts` placeholder on success (FR-008 unlisted, FR-011 persistence)
- [X] T034 [US2] Run `tests/e2e/create-post.spec.ts` and `src/tests/markdown-roundtrip.test.ts` green, then all gates (lint/typecheck/test)

**Checkpoint**: MVP COMPLETE — content can be authored and browsed end-to-end (US1 + US2)

---

## Phase 5: User Story 3 - Edit an existing blog post (Priority: P2)

**Goal**: Author edits any post's fields; changes reflect immediately on public pages

**Independent Test**: Create a post, edit title/body/published flag, verify home + post page reflect changes on next load (quickstart scenario 6)

### Tests for User Story 3 ⚠️

- [ ] T035 [P] [US3] Failing E2E `tests/e2e/edit-post.spec.ts`: title/body change reflected on post page and home entry; published→unpublished hides from home on next load (US3-2); unpublished→published appears (US3-3); title change regenerates slug and old slug 404s (research D9) (FR-012, SC-007)

### Implementation for User Story 3

- [ ] T036 [US3] Studio post list `src/app/(studio)/studio/posts/page.tsx`: ALL posts any state via `listAllForStudio` ("newest updated_at first"), Edit links per row (FR-014 list context)
- [ ] T037 [US3] Edit page `src/app/(studio)/studio/posts/[id]/page.tsx`: loads post by id, prefills PostForm (id-keyed management URL per research D9; last-save-wins — no conflict UI)
- [ ] T038 [US3] Extend `savePost` in `src/lib/actions/savePost.ts` with UPDATE path: same Zod validation, slug regenerated from title with `-N` uniqueness suffix, bump `updated_at` (FR-012)
- [ ] T039 [US3] Run `tests/e2e/edit-post.spec.ts` green, then all gates

**Checkpoint**: US1+US2+US3 all functional independently

---

## Phase 6: User Story 4 - Schedule a post for future publication (Priority: P2)

**Goal**: Future publish times hide posts until the instant, then they appear automatically

**Independent Test**: Create post with publish time now+2min → absent from home and 404 by direct slug; after ≤1 min past instant it appears with no author action (quickstart scenario 4)

### Tests for User Story 4 ⚠️

- [ ] T040 [P] [US4] Failing E2E `tests/e2e/scheduled-post.spec.ts`: scheduled post absent from home AND direct `/posts/{slug}` → 404 before instant; auto-appears within 1 minute after (SC-003, SC-004); pushing publish time later re-hides until new instant (US4-3, Edge Case "past to future"); malformed date input → field error, save rejected (US4-4)
- [ ] T041 [P] [US4] Failing unit tests `src/tests/publish-datetime.test.ts`: datetime-local interpretation "browser local zone → ISO 8601 instant (UTC)" submitted (research D8); "parseable ISO instant, year 1970–2100" rule; `published=true` with no chosen time → `publish_time = now()`; unpublished+scheduled stays hidden (Edge Case "Scheduling while unpublished")

### Implementation for User Story 4

- [ ] T042 [US4] Publish controls `src/components/post-editor/PublishControls.tsx`: `<input type="datetime-local">` in author local time, submitted as ISO UTC instant, "Publish now" convenience (FR-019); integrate into PostForm
- [ ] T043 [US4] Publish semantics in `src/lib/actions/savePost.ts`: no time + published → `publish_time = now()` (visible immediately, FR-021); future instant → scheduled, hidden until then (FR-019/020); past/present → immediate
- [ ] T044 [US4] Run `tests/e2e/scheduled-post.spec.ts` and `src/tests/publish-datetime.test.ts` green, then all gates

**Checkpoint**: Scheduled publishing verified against live clock; visibility remains purely query-time (no cron)

---

## Phase 7: User Story 5 - Delete a blog post (Priority: P3)

**Goal**: Permanent delete from the studio behind an explicit confirmation

**Independent Test**: Delete flow: cancel → post unchanged; confirm → gone from home and studio list (quickstart scenario 8)

### Tests for User Story 5 ⚠️

- [ ] T045 [P] [US5] Failing E2E `tests/e2e/delete-post.spec.ts`: choose delete then cancel confirmation → post unchanged (US5-2); confirm → permanently removed from home and studio list, direct slug 404 (US5-1, FR-013/014, SC-007)

### Implementation for User Story 5

- [ ] T046 [US5] Server Action `deletePost(id)` in `src/lib/actions/deletePost.ts`: deletes row permanently; revalidate home/studio (FR-014)
- [ ] T047 [US5] Confirmation dialog `src/components/post-list/ConfirmDelete.tsx` wired into studio list rows (T036): "UI must confirm before invoking; cancel → no action" (FR-013)
- [ ] T048 [US5] Run `tests/e2e/delete-post.spec.ts` green, then all gates

**Checkpoint**: All five user stories independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T049 [P] Re-run `tests/e2e/unlisted.spec.ts` (created in T017) green after all stories — regression check that no later story linked `/studio` from public pages (FR-008, quickstart scenario 10)
- [ ] T050 [P] Accessibility/UX pass in `src/components/post-editor/PostForm.tsx`, `PostEditor.tsx`, `PublishControls.tsx`, `src/components/post-list/LoadMoreButton.tsx`, `src/app/page.tsx`: form labels + inline error association, keyboard use of editor toggle and load-more, date field errors announced (supports SC-006 unaided-error-resolution target)
- [ ] T051 Full constitution gate run (Principle III) using the package.json scripts from T007: `npm run lint && npm run typecheck && npm run test && npm run test:e2e` — all green, fix any failure (never bypass)
- [ ] T052 Run `quickstart.md` validation scenarios 1–10 end-to-end against the dev topology (`docker compose up -d db` + native `npm run dev`), record results
- [ ] T053 Deploy-profile validation: `docker compose --profile deploy up -d --build` then re-verify quickstart scenarios 1, 4, 5 against the container (research D11)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: after Setup — BLOCKS all stories (T008 schema first; T010/T012/T014 services after their failing tests)
- **US1 (Phase 3)** and **US2 (Phase 4)**: both P1, both only depend on Foundational → can run in parallel (T021–T025 files are disjoint from T029–T033 except T015/T014 reuse)
- **US3 (Phase 5)**: after US2 (needs a created post and PostForm/savePost to extend)
- **US4 (Phase 6)**: after US2+US3 (extends savePost and PostForm)
- **US5 (Phase 7)**: after US3 (deletes from the studio list built in T036)
- **Polish (Phase 8)**: after all desired stories

### Within Each User Story (TDD — constitution Principle II)

Failing tests (T0xx) → implementation → re-run tests green → gates. Never weaken/delete a test to pass a gate.

### Parallel Opportunities

- T002/T003/T004/T005 (Setup config) in parallel after T001
- T009, T011, T013, T015 (Foundational test/component tasks) in parallel after T008
- After Foundational: entire US1 track (T019–T026) ∥ US2 track (T027–T034)
- Within stories: each story's [P] test tasks run together
- T049/T050 in Polish in parallel

---

## Parallel Example: MVP (both P1 stories at once)

```bash
# Track A — US1 (public side):
Task: "List components in src/components/post-list/* (T021)"
Task: "Server Action loadMorePosts in src/lib/actions/loadMorePosts.ts (T023)"
# Track B — US2 (author side):
Task: "Editor serialization in src/lib/editor/serialization.ts (T029)"
Task: "Server Action savePost CREATE in src/lib/actions/savePost.ts (T032)"
# Both tracks touch disjoint files and share only T014 queries + T012 validation from Foundational.
```

---

## Implementation Strategy

### MVP First

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 **US1** + Phase 4 **US2** (both P1 — MVP is these two together) → 4. **STOP & VALIDATE**: quickstart scenarios 1, 3, 5, 7, 9 → 5. Deploy/demo.

### Incremental Delivery

1. MVP (US1+US2) deployed → 2. +US3 edit → validate scenario 6 → 3. +US4 scheduling → validate scenario 4 (SC-003 watch) → 4. +US5 delete → validate scenario 8 → 5. Polish (T049–T053) for release.

---

## Notes

- Every gate run = lint + typecheck + test (constitution III); checkpoint tasks include this.
- Scheduled-post E2E (T040) creates the post at now+~60 s and waits — keep it deterministic with a small offset; do not fake system time.
- Commit after each task or logical group; stop at any checkpoint for independent story validation.
- No auth tasks exist by design (spec Assumption, clarification session 2026-10-14 Q5).
