import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { filterPlugins, readInstalled, toggleSelection, writeInstalled } from "../plugin-hub.js";
import { prepareSite } from "../scripts/prepare-site.mjs";

const plugins = [
  { id: "a", name: "Alpha", type: "Skills", tagline: "Code review", description: "Review changes", tags: ["git"] },
  { id: "b", name: "Beta", type: "MCP", tagline: "Browser tools", description: "Automation", tags: ["web"] },
  { id: "c", name: "Gamma", type: "Skills", tagline: "Testing", description: "TDD", tags: ["quality"] },
];

test("plugin catalog search matches names, descriptions and tags", () => {
  assert.deepEqual(filterPlugins(plugins, { query: "AUTOMATION" }).map((p) => p.id), ["b"]);
  assert.deepEqual(filterPlugins(plugins, { query: "git" }).map((p) => p.id), ["a"]);
});

test("category and installed filters compose with search", () => {
  const installed = new Set(["a", "b"]);
  assert.deepEqual(filterPlugins(plugins, { category: "Skills" }).map((p) => p.id), ["a", "c"]);
  assert.deepEqual(filterPlugins(plugins, { category: "installed", installed }).map((p) => p.id), ["a", "b"]);
  assert.deepEqual(filterPlugins(plugins, { category: "installed", installed, query: "browser" }).map((p) => p.id), ["b"]);
});

test("sorting supports name and category grouping", () => {
  assert.deepEqual(filterPlugins(plugins, { sort: "name" }).map((p) => p.name), ["Alpha", "Beta", "Gamma"]);
  assert.deepEqual(filterPlugins(plugins, { sort: "type" }).map((p) => p.id), ["b", "a", "c"]);
});

test("saved selections are filtered against known plugin ids", () => {
  const storage = { getItem: () => JSON.stringify(["a", "unknown", 42]) };
  const result = readInstalled(storage, "plugins", ["a", "b"]);
  assert.equal(result.ok, true);
  assert.deepEqual([...result.installed], ["a"]);
});

test("storage read and write failures are surfaced", () => {
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("quota"); } };
  assert.equal(readInstalled(broken, "plugins", []).ok, false);
  assert.equal(writeInstalled(broken, "plugins", new Set(["a"])).ok, false);
  assert.equal(readInstalled(null, "plugins", []).ok, false);
});

test("selection toggles return a new set without mutating the previous value", () => {
  const current = new Set(["a"]);
  const added = toggleSelection(current, "b");
  assert.deepEqual([...current], ["a"]);
  assert.deepEqual([...added], ["a", "b"]);
  assert.deepEqual([...toggleSelection(added, "a")], ["b"]);
});

test("static site publishing includes Plugin Hub and its browser module", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "ocode-plugin-hub-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "docs"));
  await mkdir(join(root, "assets"));
  for (const [path, content] of [
    ["index.html", "home"], ["plugin-hub.html", "hub"], ["plugin-hub.js", "module"],
    ["README.md", "readme"], ["docs/guide.md", "guide"], ["assets/logo.svg", "logo"],
  ]) await writeFile(join(root, path), content);
  await prepareSite(root);
  assert.equal(await readFile(join(root, "_site", "plugin-hub.html"), "utf8"), "hub");
  assert.equal(await readFile(join(root, "_site", "plugin-hub.js"), "utf8"), "module");
});
