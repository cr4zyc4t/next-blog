<!--
Sync Impact Report
==================
Version change: (uninitialized template) → 1.0.0 (initial ratification; prior file was the
unfilled scaffold with no project values, so no values were carried over).

Added sections/principles:
- I. Spec-Driven Development (derived from Spec Kit workflow in use, speckit 1.2.0)
- II. Test-First Development — TDD (NON-NEGOTIABLE) (user-directed)
- III. Quality Gates: Lint, Types, Tests (NON-NEGOTIABLE) (user-directed)
- IV. Static Typing Discipline (derived from typecheck mandate)
- V. Simplicity and YAGNI (template default)
- Additional Constraints (stack/tooling; Next.js inferred from repo name "next-blog" — confirm
  once package.json exists)
- Development Workflow & Quality Gates
- Governance (amendment procedure, versioning policy, compliance review)

Removed sections: none (template placeholders replaced).

Follow-up TODOs: none; stack note above is an inference to confirm, not a placeholder.
-->

# Next Blog Constitution

## Core Principles

### I. Spec-Driven Development

Every feature MUST begin with a written spec produced through the Spec Kit workflow
(spec → plan → tasks) before implementation starts. Implementation MUST trace back to an
approved spec artifact; code without a corresponding spec artifact MUST NOT be merged.

Rationale: specs make intent, scope, and acceptance criteria explicit and reviewable before
any code is written, preventing scope drift and rework.

### II. Test-First Development — TDD (NON-NEGOTIABLE)

Test-Driven Development is mandatory: for each unit of behavior, tests MUST be written
before the implementation that makes them pass. The Red-Green-Refactor cycle MUST be
followed — tests MUST be observed failing for the right reason before implementation begins,
then implementation is written to make them pass, then the code is refactored with the suite
still green. Tests MUST NOT be weakened, skipped, or deleted to make a gate pass.

Rationale: tests written first define behavior as an executable contract and prove that the
tests can actually fail, which tests written retroactively cannot.

### III. Quality Gates — Lint, Types, Tests (NON-NEGOTIABLE)

A feature is NOT complete — and MUST NOT be reported as done — until all of the following
pass with zero errors on the final state of the code:

1. ESLint check (the project's configured lint rules).
2. TypeScript typecheck (full project type checking).
3. Unit tests (the full unit test suite).

These gates MUST be executed and green after completing each feature, and reviewers MUST
confirm green gate results as part of feature acceptance.

Rationale: a uniform, mechanical definition of "done" keeps defects, style divergence, and
type errors from accumulating between features.

### IV. Static Typing Discipline

All application code MUST be written in TypeScript under strict type checking. The `any`
type MUST be avoided except where a narrow, commented justification exists (e.g., an
untyped third-party boundary); each such use MUST be documented with a `// eslint-disable`
or equivalent localized suppression that states the reason. Type errors MUST be fixed by
correcting types, never by suppressing diagnostics.

Rationale: the typecheck gate (Principle III) is only as strong as the types it checks;
unchecked escapes defeat it.

### V. Simplicity and YAGNI

Start simple: implement exactly what the current spec requires. Abstractions, configuration
options, dependencies, and "future-proofing" layers MUST NOT be added without a present,
spec-backed need. Complexity introduced MUST be justified in the plan by the concrete
problem it solves.

Rationale: the smallest working implementation is easier to test (Principle II), to type
(Principle IV), and to change later.

## Additional Constraints

Technology stack constraints for this project:

- Language: TypeScript; linting: ESLint. Both MUST be configured and runnable from the
  repository root (inferred as mandatory from the Principle III gates).
- Framework: Next.js is the target framework for this project (inferred from the repository
  name "next-blog"); update this section if the stack changes.
- The three gate commands (lint, typecheck, test) MUST be exposed as repeatable project
  scripts so that every feature is verified the same way.

## Development Workflow & Quality Gates

The required flow for every feature:

1. Write the spec and get it approved (Principle I).
2. Produce the plan and task breakdown; identify where integration points need extra care.
3. Implement tasks test-first: failing test → implementation → refactor (Principle II).
4. After the feature is complete, run the full gate sequence — ESLint, typecheck, unit
   tests — and fix everything they report (Principle III).
5. Review MUST verify spec traceability, TDD evidence, and green gate results before the
   feature is accepted.

If a gate cannot pass (for example, a flaky test), the failure MUST be investigated and
resolved, not bypassed; disabling or quarantining checks requires explicit, documented
approval in the relevant task record.

## Governance

This constitution supersedes all other development practices for this project; when other
guidance conflicts with it, this document wins.

- Amendments: changes MUST be proposed as a pull request against this file, documenting the
  motivation, the affected principles, and any migration steps. Approval of the change
  (project owner review) constitutes ratification.
- Versioning: the version below follows semantic versioning — MAJOR for removing or
  redefining a principle in a backward-incompatible way, MINOR for adding a principle or
  materially expanding guidance, PATCH for clarifications and non-semantic edits.
- Compliance review: every feature review MUST check compliance with these principles;
  any deviation MUST be justified in writing (in the PR or task record) and approved. The
  Spec Kit constitution templates and commands read this file at runtime as the source of
  governance.

**Version**: 1.0.0 | **Ratified**: 2026-10-14 | **Last Amended**: 2026-10-14
