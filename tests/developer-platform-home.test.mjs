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
  assert.match(html, /assets\\/OCODEJS_app_icon\\.png/);
  assert.match(html, /assets\\/OCODEJS_logo_O_round\\.png/);
  assert.match(html, /assets\\/OCODEJS_design_01\\.png/);
  assert.match(html, /assets\\/OCODEJS_design_02_fixed\\.png/);
  assert.match(html, /assets\\/OCODEJS_design_04\\.png/);
  assert.match(html, /id="brand-assets"/);
  assert.match(html, /class="asset-gallery"/);
  assert.match(html, /class="brand-mark" aria-hidden="true"/);
  assert.match(html, /\.nav-actions\{margin-left:auto\}/);
  assert.match(html, /\.asset-gallery\{grid-template-columns:1fr\}/);
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
