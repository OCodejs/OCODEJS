import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const html = readFileSync(resolve(root, "index.html"), "utf8");
const body = html.match(/<body\\b[^>]*>([\\s\\S]*?)<\\/body>/i)?.[1] ?? "";

function attributes(markup) {
  return Object.fromEntries([...markup.matchAll(/([\\w:-]+)\\s*=\\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map((match) => [match[1].toLowerCase(), match[2] ?? match[3]]));
}

function elements(tag, markup = body) {
  return [...markup.matchAll(new RegExp(`<${tag}\\\\b([^>]*)>([\\\\s\\\\S]*?)<\\\\/${tag}\\\\s*>`, "gi"))]
    .map((match) => ({ attributes: attributes(match[1]), content: match[2] }));
}

function text(markup) {
  return markup.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/\\s+/g, " ").trim();
}

test("documentation homepage declares Vietnamese, responsive metadata and project title", () => {
  assert.match(html, /^\\s*<!doctype html>/i);
  assert.match(html, /<html\\b[^>]*\\blang=["']vi["']/i);
  const meta = [...html.matchAll(/<meta\\b([^>]*)>/gi)].map((match) => attributes(match[1]));
  assert.ok(meta.some((entry) => entry.charset?.toLowerCase() === "utf-8"));
  assert.equal(meta.find((entry) => entry.name === "viewport")?.content, "width=device-width,initial-scale=1");
  assert.equal(meta.find((entry) => entry.name === "theme-color")?.content, "#000000");
  assert.match(meta.find((entry) => entry.name === "description")?.content ?? "", /OCode\\.js/);
  assert.match(html.match(/<title[^>]*>([\\s\\S]*?)<\\/title>/i)?.[1] ?? "", /OCode\\.js/);
});

test("homepage has one semantic header, main landmark, footer and primary heading", () => {
  assert.equal(elements("header").length, 1);
  assert.equal(elements("main").length, 1);
  assert.equal(elements("footer").length, 1);
  assert.equal(elements("h1").length, 1);
  assert.equal(attributes(html.match(/<main\\b([^>]*)>/i)?.[1] ?? "").id, "top");
  assert.match(text(elements("h1")[0].content), /Small tools\\.\\s*Solid foundations\\./);
});

test("documentation sections and accessible navigation targets exist", () => {
  const ids = [...body.matchAll(/<[a-z][\\w:-]*\\b([^>]*)>/gi)]
    .map((match) => attributes(match[1]).id).filter((id) => id !== undefined);
  assert.equal(new Set(ids).size, ids.length, "IDs must be unique");
  for (const id of ["top", "guide", "architecture", "agent-skills", "openai-plugins", "x-bo", "api", "forms"]) {
    assert.ok(ids.includes(id), `Missing documentation target: ${id}`);
  }
  const navs = elements("nav");
  assert.ok(navs.length >= 2);
  for (const nav of navs) assert.ok(nav.attributes["aria-label"]?.trim(), "Every navigation landmark needs an accessible name");
});

test("all fragment links resolve and all links have accessible names and safe schemes", () => {
  for (const link of elements("a")) {
    const href = link.attributes.href;
    assert.ok(href?.trim(), "Every link must have a destination");
    assert.ok(link.attributes["aria-label"]?.trim() || text(link.content), `Unnamed link: ${href}`);
    assert.doesNotMatch(href, /^(?:javascript|data):/i);
    if (href.startsWith("#")) assert.ok(body.includes(`id="${decodeURIComponent(href.slice(1))}"`), `Broken fragment: ${href}`);
  }
});

test("local documentation and project assets referenced by the homepage exist", () => {
  for (const link of elements("a")) {
    const href = link.attributes.href;
    if (href.startsWith("#") || /^[a-z][\\w+.-]*:/i.test(href)) continue;
    const pathname = decodeURIComponent(href.split(/[?#]/, 1)[0]);
    const target = resolve(root, pathname);
    assert.ok(existsSync(target), `Missing local link target: ${href}`);
  }
  for (const image of [...body.matchAll(/<img\\b([^>]*)>/gi)]) {
    const attrs = attributes(image[1]);
    assert.ok(attrs.alt !== undefined, "Images must provide alt text");
  }
});

test("all source repository links point to the canonical OCodejs repository", () => {
  const repositoryLinks = elements("a").filter((link) => link.attributes.href?.includes("github.com/"));
  assert.ok(repositoryLinks.some((link) => link.attributes.href === "https://github.com/OCodejs/OCodejs"));
});

test("homepage styles are present, dark-themed and responsive", () => {
  const styles = [...html.matchAll(/<style\\b[^>]*>([\\s\\S]*?)<\\/style>/gi)].map((match) => match[1]);
  assert.ok(styles.length >= 1);
  const css = styles.join("\\n");
  assert.match(css, /color-scheme\\s*:\\s*dark/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\\s*\\(max-width:/);
});

test("chat assistant is initially hidden and has explicit accessible controls", () => {
  const panel = html.match(/<section\\b([^>]*id=["']ocode-chat-panel["'][^>]*)>/i);
  const launcher = html.match(/<button\\b([^>]*id=["']ocode-chat-launcher["'][^>]*)>/i);
  assert.ok(panel);
  assert.ok(launcher);
  assert.equal(attributes(panel[1])["aria-hidden"], "true");
  assert.equal(attributes(launcher[1])["aria-expanded"], "false");
  assert.ok(attributes(launcher[1])["aria-controls"] === "ocode-chat-panel");
});
