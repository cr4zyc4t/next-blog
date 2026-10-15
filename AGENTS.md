<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Docs are the source of truth — keep them current

`docs/` is the authoritative, human-readable description of this project (see
`docs/README.md`). Any modification that affects project design, behavior, specs, data,
or decisions MUST update the relevant `docs/` file(s) in the same change — no exceptions,
no "docs later" follow-ups.

Which file to update:

- New/changed user-facing behavior, acceptance criteria, scope → `docs/product.md`
- New/changed architecture, routes, rendering/caching rules, stack → `docs/architecture.md`
- New/changed schema, validation, visibility, or slug rules → `docs/data-model.md`
- Making, reversing, or extending a design choice → append a new entry to
  `docs/decisions.md` (never edit past entries; supersede them instead)
- New/changed commands, env vars, setup, testing, or deploy steps → `docs/development.md`
- Adding/removing planned work → `docs/roadmap.md`

If a change touches something `specs/` describes but no doc covers it, that's a gap in
`docs/` — document it there. Where `specs/` and `docs/` disagree, `docs/` wins; `specs/`
is a planning archive, not instructions.
