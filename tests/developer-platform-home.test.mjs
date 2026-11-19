import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { prepareSite } from "../scripts/prepare-site.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const html = await readFile(resolve(root, "home/index.html"), "utf8");
const expectedGroups = [
  "agent-stack", "core-platform", "platform-security", "developer-tools", "frameworks",
  "sdks", "build-solutions", "learn-community", "explore", "company-trust",
];

test("Developer Platform Home has canonical metadata and one semantic main heading", () => {
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/ocodejs\.dev\/home">/);
  assert.match(html, /<meta name="viewport" content="width=device-width,initial-scale=1">/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /OCodeJS Developer Platform/);
});

test("home uses canonical monorepo logo and brand artwork assets", () => {
  for (const asset of [
    "OCODEJS_app_icon.png",
    "OCODEJS_logo_O_round.png",
    "OCODEJS_design_01.png",
    "OCODEJS_design_02_fixed.png",
    "OCODEJS_design_04.png",
  ]) assert.ok(html.includes("assets/" + asset), "Missing monorepo asset reference: " + asset);
  assert.ok(html.includes('id="brand-assets"'));
  assert.ok(html.includes('class="asset-gallery"'));
  assert.ok(html.includes('class="brand-mark" aria-hidden="true"'));
  assert.ok(html.includes(".nav-actions{margin-left:auto}"));
  assert.ok(html.includes(".asset-gallery{grid-template-columns:1fr}"));
});

test("all ten product taxonomy groups are present exactly once", () => {
  for (const id of expectedGroups) {
    const matches = html.match(new RegExp('id="' + id + '"', "g")) || [];
    assert.equal(matches.length, 1, "Expected one taxonomy group: " + id);
  }
  assert.equal((html.match(/class="tile"/g) || []).length, 10);
});

test("search, category filters and mobile navigation expose accessible state", () => {
  assert.match(html, /id="catalog-search" type="search"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /aria-controls="site-nav" aria-expanded="false"/);
  assert.match(html, /@media\(max-width:760px\)/);
  assert.match(html, /\.search\{font-size:16px\}/, "Mobile search text must prevent iOS focus zoom");
  assert.match(html, /border-radius:0/);
});

test("mobile navigation has accessible touch target, escape handling and ordered sections", () => {
  assert.match(html, /\.menu-toggle\{[^}]*width:44px;height:44px;min-width:44px;min-height:44px;/);
  assert.match(html, /event\.key === "Escape"/);
  assert.match(html, /if \(restoreFocus\) toggle\.focus\(\)/);
  const indexes = [...html.matchAll(/class="section-index">([^<]+)/g)].map((match) => match[1]);
  assert.deepEqual(indexes, [
    "02 / PRODUCT MAP",
    "03 / WORKSPACE",
    "04 / VISUAL IDENTITY",
    "05 / DESIGN PRINCIPLES",
  ]);
});

test("catalog links use safe protocols and descriptive labels", () => {
  const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
  assert.ok(links.length >= 20);
  for (const [, attrs, content] of links) {
    const href = attrs.match(/href="([^"]+)"/)?.[1];
    assert.ok(href, "Every anchor must have an href");
    assert.doesNotMatch(href, /^(?:javascript|data):/i);
    if (/target="_blank"/.test(attrs)) assert.match(attrs, /rel="noopener noreferrer"/);
    assert.ok(content.replace(/<[^>]*>/g, "").trim(), "Every link must have an accessible name");
  }
});

test("Node pages server serves /home and /home/ from the root home document", async (t) => {
  const probe = createServer();
  await new Promise((resolveListen, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolveListen);
  });
  const { port } = probe.address();
  await new Promise((resolveClose, reject) => probe.close((error) => error ? reject(error) : resolveClose()));

  const server = spawn(process.execPath, [resolve(root, "termainl-task/pages/server.mjs")], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  server.stderr.setEncoding("utf8");
  server.stderr.on("data", (chunk) => { stderr += chunk; });
  t.after(() => {
    if (server.exitCode === null && !server.killed) server.kill("SIGTERM");
  });

  let ready = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/home`);
      ready = response.ok;
      if (ready) {
        assert.match(await response.text(), /OCodeJS Developer Platform/);
        break;
      }
    } catch {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
    }
  }
  assert.equal(ready, true, `Pages server did not serve /home. stderr: ${stderr}`);

  const slashResponse = await fetch(`http://127.0.0.1:${port}/home/`);
  assert.equal(slashResponse.status, 200);
  assert.match(await slashResponse.text(), /OCodeJS Developer Platform/);

  const traversalResponse = await fetch(`http://127.0.0.1:${port}/..%2f..%2f..%2f..%2fetc%2fpasswd`);
  assert.equal(traversalResponse.status, 404, "Encoded path traversal must not expose files outside the server root");
});

test("Netlify staging build copies the /home route into the published directory", async () => {
  const fixture = await mkdtemp(resolve(tmpdir(), "ocodejs-home-"));
  try {
    for (const file of ["index.html", "plugin-hub.html", "plugin-hub.js", "README.md"]) {
      await writeFile(resolve(fixture, file), "fixture");
    }
    await mkdir(resolve(fixture, "docs"));
    await mkdir(resolve(fixture, "assets"));
    await mkdir(resolve(fixture, "home"));
    await writeFile(resolve(fixture, "home/index.html"), "developer platform");
    await prepareSite(fixture);
    const published = await readFile(resolve(fixture, "_site/home/index.html"), "utf8");
    assert.equal(published, "developer platform");
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
