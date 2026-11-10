import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("labeler rules cover documentation, tests, dependencies, workflows and source", () => {
  const config = read(".github/labeler.yml");
  for (const rule of ["documentation:", "tests:", "dependencies:", "github-actions:", "source:"]) {
    assert.ok(config.includes(rule), `Missing label rule: ${rule}`);
  }
  for (const pattern of [
    "**/*.md", "docs/**", "infra/**", "tests/**",
    "package.json", "package-lock.json", "apps/**/package.json",
    ".github/workflows/**", ".github/labeler.yml", "src/**", "scripts/**", "apps/**",
  ]) {
    assert.ok(config.includes(`"${pattern}"`), `Missing path pattern: ${pattern}`);
  }
});

test("manual Endor Labs workflow runs a scan and uploads SARIF only when present", () => {
  const workflow = read(".github/workflows/endorlabs.yml");
  assert.match(workflow, /^on:\s*\n\s+workflow_dispatch:/m);
  assert.match(workflow, /namespace:\s*\n\s+description:/);
  assert.match(workflow, /uses:\s*endorlabs\/github-action@/);
  assert.doesNotMatch(workflow, /if:\s*github\.event_name\s*==\s*'(?:push|pull_request)'/);
  assert.match(workflow, /if:\s*always\(\)\s*&&\s*hashFiles\('findings\.sarif'\)\s*!=\s*''/);
});

test("manual dependency review receives explicit base and head revisions", () => {
  const workflow = read(".github/workflows/dependency-review.yml");
  assert.match(workflow, /^on:\s*\n\s+workflow_dispatch:/m);
  assert.match(workflow, /base_ref:/);
  assert.match(workflow, /head_ref:/);
  assert.match(workflow, /base-ref:\s*\$\{\{\s*inputs\.base_ref\s*\}\}/);
  assert.match(workflow, /head-ref:\s*\$\{\{\s*inputs\.head_ref\s*\}\}/);
  assert.match(workflow, /comment-summary-in-pr:\s*never/);
});
