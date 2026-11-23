# Authentication implementation reconciliation — source audit

**Review date:** 2026-11-23  
**Scope:** read-only source inspection of the central gateway and three first-party consumers.  
**No runtime, database, secret, callback, deployment or Production changes were made.**

## 1. Executive decision

The repository has a common route shape but does **not** yet have one unified identity runtime.

- The Node.js Fastify/PostgreSQL implementation is the preferred production candidate because it uses Argon2id and the existing PostgreSQL identity/session model.
- The Cloudflare Workers-native/D1 implementation is an isolated Preview backend and must remain a separate test environment until a backend decision, compatibility strategy and deployment ownership are confirmed.
- The Worker proxy design is a third topology that forwards to the Node service. It must not be confused with the Workers-native D1 service.
- Auth.js applications and the Control Center still own separate sessions. They are clients to be migrated, not current consumers of one central session.
- Do not merge accounts, accept either backend's cookies interchangeably, or dual-write identity state.

This is a recommendation from source review, not proof that the Node service is deployed or that the Preview Worker is currently healthy.

## 2. Central repository contains three runtime paths

| Runtime path | Source | Identity store | Password hash | Status evidenced by source |
|---|---|---|---|---|
| Node API | `server/app.ts`, `server/db.ts`, `server/config.ts` | PostgreSQL | Argon2id | Complete route implementation and PostgreSQL CI workflow present |
| Workers-native Preview | `cloudflare/worker-native.mjs`, `cloudflare/identity.mjs`, `cloudflare/migrations/0001_identity.sql` | Dedicated D1 binding | Versioned PBKDF2-SHA256, 600,000 iterations | README documents a Preview Worker and D1 migration; no live health check performed in this audit |
| Worker proxy | `cloudflare/worker.mjs` | Node API's PostgreSQL | Delegated to Node API | Strict allowlisted proxy implementation present |

### Critical compatibility finding

The Workers-native README explicitly states that its PBKDF2 verifier does not accept existing Argon2id hashes and that no existing account data was copied. This means there is no transparent password/session migration between the Node and D1 stores.

Both implementations use the cookie name `ocodejs_session`, but they validate against different session tables and secrets. Do not deploy both under a shared cookie domain or assume that a cookie from one backend is valid at the other.

The root README and Cloudflare documentation also describe different Worker topologies. The documentation must name the active entrypoint and deployment target explicitly before a client is connected.

## 3. Consumer session inventory

| Consumer | Source evidence | Current session/identity | Integration state |
|---|---|---|---|
| `OCodejs/mcp.auth.ocodejs` | `auth.ts`, `prisma/schema.prisma`, `lib/auth-oidc.ts` | Auth.js JWT session; Prisma users/accounts/sessions; bcryptjs credentials; Google/GitHub and optional generic OIDC upstream provider | Separate identity authority. Its optional OIDC provider config is an upstream relying-party integration, not an OIDC issuer. |
| `Velclaw/app-velclaw` | `src/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `prisma/schema.prisma` | Auth.js JWT session; Prisma/PostgreSQL; GitHub, Google and Credentials | Still uses local Auth.js in source. `docs/auth-gateway-integration.md` is a target integration guide, not proof that source has migrated. |
| `Velclaw/VelclawHost-Control-Center` | `server/auth-session.mjs`, Netlify auth functions | GitHub OAuth, AES-256-GCM encrypted stateless `vh_session`, numeric GitHub ID and username-derived admin/member role | Separate Control Center session; no central gateway validation visible in inspected functions. |
| `zskbot/ocodejs-api/velclaw-identity` | Prior source inventory | Hono/Val Town bridge with Neon Auth JWT/JWKS and SQLite session layer | Separate legacy/bridge trust boundary; issuer/audience and active consumer usage require verification. |

## 4. Protocol distinctions

1. Auth.js with Google/GitHub is an OAuth/OIDC client (relying party) for upstream login.
2. `createOptionalOidcProvider` in OCodeJS Auth configures Auth.js to consume an external OIDC issuer.
3. Neither capability makes the gateway an OAuth 2.0 Authorization Server or OpenID Connect Provider.
4. Cross-domain browser clients cannot assume they can send the central gateway's SameSite=Lax cookie to a different registrable site. For example, `*.pages.dev` and `*.velclaw.app` are cross-site.
5. A shared login across these domains requires a reviewed redirect-based OIDC authorization-code flow with PKCE, or a rigorously designed backend session exchange. Do not copy cookies between domains or expose a bearer secret to browser JavaScript.

## 5. Recommended sequence

### Gate A — choose the authoritative backend

Preferred target: Node Fastify + PostgreSQL + Argon2id as the canonical production implementation, with a strict Preview instance. Keep the Cloudflare D1 Worker as an isolated Preview proof-of-concept until the team explicitly chooses whether it remains an independent test harness or is retired after parity.

Before selection is final, verify:
- Which service owns the current Preview API hostname and Worker deployment.
- Whether the Node Fastify service has a dedicated isolated Preview PostgreSQL database and a reachable Preview URL.
- Whether the Workers-native D1 Preview is still actively used and which clients point to it.
- Whether the proxy Worker is deployed anywhere and whether its `AUTH_ORIGIN` is configured.
- That no two implementations share cookie scope, database, or secrets.

### Gate B — establish one client integration

Select one Preview consumer only after its hostname and owner are confirmed. Do not integrate every app in parallel.

The safest eventual shared-login path for separate registrable domains is a central OIDC Provider:
- Authorization Code + PKCE S256.
- Exact registered redirect URIs.
- State, nonce, issuer/audience and signature validation.
- One-time short-lived authorization codes.
- Minimal ID Token claims and stable immutable subject.
- Client registry, scopes, consent, key rotation, revocation and audit.

Do not begin this work by adding an ad-hoc JWT signing endpoint or sharing a session secret.

### Gate C — migrate product identities

Only after a Preview OIDC flow passes:
- Map old identities to the central immutable subject using verified evidence.
- Require explicit account linking; never merge by email alone.
- Preserve product-owned Profile, social graph, BYOK Token Vault, projects and Control Center role data.
- Reconcile permissions separately; GitHub username allowlists must not automatically become global platform-admin rights.
- Keep old login available through a tested rollback window.

## 6. Explicit blockers

- No verified central OIDC issuer exists yet.
- Node and D1 password hashes are incompatible.
- Auth.js JWT sessions, opaque gateway sessions and encrypted Control Center sessions are incompatible.
- The Velclaw app integration document and current source code do not describe the same runtime state.
- Cross-site cookie behavior is unresolved for the actual Preview hostnames.
- The live Preview Worker readiness and Node service reachability were not checked during this source-only audit.

## 7. Files inspected

Central gateway:
- `package.json`
- `server/index.ts`
- `server/app.ts`
- `server/config.ts`
- `server/db.ts`
- `cloudflare/worker.mjs`
- `cloudflare/worker-native.mjs`
- `cloudflare/identity.mjs`
- `cloudflare/migrations/0001_identity.sql`
- `cloudflare/README.md`
- `docs/openapi-identity-v1.yaml`
- `.github/workflows/ci.yml`

Consumers:
- `OCodejs/mcp.auth.ocodejs/auth.ts`
- `OCodejs/mcp.auth.ocodejs/lib/auth-oidc.ts`
- `OCodejs/mcp.auth.ocodejs/prisma/schema.prisma`
- `OCodejs/mcp.auth.ocodejs/docs/architecture/auth-platform-roadmap.md`
- `Velclaw/app-velclaw/src/auth.ts`
- `Velclaw/app-velclaw/docs/auth-gateway-integration.md`
- `Velclaw/VelclawHost-Control-Center/server/auth-session.mjs`
- `Velclaw/VelclawHost-Control-Center/netlify/functions/auth-start.mjs`
- `Velclaw/VelclawHost-Control-Center/netlify/functions/auth-callback.mjs`
- `Velclaw/VelclawHost-Control-Center/netlify/functions/auth-me.mjs`
- `Velclaw/VelclawHost-Control-Center/netlify/functions/auth-logout.mjs`

## 8. Verification boundary

This document records source-level observations only. No tests, CI runs, browser flows, OAuth callbacks, live HTTP checks, database writes, secret changes or deployments were performed. Treat any runtime/deployment state as unverified until a separate read-only live check is completed.