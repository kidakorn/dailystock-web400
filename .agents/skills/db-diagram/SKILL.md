---
name: db-diagram
description: "Use when deriving, documenting, or reviewing database entities and relationships from AS400/ERP data, Zod schemas, or a proposed relational model; DB diagram, ERD, database schema, แผนภาพฐานข้อมูล."
---

# Database Diagram

Produce an accurate, reviewable Mermaid ER diagram and state the evidence behind every entity, key, and relationship. Current application data is JSON; a relational database schema is not implemented.

## Workflow

1. Inspect source files and `src/lib/data/schemas.ts`; distinguish observed fields from proposed normalization.
2. Identify candidate entities, natural/business keys, nullability, cardinality, and snapshot/version dimensions.
3. Do not infer a foreign key merely because two fields have similar names. Label uncertain relationships as assumptions and ask for source-system confirmation.
4. For DB2 for i, confirm target IBM i release, SQL dialect, naming conventions, CCSID/encoding, numeric precision, date representation, journaling and deployment constraints before prescribing DDL.
5. Draw with Mermaid `erDiagram`; use explicit PK/FK attributes and stable names, and include a short assumptions section.
6. Review uniqueness, indexes, history retention, and migration/backfill implications against realistic data volume.

The existing raw stock line has a documented candidate key `(snapshot, packageCode, processCode, subProcessCode)` in `scripts/import-wgpgbl.py`; treat it as a source-row key, not a fully confirmed DB constraint. See `references/db-diagram-guidance.md` for a schema sketch based on current evidence.
