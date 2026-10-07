# Security Audit Checklist and Report

## Scope and Boundaries

- Record application version/commit, environment, deployment target, allowed test methods, and exclusions.
- Map browser inputs, query parameters, imported workbooks, JSON files, CSV downloads, build artifacts, and any external integrations.
- Confirm whether auth, API, database, IIS headers, or AS400 connectivity exist in the audited deployment; do not infer from a local dev server.

## Checks

- Input validation: Zod at runtime boundaries; malformed dates/numbers, oversized inputs, unknown enum values, duplicate keys.
- Injection and output: CSV formula injection and quoting; HTML rendering/escaping; command and SQL construction if introduced.
- Access control: server-side authn/authz for private operations; static assets are public unless deployment says otherwise.
- Secrets/data: credentials, `.env*`, committed JSON/workbooks, logs, source maps, static output and `NEXT_PUBLIC_*` values.
- Dependencies: review lockfile and run `npm audit` in the intended environment; triage exploitability and avoid blind major upgrades.
- Configuration: `next.config.ts`, IIS/static hosting rules, TLS, cache behavior, security headers at the actual hosting layer, error disclosure.
- Import/migration: least privilege, transaction boundaries, dry-run, backups, idempotency, reconciliation, rollback and safe handling of production data.
- Tests: verify controls fail closed and error responses do not disclose sensitive internals.

## Safe Commands

- `npm audit --omit=dev` may be useful for production dependency triage, but document lockfile and registry conditions.
- `npm run lint`, `npm run typecheck`, and `npm test` check quality, not security completeness.
- Do not run scanners or payloads against production without written authorization and an agreed scope.

## Report Template

```text
Scope:
Environment and commit:
Methods and tools:

Findings (highest severity first):
- [SEVERITY] Title
  Evidence:
  Preconditions and impact:
  Recommended remediation:
  Verification:

Checks passed:
Checks unavailable or excluded:
Residual risk and prioritized next steps:
```

Use a recognized severity rubric consistently. A missing feature is not automatically a vulnerability; explain the threat and exposure.
