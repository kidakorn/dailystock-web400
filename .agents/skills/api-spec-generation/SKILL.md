---
name: api-spec-generation
description: "Use when creating, updating, or validating OpenAPI specifications and API contracts from routes or Zod schemas; generate API spec, OpenAPI, API documentation, สร้าง API spec."
---

# API Specification Generation

Generate an OpenAPI 3.1 contract that reflects an implemented or explicitly proposed API. No API routes or OpenAPI generator are currently present in this repository.

## Workflow

1. Inventory route handlers, consumers, auth requirements, and Zod request/response schemas. If there are no routes, label the result as a proposal, not generated documentation.
2. Map methods, path/query parameters, request bodies, response bodies, status codes, security schemes, and error responses.
3. Preserve schema constraints such as enums, integer/range limits, required fields, and date formats. Avoid drift between runtime validation and the spec.
4. Choose and pin a compatible Zod-to-OpenAPI tool only after checking Zod 4 compatibility; otherwise maintain a reviewed OpenAPI document and add contract validation.
5. Validate the resulting document with an OpenAPI 3.1 validator and test representative requests/responses.
6. Keep generated artifacts deterministic and explain the regeneration command. Do not hand-edit generated output unless the workflow explicitly supports it.

For schema mapping and a starter skeleton, see `references/openapi-guidance.md`. Future API routes must also pass the static-export/deployment review described in `rest-api`.
