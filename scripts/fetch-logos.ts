// Fetches an official icon for each tool that has no Simple Icons glyph, and stores it in data/logos/.
// Order: the tool's own site (SVG icon, then apple-touch-icon, then the largest PNG icon), then the
// GitHub owner's avatar for tools hosted on GitHub. Sources are recorded in data/logos/sources.yml.
// Usage: npx tsx scripts/fetch-logos.ts [slug ...]   (no slugs = every tool without a logo)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import { findRoot, loadTools } from "../lib/data.ts";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const root = findRoot();
const dir = join(root, "data", "logos");
mkdirSync(dir, { recursive: true });
const sourcesPath = join(dir, "sources.yml");
const sources: Record<string, { url: string; fetched: string }> = existsSync(sourcesPath)
  ? (parse(readFileSync(sourcesPath, "utf8")) ?? {})
  : {};

/** Overrides where the homepage icon is missing, generic, or the tool lives on GitHub. */
const OVERRIDES: Record<string, string[]> = {
  "codex-cli": ["https://github.com/openai.png?size=128"],
  gitleaks: ["https://github.com/gitleaks.png?size=128"],
  goose: ["https://github.com/aaif-goose.png?size=128", "https://github.com/block.png?size=128"],
  "kiro-cli": ["https://kiro.dev/icon.svg"],
  aider: ["https://aider.chat/assets/icons/apple-touch-icon.png", "https://github.com/Aider-AI.png?size=128"],
  "auth-js": ["https://github.com/nextauthjs.png?size=128"],
  playwright: ["https://playwright.dev/img/playwright-logo.svg"],
  same: ["https://same.new/apple-touch-icon.png", "https://same.new/icon.png", "https://same.new/favicon.png", "https://same.new/favicon.svg"],
  rocket: ["https://www.rocket.new/favicon.svg", "https://www.rocket.new/icon.svg", "https://www.rocket.new/favicon.png", "https://www.rocket.new/icon.png"],
};

const typeOf = (contentType: string, url: string) => {
  if (/svg/.test(contentType) || /\.svg(\?|$)/.test(url)) return "svg";
  if (/png/.test(contentType) || /\.png(\?|$)/.test(url)) return "png";
  if (/jpe?g/.test(contentType)) return "jpg";
  if (/webp/.test(contentType)) return "webp";
  if (/icon|ico/.test(contentType) || /\.ico(\?|$)/.test(url)) return "ico";
  return null;
};

async function get(url: string): Promise<{ type: string; body: Buffer } | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/*,*/*" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const body = Buffer.from(await res.arrayBuffer());
    const type = typeOf(res.headers.get("content-type") ?? "", res.url);
    if (!type || body.length < 100) return null;
    if (type === "svg" && !body.toString("utf8", 0, 2000).includes("<svg")) return null;
    // Some servers answer missing files with an HTML page labelled as an image; check the real bytes
    const magic: Record<string, (b: Buffer) => boolean> = {
      png: (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
      jpg: (b) => b[0] === 0xff && b[1] === 0xd8,
      webp: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
    };
    if (magic[type] && !magic[type]!(body)) return null;
    return { type, body };
  } catch {
    return null;
  }
}

/** Icon candidates from a page's <link rel="icon"> tags, best first. */
async function candidatesFor(siteUrl: string): Promise<string[]> {
  const origin = new URL(siteUrl).origin;
  let html = "";
  try {
    const res = await fetch(siteUrl, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    html = await res.text();
  } catch {
    // fall back to well-known paths
  }
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const found: { href: string; score: number }[] = [];
  for (const tag of links) {
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
    if (!/icon/.test(rel) || /mask-icon/.test(rel)) continue;
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href || href.startsWith("data:")) continue;
    const sizes = Number(tag.match(/sizes=["'](\d+)x\d+["']/i)?.[1] ?? 0);
    const isSvg = /\.svg(\?|$)/i.test(href) || /svg/i.test(tag.match(/type=["']([^"']+)["']/i)?.[1] ?? "");
    const isApple = rel.includes("apple-touch-icon");
    found.push({ href: new URL(href, siteUrl).toString(), score: (isSvg ? 1000 : 0) + (isApple ? 500 : 0) + sizes });
  }
  found.sort((a, b) => b.score - a.score);
  return [...found.map((f) => f.href), `${origin}/apple-touch-icon.png`, `${origin}/favicon.svg`, `${origin}/favicon.ico`];
}

const today = new Date().toISOString().slice(0, 10);
const only = process.argv.slice(2);
const tools = loadTools(root).filter((t) => !t.icon && (only.length ? only.includes(t.slug) : true));
const existing = new Set(readdirSync(dir).map((f) => f.replace(/\.[a-z]+$/, "")));
const failed: string[] = [];

for (const tool of tools) {
  if (!only.length && existing.has(tool.slug)) continue;
  const urls = [...(OVERRIDES[tool.slug] ?? []), ...(await candidatesFor(tool.url))];
  let saved = false;
  for (const url of urls) {
    const icon = await get(url);
    if (!icon || icon.type === "ico") continue; // .ico files are often 16px; only use as a last resort
    writeFileSync(join(dir, `${tool.slug}.${icon.type}`), icon.body);
    sources[tool.slug] = { url, fetched: today };
    console.log(`${tool.slug.padEnd(16)} ${icon.type.padEnd(4)} ${url}`);
    saved = true;
    break;
  }
  if (!saved) {
    failed.push(tool.slug);
    console.log(`${tool.slug.padEnd(16)} NONE`);
  }
}

const sorted = Object.fromEntries(Object.entries(sources).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(sourcesPath, `# Where each logo in this folder came from. Written by scripts/fetch-logos.ts.\n# Logos are trademarks of their owners and are used only to identify each tool.\n${stringify(sorted)}`);
if (failed.length) console.log(`\nNo usable icon found for: ${failed.join(", ")}`);
