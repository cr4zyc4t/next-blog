# Roadmap

Deliberately excluded from the current phase, roughly ordered by what the next version
should tackle. Each item should get its own spec/decision entry before it is built.

## 1. Author authentication (the big one)

The current unlisted-URL protection is an accepted stopgap
([decisions.md](decisions.md) D1). Next: email + password accounts, session cookies,
and studio routes guarded by real sign-in — then keep `STUDIO_BASE_PATH` obscurity as a
bonus layer, not the control. This unblocks:

## 2. Multiple authors and roles

A real authors table (replacing the `author_name` string), per-post attribution, and
roles (author/editor). Also when-out: concurrent editing of one post is currently
last-save-wins; revisit with auth since real accounts make collisions possible.

## 3. URL redirects for renamed posts

Renaming a post regenerates its slug and the old URL 404s. A redirect table
(old slug → post id) would keep shared links alive and is the natural companion to
any future SEO work.

## 4. Content extras

Once core management feels solid: image upload/embedding in the editor, tags or
categories (with public archive pages), post previews, and search.

## 5. Safety nets

- Soft delete / trash with restore, so the "permanent delete" assumption
  ([product.md](product.md) capability 6) can be relaxed.
- Scheduled-post previews for the author (see how a post will look before it goes live).

## Deferred performance tiers (only if ever needed)

At personal-blog scale (~hundreds of posts) there is nothing to optimize yet. If load
grows: ISR/CDN caching with ≤ 60 s revalidation ([decisions.md](decisions.md) D10
relaxes), and an index-only keyset covering query. Neither is built until measured.
