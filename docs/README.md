# Next Blog — Documentation

This folder is the **source of truth** for what this project is, how it works, and why it
is built the way it is. It is written for humans, not tooling, and is kept up to date by
whoever changes the code: **if a change alters behavior, architecture, data, or a
decision, update these docs in the same commit.**

The `specs/` folder elsewhere in the repo is a working history of how features were
planned (a spec-driven workflow). It is an archive — read `docs/` for the current,
authoritative picture. Where the two disagree, `docs/` wins.

## What's here

| Document | Read it to understand |
|---|---|
| [product.md](product.md) | What the blog does, for whom, and what "done" means per capability |
| [architecture.md](architecture.md) | The stack, how the pieces fit together, routes, and guarantees |
| [data-model.md](data-model.md) | The `posts` table, validation rules, and visibility rules |
| [decisions.md](decisions.md) | Why the system looks the way it does (decision log) |
| [development.md](development.md) | Setting up, running, testing, and deploying the app |
| [roadmap.md](roadmap.md) | What was deliberately left out and what comes next |

## Maintenance rules

1. Every behavioral change to the product updates `product.md` (capabilities/acceptance)
   and usually `architecture.md` or `data-model.md`.
2. Reversing or extending an existing choice gets a new entry in `decisions.md` that
   links to the one it supersedes — never silently edit history away.
3. Keep these docs free of ticket IDs, phase numbers, and tooling jargon. A newcomer
   should get the full picture from reading alone.
4. Version stamp: the docs currently describe the system as of **2026-10-15**
   (blog post management: browse, create, edit, schedule, delete).
