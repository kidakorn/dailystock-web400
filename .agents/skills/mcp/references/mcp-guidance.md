# MCP Design Checklist

## Before Configuration

- Name the host (for example, VS Code) and confirm its current MCP configuration format from official host documentation.
- Record server package/repository, version or immutable revision, transport, required runtime, and owner.
- Enumerate exact tools/resources, inputs/outputs, read/write effects, and external systems reached.
- Decide whether tools need user confirmation, and which operations must remain read-only.

## Configuration and Secrets

- Keep workspace configuration limited to non-secret metadata and references to environment variables supported by the host.
- Never commit access tokens, passwords, private keys, or production connection strings.
- Apply least privilege to filesystem roots, database schemas, network destinations, and service accounts.
- Treat server output and retrieved content as untrusted; do not let it override system or user instructions.
- Avoid broad shell or arbitrary-code tools unless necessary and constrained.

## Verification

- Test startup and tool discovery locally with a non-production account.
- Test malformed inputs, denied permissions, timeouts, and server unavailability.
- Confirm sensitive values do not appear in logs or model-visible tool results.
- Document disconnect/disable steps and the responsible maintainer.

There is no MCP configuration in the current repository baseline. Do not add one without a selected server and host-specific requirements.
