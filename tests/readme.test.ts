import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadAll, loadTools } from "../lib/data.ts";
import { githubAnchor, replaceSection, sectionNames, splitFeatured, toolLine } from "../lib/render.ts";
import { buildReadme } from "../scripts/generate.ts";
import { repoRoot, tempRepo } from "./helpers.ts";

const readme = () => readFileSync(join(repoRoot, "README.md"), "utf8");
const before = () => readFileSync(join(repoRoot, "tests/fixtures/readme-before.md"), "utf8");

/** Drops markers, collapses whitespace and sorts inline tags, so only content is compared. */
const normalize = (text: string) =>
  text
    .replace(/<!-- (BEGIN|END):[a-z0-9:-]+ -->/g, "")
    .replace(/`Open source` `Free tier`/g, "`Free tier` `Open source`")
    .replace(/\s+/g, " ")
    .trim();

/** Text outside the generated sections. */
const outside = (text: string) =>
  text.replace(/<!-- BEGIN:([a-z0-9:-]+) -->[\s\S]*?<!-- END:\1 -->/g, "<!-- SECTION:$1 -->");

/** The section under a heading, up to the next H2. Matches with or without a leading emoji. */
const section = (doc: string, title: string) => {
  const match = doc.match(new RegExp(`\\n## (?:\\S+ )?${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n([\\s\\S]*?)(?=\\n## |$)`));
  if (!match) throw new Error(`no section ${title}`);
  return match[1]!;
};

const toolLines = (text: string) =>
  text
    .split("\n")
    .filter((l) => l.startsWith("- ["))
    .map((l) => normalize(l))
    .sort();

describe("README generator", () => {
  let repo: ReturnType<typeof tempRepo> | undefined;
  afterEach(() => repo?.cleanup());

  it("is up to date with the data", () => {
    const current = readme();
    expect(buildReadme(loadAll(repoRoot), current)).toBe(current);
  });

  it("keeps every tool from the hand-written README", () => {
    const generated = section(readme(), "Tools by category");
    expect(toolLines(generated)).toEqual(toolLines(section(before(), "Tools by category")));
  });

  it("reproduces the free tier, pricing and jobs tables", () => {
    const table = (text: string) => normalize(text.split("\n").filter((l) => l.startsWith("|")).join("\n"));
    for (const title of ["Free tools and free tiers", "Pricing at a glance", "Which tool for which job"]) {
      expect(table(section(readme(), title)), title).toBe(table(section(before(), title)));
    }
  });

  it("reproduces the guide text", () => {
    const strip = (doc: string) =>
      normalize(
        doc
          .split("### 1. Before you build")[1]!
          .split("**Stuck?")[0]!
          .replace(/```mermaid[\s\S]*?```/g, "")
          .replace(/^Prefer a step-by-step view\?.*$/m, ""),
      );
    expect(strip(readme())).toBe(strip(before()));
  });

  it("shows three picks per category and hides the rest in a details block", () => {
    const tools = loadTools(repoRoot);
    const builders = tools.filter((t) => t.category === "ai-app-builders").sort((a, b) => a.name.localeCompare(b.name));
    const { top, rest } = splitFeatured(builders);
    expect(top.map((t) => t.slug)).toEqual(["bolt", "lovable", "replit"]);
    const text = section(readme(), "Tools by category");
    const visible = text.split("<details>")[0]!;
    for (const t of top) expect(visible).toContain(toolLine(t));
    for (const t of rest) expect(visible).not.toContain(toolLine(t));
  });

  it("goes stale when the data changes and recovers after regenerating", () => {
    repo = tempRepo();
    const current = readme();
    const text = readFileSync(join(repo.root, "data/tools/bolt.yml"), "utf8");
    repo.write("data/tools/bolt.yml", text.replace("entry: Pro $25 (10M tokens)", "entry: Pro $29 (10M tokens)"));
    const regenerated = buildReadme(loadAll(repo.root), current);
    expect(regenerated).not.toBe(current);
    expect(regenerated).toContain("Pro $29 (10M tokens)");
    expect(buildReadme(loadAll(repo.root), regenerated)).toBe(regenerated);
  });

  it("never touches text outside the markers", () => {
    repo = tempRepo();
    const current = readme();
    repo.write("data/tools/zed.yml", readFileSync(join(repoRoot, "data/tools/zed.yml"), "utf8").replace("Fast editor", "Very fast editor"));
    expect(outside(buildReadme(loadAll(repo.root), current))).toBe(outside(current));
  });

  it("has every expected section", () => {
    expect(sectionNames(readme())).toEqual(
      expect.arrayContaining([
        "badges", "glance", "gallery", "roadmap", "tools", "free-tiers",
        "pricing", "jobs", "guide", "recently-verified", "diagram:contribute",
      ]),
    );
  });

  it("refuses a README without markers", () => {
    expect(() => replaceSection("no markers here", "tools", "x")).toThrow(/missing/);
  });

  it("builds GitHub-style anchors", () => {
    expect(githubAnchor("Testing, security and monitoring")).toBe("testing-security-and-monitoring");
    expect(githubAnchor("3. Before you launch")).toBe("3-before-you-launch");
    expect(githubAnchor("🧰 Tools by category")).toBe("-tools-by-category");
    expect(githubAnchor("🔭 What's next")).toBe("-whats-next");
  });

  it("links every internal anchor to a heading or id that exists", () => {
    const doc = readme();
    const anchors = new Set([
      ...[...doc.matchAll(/^#{1,6} (.+)$/gm)].map((m) => githubAnchor(m[1]!)),
      ...[...doc.matchAll(/<a id="([^"]+)"/g)].map((m) => m[1]!),
    ]);
    const links = [...doc.matchAll(/(?:\]\(|href=")#([^)"]+)/g)].map((m) => m[1]!);
    const broken = [...new Set(links.filter((l) => !anchors.has(l)))];
    expect(broken).toEqual([]);
  });
});
