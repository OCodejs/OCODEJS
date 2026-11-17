# OCodeJS Infrastructure Foundation

Status: architecture and contract baseline (not deployed).

This directory defines a provider-neutral foundation for the OCodeJS platform. It is intentionally isolated from the existing website preview and does not provision cloud resources.

## Platform domains

| Domain | Responsibility | Initial interface |
|---|---|---|
| API Gateway | Routing, request IDs, CORS, quotas and API versioning | `/api/v1/*` |
| Identity | OAuth/OIDC, sessions, token validation and RBAC | `/api/v1/auth/*` |
| MCP | MCP endpoint, tool registry and authorization boundary | `/mcp` |
| Developer Console | API key lifecycle, projects, teams and usage | `/api/v1/console/*` |
| Observability | Health, readiness, structured logs, metrics and traces | `/health`, `/ready`, `/metrics` |
| Integrations | GitHub, Linear, Figma, Sentry, Notion, Slack, Supabase and Stripe adapters | Connector interfaces |

## Environments

- **Local:** isolated developer environment with mock integrations.
- **Preview:** branch-scoped validation; synthetic data only.
- **Staging:** production-like validation, separate credentials and data.
- **Production:** explicitly out of scope for this foundation change.

Never share credentials, databases, OAuth callback secrets or signing keys across environments.

## Service boundaries

1. Gateway authenticates and normalizes inbound requests.
2. Identity issues and validates short-lived credentials; services consume verified identity claims.
3. Authorization is enforced by each service, not only by the UI or gateway.
4. MCP tools declare required scopes and validate authorization at invocation time.
5. Integrations use adapter interfaces; provider credentials remain server-side.
6. Observability emits request IDs and redacted structured events without secrets or personal payloads.

## API contract

See [openapi.yaml](./openapi.yaml). The initial contract covers health, readiness and versioned API metadata only. Product-specific endpoints must be added with explicit schemas and authorization requirements.

## Security baseline

See [security-baseline.md](./security-baseline.md).

## Rollout sequence

1. Review architecture and API contract.
2. Implement a stateless gateway health/readiness service.
3. Add identity verification and RBAC middleware.
4. Add MCP registry with per-tool scopes.
5. Add telemetry and alert policies.
6. Add integration adapters one at a time.
7. Validate in Preview, then Staging. Production requires separate explicit approval.

## Non-goals

- No cloud resource provisioning or paid plan changes.
- No production deployment, DNS changes or database migrations.
- No real OAuth, billing, API-key issuance or provider secrets in this documentation-only phase.
- No assumption that a provider integration is already connected.
