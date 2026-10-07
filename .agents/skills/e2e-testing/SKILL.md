---
name: e2e-testing
description: "Use when creating or running browser-based end-to-end tests for dashboard routes, filters, navigation, responsive states, or static deployments; E2E testing, Playwright, ทดสอบ E2E."
---

# E2E Testing

Use Playwright for browser-level workflows when unit tests cannot establish the integration behavior. Playwright is not currently installed in this project; do not assume the example files are active until the dependency and scripts are deliberately added.

## Setup and Workflow

1. Review the repository's `AGENTS.md`, package scripts, route behavior, and hosting mode.
2. If approved for the project, add a compatible `@playwright/test` dev dependency and browser binaries using the official setup; keep the lockfile updated.
3. Adapt `assets/playwright.config.ts` and `assets/dashboard.smoke.spec.ts` into the chosen E2E test directory, and wire an explicit package script.
4. Start with critical user journeys: route loads, primary data visible, URL-backed filters, navigation, table interactions, CSV download, error/empty state, and narrow viewport behavior.
5. Prefer accessible role/name locators and observable outcomes; avoid brittle CSS selectors, fixed sleeps, and implementation details.
6. Run headed/debug mode to diagnose failures, then run the repeatable headless suite. Capture traces/screenshots on failure where useful.
7. For production parity, test the static export behind an IIS-compatible local server with the configured base path. The sample config uses the dev server only.

Do not add broad flaky visual snapshots for every page. Keep test data deterministic and never point tests at production or live AS400 services. See `assets/` for starter examples.
