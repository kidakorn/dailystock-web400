---
name: migration-script
description: "Use when planning, writing, reviewing, or running data/database migration scripts, including JSON-to-DB2 for i imports and reversible schema changes; migration script, data migration, DB2 migration, สคริปต์ย้ายข้อมูล."
---

# Migration Script

Treat migrations as controlled data operations. This repository currently stores application data as JSON and has no database driver, connection configuration, or migration framework. DB2 for i is a target assumption to confirm, not an existing integration.

## Workflow

1. Confirm source/target, IBM i release and SQL dialect, ownership, volume, downtime, access, backup/restore plan, and production authorization.
2. Inspect current Zod schemas and importer behavior. Preserve field semantics, snapshot dates, decimal precision, encoding/CCSID, and candidate key `(snapshot, packageCode, processCode, subProcessCode)`.
3. Separate schema change, backfill, validation, and cutover where practical. Design idempotency and transaction/batch boundaries before writing.
4. Default to dry-run. Validate source shape, required columns, dates, enum values, ranges, duplicates, and counts before any write.
5. Use parameterized DB operations and least-privileged credentials. Keep secrets in approved environment/secret storage, never command arguments or source.
6. Record progress and reconciliation counts without logging sensitive row contents. Fail clearly and make partial-failure recovery explicit.
7. Provide rollback or a forward-recovery procedure, backup requirements, and a non-production rehearsal. Require explicit approval before production execution.
8. Reconcile source and target by snapshot, key, row count, and relevant totals before cutover.

Use `scripts/import-wgpgbl.py` as the existing source-import convention, not as a database migration. Adapt the planning template in `assets/migration-plan-template.md` and SQL placeholder in `assets/db2-stock-table-template.sql` only after confirming the real target contract.
