# Data model

One table serves the whole product. Authors are just names on posts for now — there are
no user accounts, so no author table exists.

## Table `posts`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid (uuidv7) | Primary key, server-generated. The studio addresses posts by this id. |
| `slug` | varchar(220) | Unique, generated from the title. The public URL is `/posts/{slug}`. |
| `title` | varchar(200) | Required, trimmed, non-empty. |
| `description` | varchar(500) | Not null, defaults to empty string. |
| `body` | text | Not null, defaults to empty string. **Canonical markdown.** Empty is allowed (drafts in progress). |
| `author_name` | varchar(100) | Not null. Pre-filled from env `AUTHOR_DEFAULT_NAME`, editable per post. |
| `published` | boolean | Not null, default false. |
| `publish_time` | timestamptz | Not null. The moment the post is (or will be) public. Default: now, when publishing without a chosen time. |
| `created_at` | timestamptz | Not null, default now. |
| `updated_at` | timestamptz | Not null, refreshed on every save. Studio list sorts by this. |

Indexes: `(published, publish_time DESC)` for the visibility query and keyset batches;
unique on `slug` for public lookups.

## Validation (enforced on the server, mirrored in the form)

| Field | Rule | User-visible error |
|---|---|---|
| title | required, trimmed, 1–200 chars | "Title is required" / "Title must be 200 characters or fewer" |
| description | ≤ 500 chars | per-field message |
| body | ≤ 100,000 chars; empty allowed | per-field message |
| author name | required, 1–100 chars | per-field message |
| publish time | parseable instant, year 1970–2100 | per-field message for malformed dates |

Any violation aborts the whole save; the form shows the message next to the field and
nothing is persisted.

## Visibility — a rule, not a column

There is no "visible" flag. A post is public exactly when:

```
published = true  AND  publish_time <= now()
```

Evaluated per request against the database clock. Consequences:

- Scheduled posts appear the moment their time passes, automatically.
- Direct URLs obey the same rule: an invisible post 404s on `/posts/{slug}`.
- Setting a live post's publish time to the future un-publishes it until then.
- A future publish time on an unpublished post does nothing on its own — both
  conditions are required.

State transitions are all ordinary saves:

| Situation | Effect on the public site |
|---|---|
| draft → published, no time chosen | visible immediately (`publish_time = now()`) |
| draft → published, future time | hidden until that instant, then automatic |
| draft → published, past time | visible immediately |
| visible → unpublished | hidden at once |
| visible → future publish time | hidden until the new instant |
| scheduled → later time | the new instant controls |
| any → confirmed delete | row removed permanently |

## Slug rules

- Generated from the title: lowercased, ASCII-folded, non-alphanumerics collapsed to `-`,
  capped at 200 chars.
- Regenerated whenever the title changes (old URLs then 404 — no redirect table yet).
- On collision with an existing slug, a numeric suffix is appended (`-2`, `-3`, …).
- Slugs are never the storage identity: the studio always works with `id`, so slug churn
  can't break editing.
