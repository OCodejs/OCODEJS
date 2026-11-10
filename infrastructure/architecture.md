# OCodeJS Platform Architecture

## Logical topology

```text
Clients (Web / Mobile / CLI / SDK)
              |
        Edge / API Gateway
        |       |        |
     Identity  API     MCP Host
        |       |        |
        +---- Authorization ----+
              |        |
        Domain Services   Tool Registry
              |        |
        Data Adapters   MCP Tool Adapters
              |        |
        Observability / Audit Events
```

## Service responsibilities

### Edge / API Gateway
- Enforce HTTPS and supported HTTP methods.
- Generate or validate a bounded request ID.
- Apply environment-specific CORS allowlists.
- Apply coarse rate limits before expensive work.
- Route only versioned API paths; reject unknown versions.
- Do not make authorization decisions based on client-supplied role fields.

### Identity
- Support OIDC Authorization Code with PKCE for interactive clients.
- Validate issuer, audience, signature, expiry, nonce and redirect URI.
- Keep access tokens short-lived; rotate refresh tokens where supported.
- Map external identities to internal subjects without trusting email as a stable identifier.
- Keep provider secrets in the deployment secret store, never in browser bundles.

### Authorization
- Use deny-by-default RBAC with resource ownership checks.
- Suggested roles: `owner`, `admin`, `developer`, `viewer`.
- Suggested scopes: `project:read`, `project:write`, `keys:manage`, `team:manage`, `mcp:invoke`.
- Check both role and resource boundary on every server-side operation.

### MCP
- Separate MCP transport/host concerns from tool implementations.
- Register each tool with input schema, owner, required scopes, timeout and audit classification.
- Validate arguments against schemas before execution.
- Apply per-tool timeout, output size cap and invocation quota.
- Treat tool output and remote repository content as untrusted data.
- Never expose environment variables, raw provider credentials or unrestricted shell access through tools.

### Integrations
- Implement providers behind narrow adapter interfaces.
- Use least-privilege OAuth scopes and per-environment credentials.
- Set connect/read timeouts, retry only idempotent operations and use bounded exponential backoff.
- Record provider request IDs while redacting authorization headers and tokens.

## Reliability requirements

- Liveness answers whether the process can respond.
- Readiness answers whether required dependencies are available to serve traffic.
- Optional dependencies must not make core readiness fail unless explicitly designated critical.
- Set request deadlines and propagate cancellation.
- Use bounded retries with jitter; avoid retry storms.
- Make write endpoints idempotent where practical.
- Define recovery objectives and backup/restore procedures before production data is introduced.

## Data classification

- Public: documentation and public metadata.
- Internal: service configuration and operational metadata.
- Confidential: user content, project data and audit records.
- Secret: passwords, API keys, OAuth secrets, signing keys and database credentials.

Secrets must never enter source control, logs, analytics events, URLs or client-side storage.
