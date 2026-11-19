# VelclawHost deployment

The repository builds two separate deliverables:

- The npm library: `npm test` builds `dist/` and runs the test suite.
- The static website: `node scripts/prepare-site.mjs` creates `_site/`.

## Manual workflow

Use **Actions → VelclawHost deployment → Run workflow**.

- Keep `deploy=false` to run build and static-output validation only.
- Set `deploy=true` only after the VelclawHost API endpoint and deployment contract have been confirmed by the platform operator.
- An optional custom hostname must already be verified and assigned in VelclawHost. Do not enter a hostname merely because its DNS record exists.

The workflow is manual-only. It does not run for pull requests or pushes. The deployment job uses the GitHub `production` environment so repository administrators can add required reviewers and protection rules before enabling deployment.

## Required repository Actions secrets

- `VELCLAWHOST_API_URL`: the canonical HTTPS API base URL provided by VelclawHost.
- `VELCLAWHOST_API_TOKEN`: a dedicated, least-privilege deployment token.

Create them at **Settings → Secrets and variables → Actions → Secrets**. Never place their values in source files, workflow inputs, logs, issues, or pull requests.

## API contract dependency

The request format in the workflow follows the existing VelclawHost adapter in `Velclaw/VELCLAW`:

- `POST /api/v1/deployments`
- JSON fields: `projectName`, `repoUrl`, `branch`, `commitSha`, `customDomain`
- Expected response envelope: `{ deployment: { id, status } }`

This client-side adapter is not proof that the VelclawHost production API is deployed or that the endpoint accepts this request. Confirm the server implementation, authentication scope, project build behavior, and deployment status lifecycle before setting `deploy=true`.

A successful HTTP response means only that the platform accepted the request. Verify the deployment's terminal status, served commit SHA, and public URL separately before calling it production-ready.
