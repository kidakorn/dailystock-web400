---
name: tech-stack-practices
description: "Use when implementing, debugging, or upgrading this project's Next.js, React, TypeScript, Zod, CSS Modules, or Vitest code; tech stack practices, Next.js patterns, แนวทางเทคโนโลยี."
---

# Tech Stack Practices

Follow the installed versions and project configuration, not remembered framework conventions. Before changing Next.js code, read the relevant guide under `node_modules/next/dist/docs/` as required by the repository's `AGENTS.md`; heed breaking changes and deprecations.

## Project Baseline

- Next.js 16, React 19, TypeScript 6, Zod 4, Vitest 5, Testing Library, CSS Modules.
- App Router routes are under `src/app/`; `(dashboard)` is a route group, not part of the URL.
- `next.config.ts` enables `output: 'export'`, `trailingSlash: true`, and a production `basePath` for IIS deployment. Do not introduce server-only runtime behavior without explicitly changing deployment architecture.
- Data is currently loaded from JSON in `data/`, validated through `src/lib/data/schemas.ts`, and accessed via `src/lib/data/repository.ts`.

## Working Practices

- Prefer Server Components unless a component needs browser APIs, state, or event handlers; keep client boundaries small and intentional.
- Use APIs supported by the installed package versions. Check local types and installed docs rather than guessing signatures.
- Keep domain calculations in `src/lib/summary/` or other pure library modules; keep rendering in components. Infer domain types from Zod schemas where established.
- Use CSS Modules and shared global tokens. Avoid introducing styling dependencies without a clear need.
- Add focused Vitest tests beside the changed behavior; use Testing Library for user-visible interactions.
- Before changing routes, data loading, or export assumptions, inspect `next.config.ts` and applicable Next documentation.

## Validation

Run the narrowest relevant test first, then `npm test`, `npm run typecheck`, and `npm run lint` as appropriate. `npm run build` is a useful deployment check for changes affecting routes, static rendering, or exported assets. Do not claim an API endpoint exists unless it is implemented and supported by the static deployment target.
