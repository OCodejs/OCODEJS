# Terminal Tasks and Development Workflow

This runbook documents the repeatable terminal tasks for developing, validating, and preparing OCode.js. Commands run from the repository root.

## Environment

~~~sh
node --version
npm --version
git status --short --branch
~~~

Use Node.js 18 or newer.

## First-time setup

~~~sh
git clone https://github.com/OCodejs/OCodejs.git
cd OCodejs
npm ci
~~~

The npm ci command installs the exact dependency tree recorded in package-lock.json.

## Standard terminal tasks

| Task | Command | Purpose |
| --- | --- | --- |
| Build | **npm run build** | Clean and compile TypeScript into dist/ |
| Tests | **npm test** | Build, then run the Node.js test suite |
| Coverage | **npm run test:coverage** | Write LCOV coverage to coverage/lcov.info |
| Package preview | **npm pack --dry-run** | Preview files included in the npm tarball |
| Clean | **npm run clean** | Remove generated dist/ output |

Run the complete local validation sequence before opening a pull request:

~~~sh
npm ci
npm test
npm run test:coverage
npm pack --dry-run
git diff --check
git status --short
~~~

Treat a task as passing only when its process exits with status 0. Inspect the package preview before release. The current dry-run also reports root README.markdown, readme.mdx, and lowercase license files in addition to README.md, LICENSE, package.json, and dist/. Confirm these extra README/license files are intentional before publishing; do not assume the files allowlist alone proves the tarball contents.

## Run a Terminal Task from GitHub Actions

The repository provides a manual workflow named **Terminal Task**:

1. Open the repository's Actions tab.
2. Select **Terminal Task**.
3. Select **Run workflow** and choose a task.
4. Review the run logs and require a successful conclusion.

Available tasks:

- **validate** — install dependencies, run the build and tests, generate coverage, and preview the npm package.
- **package-preview** — install dependencies and preview the npm package without publishing it.

The workflow accepts only predefined tasks. It does not accept arbitrary shell commands, read or print secrets, create deployments, or publish to npm. Normal CI still runs automatically on pull requests and pushes to main.

## Inspect compiled exports locally

After a successful build:

~~~sh
node --input-type=module <<'NODE'
const modules = [
  './dist/index.js',
  './dist/string.js',
  './dist/object.js',
  './dist/async.js',
  './dist/url.js',
  './dist/validation.js',
  './dist/http.js',
  './dist/browser.js',
  './dist/env.js',
  './dist/logger.js'
];

for (const path of modules) {
  const namespace = await import(path);
  const names = Object.keys(namespace);
  if (names.length === 0) {
    throw new Error('No exports found in ' + path);
  }
  console.log(path + ': ' + names.length + ' exports');
}
NODE
~~~

The package export map is defined in package.json. This smoke test checks the compiled files directly.

## Safe Git workflow

Use a feature branch for documentation, source, and workflow changes:

~~~sh
git switch -c docs/terminal-quickstart
git diff --check
git diff
git status --short
~~~

Do not commit directly to main. Push a reviewed branch and open a pull request. Never put access tokens in command arguments, source files, shell history, or logs.

## Release-only tasks

Publishing is a separate, explicitly approved operation. A successful build, test run, package preview, or Terminal Task workflow does not publish the package.

Before a release:

1. Follow the [v0.1.0 release checklist](RELEASE-CHECKLIST-v0.1.0.md).
2. Confirm the exact release commit is merged to main.
3. Confirm the repository's NPM_TOKEN secret exists without printing its value.
4. Create and push the approved version tag only after all release checks pass.
5. Monitor the tag-triggered publish workflow.
6. Verify the published version from the npm registry and install it in a clean temporary project.

Never run npm publish from an unreviewed working tree or use a local terminal to bypass the protected release workflow.
