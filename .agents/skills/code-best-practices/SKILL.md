---
name: code-best-practices
description: "Use when writing or refactoring code in this repository and choosing module boundaries, naming, types, error handling, tests, or maintainability practices; code best practices, clean code, เขียนโค้ดให้ดูแลง่าย."
---

# Code Best Practices

Make the smallest coherent change that fits the existing architecture. Prefer clear behavior and local consistency over generic abstractions.

## Repository Conventions

- Keep domain transformations and calculations pure where practical, following `src/lib/summary/` and its tests.
- Keep data access behind `src/lib/data/repository.ts`; validate file/API boundaries with schemas in `src/lib/data/schemas.ts`.
- Keep UI components focused. Reuse `src/components/ui/` and colocated CSS Modules before adding new components or global styles.
- Follow existing naming, formatting, import, and test conventions. Avoid one-off dependencies and broad refactors unrelated to the request.
- Use explicit TypeScript types at public boundaries; avoid weakening types with `any` or unchecked casts where validation can establish the shape.
- Handle empty, malformed, and unavailable data deliberately. Preserve actionable errors without leaking secrets or exposing internal details to users.
- Add or update tests for meaningful behavior changes, especially calculations, parsing, filters, and exported output.
- Keep comments rare: explain a non-obvious constraint or invariant that code cannot express; do not narrate obvious statements.

## Completion

Inspect the final diff for scope and accidental changes. Run relevant tests, typecheck, and lint. Report any check that could not run and why.
