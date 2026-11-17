import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PLUGIN_CATALOG, filterPlugins, readInstalled, toggleSelection, writeInstalled } from "../plugin-hub.js";

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

test("storage saves and restores selections", () => {
  let saved = null;
  const storage = { getItem: () => saved, setItem: (_key, value) => { saved = value; } };
  const result = writeInstalled(storage, "plugins", new Set(["a", "b"]));
  assert.equal(result.ok, true);
  assert.deepEqual([...readInstalled(storage, "plugins", ["a", "b"]).installed], ["a", "b"]);
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

test("catalog entries have unique ids and complete integration metadata", () => {
  const ids = PLUGIN_CATALOG.map((plugin) => plugin.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const plugin of PLUGIN_CATALOG) {
    assert.ok(plugin.name);
    assert.ok(["Skills", "MCP", "Integration", "Template"].includes(plugin.type));
    assert.ok(plugin.description);
    assert.ok(Array.isArray(plugin.tags));
    assert.ok(Array.isArray(plugin.steps));
    assert.ok(plugin.note);
  }
});

test("plugin detail dialog closes cleanly and does not reopen after selection changes", async () => {
  const html = await readFile(new URL("../plugin-hub.html", import.meta.url), "utf8");
  assert.match(html, /<dialog id="details"/);
  assert.match(html, /addEventListener\("close",\(\)=>\{activePlugin=null\}\)/);
  assert.match(html, /if\(activePlugin&&\$\("details"\)\.open\)showDetails\(activePlugin\)/);
  assert.match(html, /if\(!\$\("details"\)\.open\)\$\("details"\)\.showModal\(\)/);
});
