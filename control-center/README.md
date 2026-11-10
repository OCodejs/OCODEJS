# OCode.js Control Center

Standalone Control Center foundation in the OCode.js repository. `control-center/` is a static, read-only UI; it does not change the root OCode.js package, dependencies, exports, or release workflow.

## Current data connections

The GitHub & CI/CD view reads public repository metadata and the latest GitHub Actions runs for `OCodejs/OCodejs` from GitHub's public REST API. Requests use `GET` only, omit credentials, are limited to this fixed public repository, and refresh no more often than every five minutes while the page is visible. No GitHub token, OAuth credential, or private repository access is used. Public API rate limits and network failures are shown as unavailable rather than replaced with demo values.

Vercel, Netlify, Cloudflare, database metrics, host/container telemetry, Sandbox lifecycle, security events, alerts, and AI-agent runs are not connected in this phase. The UI shows “Chưa kết nối” or “Chưa có dữ liệu”; a missing value is `—`, not zero. A measured zero is shown only when a connected source returns that actual value. GitHub Actions status describes CI, not live host CPU/RAM telemetry.

The private owner-only Sandbox Status Dashboard is a separate project. Its telemetry, URLs, host identifiers, and credentials are not copied to this public repository.

## Security and action boundaries

The current UI is read-only. It has no forms that accept secrets and no controls for deploying, restarting, changing configuration, deleting data, or acknowledging/resolving alerts. Provider credentials must not be placed in source, browser storage, URLs, or client-side requests. A future authenticated connector phase requires a server-side API, workspace authorization, least-privilege credentials held in a secret manager, audit and redaction before any provider is called.

## Preview and tests

Serve this directory with a static HTTP server, or configure a separate hosting project with `control-center/` as its root. The page has no runtime package dependency. Unit tests for data-state semantics and the public GitHub adapter are in `tests/control-center.test.mjs`; run them with `node --test tests/control-center.test.mjs`. The repository-wide command is `npm test`.

## Sources

- Repository source: https://github.com/OCodejs/OCodejs
- Repository metadata endpoint: https://api.github.com/repos/OCodejs/OCodejs
- Latest workflow runs endpoint: https://api.github.com/repos/OCodejs/OCodejs/actions/runs?per_page=5
- Control Center foundation: https://github.com/OCodejs/OCodejs/pull/39

The six UI areas also reserve explicit empty states for Docker/container inventory, API health checks, OAuth/Auth/security events, and error logs/automatic alerts. These remain unconnected; no production status is inferred from the static pages.


HTTP 429 is treated as a rate limit. HTTP 403 is labeled rate-limited only when GitHub exposes `X-RateLimit-Remaining: 0` or `Retry-After`; otherwise it is reported as forbidden. The UI also includes keyboard focus states, a skip link, and Escape-to-close behavior for the mobile menu.
