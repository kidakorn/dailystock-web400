# REST API Contract Checklist

## Resource Design

- Use stable resource nouns; use collection routes for lists and item routes for individual resources.
- Use `GET` for safe reads, `POST` for creation/actions, `PUT` for complete replacement, `PATCH` for partial updates, and `DELETE` for removal.
- Define whether a mutation is idempotent and how retries/concurrent updates behave.

## HTTP Responses

- Use `200` for successful reads/updates with a body, `201` for creation (with `Location` where useful), `204` for success without a body.
- Use `400` for malformed requests, `401` for missing/invalid authentication, `403` for authenticated but unauthorized callers, `404` for missing/hidden resources, `409` for state conflicts, `422` for semantically invalid input when the API adopts that convention, and `500` for unexpected server errors.
- Keep a consistent error object, for example `{ "error": { "code": "INVALID_INPUT", "message": "...", "details": [] } }`. Do not return stack traces or secrets.

## Lists and Filters

- Define bounded page size and stable ordering before adding pagination. Prefer cursor pagination for mutable/high-volume datasets; document cursor opacity and expiry.
- Validate filters, dates, sort keys, and page limits; reject unsupported values rather than silently changing meaning.
- For snapshot-oriented ERP data, explicitly specify the date/snapshot filter and timezone/date semantics.

## Contract Review

For each operation, record method/path, auth scope, query/path parameters, request schema, success schema/status, error statuses, pagination, and relevant examples. Test boundary inputs and authorization independently of UI behavior.
