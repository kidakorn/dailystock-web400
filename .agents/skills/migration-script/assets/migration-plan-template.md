# Migration Plan Template

## Scope

- Source and owner:
- Target system, IBM i release, library/schema:
- Data range and estimated volume:
- Production authorization and maintenance window:
- Responsible operator and reviewer:

## Contract

- Source schema/version:
- Target schema/version:
- Key and uniqueness evidence:
- Date/timezone, numeric precision, and CCSID/encoding:
- Transformation rules:
- Rejected-row policy:

## Execution Design

- Dry-run command and expected output:
- Apply command (must be explicit, never default):
- Idempotency strategy:
- Transaction or batch boundaries:
- Checkpoint/restart behavior:
- Secret/credential source:
- Logs and sensitive-data handling:

## Verification and Recovery

- Pre-migration backup and restore rehearsal:
- Source/target reconciliation queries:
- Expected counts and totals:
- Rollback or forward-recovery steps:
- Abort thresholds:
- Cutover and post-cutover owner:

## Sign-off

- Non-production rehearsal result:
- Data owner approval:
- Operations approval:
- Production execution approval:
- Completion evidence and timestamp:
