# OCode.js Control Center

Standalone infrastructure operations dashboard foundation inside the OCode.js repository. The app is isolated under `control-center/`; the root utility package, exports, tests and release workflow are unchanged.

## Modules
- Server Management: host inventory and CPU, RAM, disk, network telemetry.
- Live Monitoring: timestamped metrics, history and collection health.
- Database Monitoring: PostgreSQL, MySQL and Redis health/performance.
- Security Monitoring: audit events, authentication and access changes.
- Sandbox Management: isolated code execution lifecycle and resource limits.
- Alert Center: severity, acknowledgement, resolution and escalation.
- GitHub & CI/CD: repositories, workflow runs and checks.
- Deployments: Vercel, Netlify and Cloudflare.
- AI Agents: runs, tool permissions and execution audit.

## Current status
This increment is a responsive static UI foundation with navigation and explicit no-data states. It does **not** claim that external providers, server telemetry, database monitoring, alerts or agent orchestration are connected. No fabricated metrics are shown. The browser UI does not request or store credentials.

## Target architecture
1. UI: this directory; presentation only.
2. API: authenticated server-side API deployed separately.
3. Identity: OAuth/OIDC, secure session cookies, CSRF protection and workspace RBAC.
4. Secrets: provider credentials in a server-side secret manager or encrypted database; never in source, browser storage, query strings or logs.
5. Connectors: GitHub App (preferred), Vercel, Netlify, Cloudflare, database exporters and a signed host agent.
6. Telemetry: authenticated ingestion, schema validation, timestamps, retention and rate limits.
7. Alerts: deduplication, severity, acknowledgement, escalation and notification adapters.
8. Audit: append-only records for credential changes, user actions and privileged operations.

## Security requirements
- Least-privilege OAuth scopes and short-lived tokens where supported.
- Encrypt secrets at rest and redact credentials from logs and errors.
- Enforce workspace RBAC and server-side authorization on every connector route.
- Verify webhook signatures and prevent replay.
- Require explicit confirmation for destructive operations and production changes.
- Isolate sandbox workloads with strict CPU, memory, filesystem, network and time limits.

## Preview
Serve this directory with any static HTTP server, or configure a separate hosting project with `control-center` as its root. No root package dependencies or hosting configuration are modified.
