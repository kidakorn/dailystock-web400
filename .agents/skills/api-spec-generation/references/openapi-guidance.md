# OpenAPI 3.1 Generation Guidance

## Source Mapping

- `z.object(...)` maps to an object schema; use explicit `required` fields matching runtime behavior.
- `z.enum([...])` maps to a string enum.
- `z.array(T)` maps to an array with `items: T`.
- `z.number().int()` maps to an integer; preserve minimum/maximum constraints when present in the source schema.
- A Zod `.optional()` field should not appear in the OpenAPI `required` array. Distinguish optional from nullable.
- `z.string().regex(...)` needs a compatible OpenAPI `pattern`; document date format/meaning separately when the value is a string.

The repository schemas are currently data-file validation schemas, not request/response contracts. Reuse them only if the API intentionally exposes those shapes; create boundary-specific schemas when the API contract differs.

## Starter Skeleton

```yaml
openapi: 3.1.0
info:
  title: Daily Stock API
  version: 1.0.0
servers:
  - url: https://example.invalid/api
paths: {}
components:
  schemas: {}
```

Replace the placeholder server URL and add only implemented operations. If no route exists, label the document `proposal` and do not publish it as an operational API contract.

## Validation

- Check the selected generator's current compatibility with Zod 4 and the chosen OpenAPI 3.1 dialect before installing it.
- Keep generation deterministic and validate output in CI or a documented local command.
- Add contract tests for representative valid and invalid payloads; compare actual status codes and response bodies with the spec.
- Document auth, pagination, date/timezone semantics, error schema, and static hosting limitations.
