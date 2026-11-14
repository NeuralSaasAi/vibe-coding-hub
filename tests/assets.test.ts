import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { loadAll } from "../lib/data.ts";
import { buildOutputs, strayFiles } from "../scripts/generate.ts";
import { repoRoot } from "./helpers.ts";

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const svgs = walk(join(repoRoot, "assets")).filter((p) => p.endsWith(".svg"));

describe("generated images", () => {
  it("match the generator output exactly", () => {
    const data = loadAll(repoRoot);
    const outputs = buildOutputs(data);
    for (const out of outputs) {
      expect(readFileSync(join(repoRoot, out.path), "utf8"), out.path).toBe(out.content);
    }
    expect(strayFiles(repoRoot, outputs)).toEqual([]);
  });

  it("include one logo per tool, one card per category and one image per stage", () => {
    const data = loadAll(repoRoot);
    const rel = svgs.map((p) => relative(repoRoot, p));
    expect(rel.filter((p) => p.startsWith("assets/logos/"))).toHaveLength(data.tools.length);
    expect(rel.filter((p) => p.startsWith("assets/cards/"))).toHaveLength(data.categories.length);
    expect(rel.filter((p) => p.startsWith("assets/roadmap/"))).toHaveLength(data.guide.length);
  });

  it.each(svgs.map((p) => [relative(repoRoot, p), p]))("%s is valid SVG with a title and description", (_, path) => {
    const text = readFileSync(path, "utf8");
    expect(XMLValidator.validate(text)).toBe(true);
    expect(text).toMatch(/<svg [^>]*role="img"/);
    expect(text).toMatch(/<title[^>]*>[^<]+<\/title>/);
    expect(text).toMatch(/<desc[^>]*>[^<]+<\/desc>/);
    expect(text).not.toMatch(/<script|@import|url\(http/i);
  });
});

describe("README images", () => {
  const readme = readFileSync(join(repoRoot, "README.md"), "utf8");

  it("all have alt text", () => {
    const imgs = [...readme.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    expect(imgs.length).toBeGreaterThan(80);
    expect(imgs.filter((i) => !/alt="[^"]+"/.test(i))).toEqual([]);
    expect([...readme.matchAll(/!\[\]\(/g)]).toHaveLength(0);
  });

  it("only point at local files that exist", () => {
    const local = [...readme.matchAll(/(?:src|srcset)="(assets\/[^"]+)"/g)].map((m) => m[1]!);
    for (const path of local) expect(() => statSync(join(repoRoot, path)), path).not.toThrow();
  });
});
