---
name: security-audit
description: "Use for a structured application or repository security audit, threat review, dependency/configuration checks, and a findings report; security audit, OWASP audit, ตรวจ security ทั้งระบบ."
---

# Security Audit

Perform a scoped, evidence-based security assessment. Do not describe a code review as a penetration test, and never probe production or real AS400 systems without explicit authorization and a safe test plan.

## Workflow

1. Agree the scope: code, dependencies, build/deployment configuration, data import/export, and test environment.
2. Map assets, entry points, trust boundaries, sensitive data, deployment mode, and likely threats.
3. Inspect validation, access control, injection/output encoding, secrets, error/log handling, dependency health, headers, and operational controls.
4. Run only safe, scoped checks. Record command/tool versions and distinguish completed checks from unavailable ones.
5. Rank concrete findings by severity and exploitability; include evidence, impact, preconditions, remediation, and verification steps.
6. Close with scope exclusions, residual risk, and prioritized actions. Do not invent a clean bill of health from missing evidence.

This app currently statically exports to IIS, reads JSON data, and has no observed runtime API or database integration. Review those real boundaries first; treat runtime headers, authentication, database access, and API controls as deployment questions unless added in scope.

Use `references/audit-checklist.md` for the checklist and report template. Coordinate with `security-review` for changes to a specific patch.
