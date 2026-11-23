import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const signal = readFileSync(new URL("../.github/workflows/ocodejs-bot-review.yml", import.meta.url), "utf8");
const publisher = readFileSync(new URL("../.github/workflows/ocodejs-bot-trusted-publisher.yml", import.meta.url), "utf8");

test("PR signal workflow has no credentials, checkout, or PR code execution", () => {
  assert.match(signal, /pull_request:/);
  assert.match(signal, /permissions:\s*\{\}/);
  assert.match(signal, /draft == false/);
  assert.doesNotMatch(signal, /opened|secrets\.|vars\.|actions\/checkout|npm (?:install|ci)|pnpm (?:install|test)|git diff/);
});

test("trusted publisher is isolated behind workflow_run", () => {
  assert.match(publisher, /workflow_run:/);
  assert.match(publisher, /OCodeJS Bot — PR Review Signal/);
  assert.match(publisher, /\.github\/workflows\/ocodejs-bot-review\.yml/);
  assert.match(publisher, /head_repository\.full_name/);
  assert.match(publisher, /pull_requests\[0\]\.number/);
  assert.doesNotMatch(publisher, /actions\/checkout/);
});

test("trusted publisher validates current same-repository, non-draft main PR", () => {
  assert.match(publisher, /\.base\.ref/);
  assert.match(publisher, /"main"/);
  assert.match(publisher, /\.draft/);
  assert.match(publisher, /\.head\.repo\.full_name/);
  assert.match(publisher, /EVENT_PR_HEAD_SHA/);
});

test("diff is bounded and model output is bounded before publication", () => {
  assert.match(publisher, /response\.read\(50001\)/);
  assert.match(publisher, /len\(diff\) > 50000/);
  assert.match(publisher, /-le 25000/);
});

test("App private key is not exposed until after model inference", () => {
  const modelStep = publisher.indexOf("Generate advisory review without credentials");
  const secretStep = publisher.indexOf("Check App private key after model inference");
  const tokenStep = publisher.indexOf("Create narrowly scoped OCodeJS Bot installation token");
  assert.ok(modelStep >= 0 && secretStep > modelStep && tokenStep > secretStep);
  assert.match(publisher, /actions\/create-github-app-token@f418cff399f7aef4c2f0ad47e25ca7a6abbdd6fc/);
  assert.match(publisher, /permission-pull-requests: write/);
});
