# Next Blog

A personal blog: a public home page of published posts (newest first, loading in
batches), public post pages at title-derived URLs, and an unlisted studio for writing
posts with a WYSIWYG ⇄ markdown editor and scheduled publishing.

**The documentation in [`docs/`](docs/README.md) is the source of truth** — start with:

- [What the product does](docs/product.md)
- [How it's built](docs/architecture.md)
- [Data model & visibility rules](docs/data-model.md)
- [Why it looks like this](docs/decisions.md)
- [Setup, testing, deployment](docs/development.md)
- [What's next](docs/roadmap.md)

## Quick start

```bash
cp .env.example .env
docker compose up -d db     # postgres:18
npm install
npm run db:migrate && npm run db:seed
npm run dev                 # http://localhost:3000 · studio: /studio (unlisted)
```

Quality gates: `npm run lint && npm run typecheck && npm run test` (+ `npm run test:e2e`
for user-facing changes).

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript strict · PostgreSQL 18 via Drizzle
ORM · Tiptap + tiptap-markdown editor · react-markdown + rehype-sanitize · Vitest +
Playwright · Docker Compose.

> `specs/` is the planning archive from this project's spec-driven workflow — keep
> `docs/` current; where they disagree, `docs/` wins.
