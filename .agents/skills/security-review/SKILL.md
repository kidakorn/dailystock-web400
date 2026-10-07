---
name: security-review
description: "Use for security-focused review of application changes, data handling, exports, dependencies, and browser/server boundaries; security review, secure code, ตรวจความปลอดภัย."
---

# Security Review

Assess the changed trust boundaries and plausible abuse paths. This is a code-change review, not a full compliance certification or penetration test.

## Workflow

1. Identify untrusted inputs, sensitive data, trust boundaries, and deployment assumptions touched by the change.
2. Trace validation, authorization, output encoding, error handling, and logging end to end.
3. Check relevant OWASP risks: injection, broken access control, security misconfiguration, vulnerable dependencies, authentication/session issues, and unsafe design.
4. Verify protections with targeted tests or safe local checks. Never run destructive tests against live AS400 systems or real data.
5. Report concrete findings with severity, affected path, exploit preconditions, impact, and remediation. State what was not assessed.

## Repository-Specific Checks

- `src/lib/data/schemas.ts` uses Zod for runtime shape validation. Confirm validation happens at the actual input boundary, not only in downstream UI code.
- `src/lib/csv.ts` quotes fields and prefixes formula-leading text. Preserve checks for `=`, `+`, `-`, and `@`, quote escaping, and all exported untrusted strings.
- `next.config.ts` uses static export and a production `basePath`; do not assume server middleware, route handlers, or runtime headers exist in the deployed app.
- Keep secrets out of `NEXT_PUBLIC_*`, static assets, generated JSON, logs, and committed test fixtures.
- Treat workbook/AS400 imports as untrusted: validate required columns, types, enumerations, dates, duplicate keys, and output destinations.
- When discussing API protections, distinguish current static-export behavior from a proposed future API. Verify authz on the server for any future private endpoint.

For an application-wide audit, use the `security-audit` skill. For detailed threat categories and an audit report format, consult `security-audit/references/audit-checklist.md`.
