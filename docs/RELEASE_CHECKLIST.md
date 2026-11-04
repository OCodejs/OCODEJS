# OCode.js v0.1.0 release checklist

This checklist is for the first public npm release of `ocode-js`.

## Package identity

- [ ] Confirm the npm registry reports `ocode-js` as available immediately before publishing.
- [ ] Confirm the npm publisher account controls the package name.
- [ ] Confirm `package.json` name, version, license, repository, homepage, exports, and files list.
- [ ] Review the output of `npm pack --dry-run`; publish only the intended `dist/`, README, and license files.

## Quality gates

- [ ] `npm ci --no-audit --no-fund`
- [ ] `npm test`
- [ ] `npm run test:coverage`
- [ ] Review `coverage/lcov.info` and the uploaded GitHub Actions artifact.
- [ ] Confirm the release-preflight workflow reports the npm name as available.
- [ ] Confirm no credentials, local environment files, or generated test artifacts are included in the package.

## npm publishing credential

Create a granular npm access token for the publisher account with package publish/write permission and an automation-compatible 2FA policy. Store it only as a GitHub Actions repository secret:

1. Open **Settings → Secrets and variables → Actions** for this repository.
2. Create a repository secret named `NPM_TOKEN`.
3. Paste the token into GitHub's secret-value field. Do not commit it, add it to a workflow file, or send it in chat.
4. Manually run **Publish npm package** with the `main` branch selected. Confirm the **Verify NPM_TOKEN is configured** step passes without printing its value. On `main`, the publish step is skipped.

Repository settings: https://github.com/OCodejs/OCodejs/settings/secrets/actions

## Publish

- [ ] Confirm all required CI and release-preflight checks are green.
- [ ] Confirm `NPM_TOKEN` is configured.
- [ ] Confirm version `0.1.0` has not already been published.
- [ ] Create and push the annotated tag `v0.1.0` only after all gates above pass.
- [ ] Verify the **Publish npm package** workflow succeeds.
- [ ] Verify `https://www.npmjs.com/package/ocode-js` and install the exact published version in a clean project.
- [ ] Create the matching GitHub Release with notes and installation instructions.

## Rollback and support

npm versions are immutable in normal release practice. If a defect is found, publish a corrected patch version rather than attempting to overwrite `0.1.0`. Document any deprecation or security response in the repository.
