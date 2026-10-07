# Playwright Starter Assets

These files are examples only; Playwright is not installed or wired into `package.json`.

To evaluate them, first review the current Playwright documentation, add a compatible `@playwright/test` dev dependency, and copy the config to the repository root and spec to `e2e/`. Then add an explicit package script and install the required browser. The sample starts `next dev` locally and checks only that the current dashboard routes render a main landmark.

For deployment parity, create a separate test configuration that serves `out/` under the production base path. Do not use the development server as evidence that IIS base-path routing works.
