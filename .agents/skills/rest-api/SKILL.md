---
name: rest-api
description: "Use when designing or reviewing REST resources, HTTP methods/status codes, pagination, validation, errors, or a future Next.js API; REST API, API design, ออกแบบ REST API."
---

# REST API

Design predictable HTTP contracts and validate every untrusted boundary. This repository currently uses Next.js static export and has no runtime API routes; treat route-handler examples as a future architecture change that requires deployment review.

## Workflow

1. Confirm consumers, auth model, data ownership, expected volume, and whether the target can host a runtime API.
2. Define resource names, methods, request/response schemas, status codes, pagination, filtering, and error shape before implementation.
3. Validate path, query, headers, and body with Zod at the boundary; reject invalid input explicitly.
4. Enforce authentication and authorization on the server for every private operation. Never rely on UI visibility.
5. Make mutations safe under retries where applicable; define idempotency and concurrency behavior.
6. Add contract tests for success, invalid input, missing resource, forbidden access, and failure responses.
7. Keep docs and generated OpenAPI in sync with the tested contract.

Use plural nouns for collections and HTTP semantics consistently. Do not expose internal database field names or stack traces. See `references/rest-api-guidance.md` for defaults and a contract checklist.
