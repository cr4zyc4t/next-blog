# Phase 1 Data Model: Blog Post Management

**Feature**: `specs/001-blog-management/spec.md` | **Date**: 2026-10-14

## Entity: Post (table `posts`)

One table serves the whole phase (Key Entities: Blog Post; Author is a name string, not a table — research D7).

| Column | Type | Constraints | Maps to |
|--------|------|-------------|---------|
| `id` | `uuid` (uuidv7) | PK, server-generated | internal addressing; management routes (D9) |
| `slug` | `varchar(220)` | NOT NULL, UNIQUE, generated from title (slugify; `-2`/`-3` suffix on collision; regenerated on title change) | public URL `/posts/{slug}` — FR-005, D9 |
| `title` | `varchar(200)` | NOT NULL, trimmed, non-empty | FR-009, FR-010, D10 |
| `description` | `varchar(500)` | NOT NULL, default `''` | FR-004, D10 |
| `body` | `text` | NOT NULL, default `''`, canonical **markdown** | FR-015/016/017/018 (D3) |
| `author_name` | `varchar(100)` | NOT NULL (form default = env `AUTHOR_DEFAULT_NAME`) | FR-009, D7 |
| `published` | `boolean` | NOT NULL, default `false` | FR-002, spec publish-state model |
| `publish_time` | `timestamptz` | NOT NULL, default `now()` at creation when publishing without a chosen time | FR-019/021, D8 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | audit |
| `updated_at` | `timestamptz` | NOT NULL, auto-updated | FR-012 ("changes reflected") |

**Indexes**: `idx_posts_visible (published, publish_time DESC)` — supports the visibility query and keyset batches (D4/D5); `uq_posts_slug (slug)` UNIQUE — public lookups (D9).

No foreign keys (single table). No `any`/loose types: Drizzle infers row types; Zod schemas are the validation source of truth shared by form and Server Actions.

## Validation rules (Zod, enforced server-side; mirrored in form)

- `title`: required, trimmed length 1–200 → error "Title is required" / "Title must be 200 characters or fewer" (FR-010, SC-006).
- `description`: ≤ 500 chars.
- `body`: ≤ 100,000 chars; empty allowed (draft-friendly, Edge Case "Body left empty").
- `authorName`: required, 1–100 chars.
- `publishTime`: parseable ISO instant, year 1970–2100 → malformed/nonsensical rejected with field error (FR-022).
- Any rule violation → mutation aborts, per-field messages returned to the form; nothing persists (FR-010).

## Visibility state model

There is **no stored "visible" state**. Derived at query time (research D4):

```
visible(post) ≡ published = true AND publish_time <= now()
```

Transitions (all via edit/save; no background job):

| From | Action | To (public effect) | FR |
|------|--------|--------------------|----|
| draft (`published=false`) | save with `published=true`, no time set | visible immediately (`publish_time = now()`) | FR-021 |
| draft | save with `published=true`, future time | hidden until instant, then auto-visible | FR-019/020 |
| draft | save with `published=true`, past time | visible immediately | FR-021 |
| visible | set `published=false` | hidden at once | FR-012 / US3-2 |
| visible | set future `publish_time` | hidden until new instant | Edge Case "past to future" |
| scheduled (`published=true`, future) | push `publish_time` later | new instant controls | US4-3 |
| scheduled but `published=false` | — | hidden (both conditions required) | Edge Case "Scheduling while unpublished" |
| any | confirmed delete | row removed permanently | FR-013/014 |

## Query contracts (service layer)

1. **List first batch** (home): `WHERE published AND publish_time <= now() ORDER BY publish_time DESC, id DESC LIMIT 10`.
2. **Load-more batch**: same predicate `AND (publish_time, id) < (cursor.publish_time, cursor.id)` `LIMIT 10` (keyset — D5).
3. **Post page fetch**: `WHERE slug = :slug AND published AND publish_time <= now()` → not-found (404) otherwise, keeping scheduled posts unreachable by direct link (SC-004 covers pages too).
4. **Studio list**: ALL posts (any state), newest-updated first, for management (FR-014 removal from this list).
5. **Create / update / delete**: via Server Actions with Zod validation above; update is last-save-wins (spec Concurrency Assumption).

## Relationships

- Post → Author: by name string only (`author_name`); no join.
- No other entities this phase (comments/tags/users explicitly out of spec scope).
