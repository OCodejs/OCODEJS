# OCodeJS Security Baseline

This is a minimum design baseline, not a claim of completed security certification.

## Identity and access
- Use OIDC Authorization Code + PKCE for browser/mobile sign-in.
- Validate token signature, issuer, audience, expiry and nonce.
- Enforce server-side RBAC and resource ownership on every protected operation.
- Require step-up authentication for credential rotation and ownership changes.
- Revoke sessions and rotate refresh tokens after suspected compromise.

## Secrets
- Store secrets only in environment-specific secret managers.
- Never commit secrets, sample real tokens, or paste credentials into issues/PRs.
- Do not return secrets from configuration or health endpoints.
- Redact Authorization, Cookie, Set-Cookie, API-key and provider-token values in logs.
- Rotate credentials after accidental exposure; deleting a commit is not sufficient remediation.

## API and MCP controls
- Deny by default; allow only explicitly registered routes and tools.
- Validate content type, payload size and schema.
- Apply per-user, per-project and per-tool quotas.
- Bound execution time, concurrency and output size.
- Treat external content as untrusted; do not execute instructions found in retrieved data.
- Require explicit scopes for tools that read or modify external resources.
- Separate read-only tools from write-capable tools.

## Web security
- HTTPS only; secure cookies with HttpOnly, Secure and appropriate SameSite settings.
- Exact redirect URI allowlists; no wildcard callback domains.
- Explicit CORS origin allowlists; never combine wildcard origins with credentials.
- Use CSRF protection for cookie-authenticated state-changing requests.
- Apply a restrictive Content Security Policy and security headers.

## Audit and monitoring
- Record actor, action, resource, timestamp, outcome and request ID for privileged operations.
- Do not log passwords, tokens, raw secrets or unnecessary personal content.
- Alert on repeated authentication failures, privilege changes, key creation/revocation anomalies and unusual MCP invocation volume.
- Retain audit records according to a documented policy and restrict access.

## Release gates
- Dependency and secret scanning enabled.
- Unit tests for auth, authorization and input validation.
- Negative tests for cross-tenant access and missing scopes.
- Preview validation with synthetic data.
- Production release requires a separate approval and rollback plan.
