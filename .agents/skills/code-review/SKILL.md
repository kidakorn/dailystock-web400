---
name: code-review
description: "Use when reviewing code or pull requests for correctness, regressions, maintainability, accessibility, and missing tests; code review, review PR, ตรวจโค้ด, รีวิวโค้ด."
---

# Code Review

Review changes as a skeptical maintainer. Prioritize defects and risks over style preferences.

## Workflow

1. Read the changed code and its callers, nearby tests, and applicable `AGENTS.md` guidance.
2. Trace changed behavior through data parsing, state, rendering, and export where relevant.
3. Check boundary cases, failure paths, accessibility, and backward compatibility.
4. Run the narrowest useful check, then relevant repository checks: `npm test -- --run`, `npm run typecheck`, and `npm run lint`.
5. Report only actionable findings, ordered by severity. Include file and line, impact, triggering conditions, and a concise fix direction. If no findings, say so and state material test gaps.

## Repository Checks

- Runtime data schemas are in `src/lib/data/schemas.ts`; data loading lives in `src/lib/data/repository.ts`.
- Summaries are pure domain logic under `src/lib/summary/`; preserve and extend nearby tests.
- URL parsing and filtering are handled by `src/lib/params.ts`, `src/lib/query.ts`, and related hooks.
- CSV generation is in `src/lib/csv.ts`; inspect spreadsheet formula injection and escaping when it changes.
- The project uses Vitest and Testing Library. Use existing test style and helpers; do not add a new framework for a narrow change.
- This app is statically exported under a production base path. Check links and assets with that deployment shape in mind.

## Finding Bar

A finding must identify a real bug, security issue, user-visible regression, or important missing test. Do not report speculative concerns without a concrete path to impact. Avoid summaries before findings and avoid rewriting the patch in review comments.
