import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadAll } from "../lib/data.ts";
import { githubAnchor, replaceSection, sectionNames } from "../lib/render.ts";
import { buildReadme } from "../scripts/generate.ts";
import { repoRoot, tempRepo } from "./helpers.ts";

const readme = () => readFileSync(join(repoRoot, "README.md"), "utf8");

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

describe("README generator", () => {
  let repo: ReturnType<typeof tempRepo> | undefined;
  afterEach(() => repo?.cleanup());

  it("is up to date with the data", () => {
    const current = readme();
    expect(buildReadme(loadAll(repoRoot), current)).toBe(current);
  });

  it("reproduces the data sections of the hand-written README", () => {
    const before = readFileSync(join(repoRoot, "tests/fixtures/readme-before.md"), "utf8");
    const generated = buildReadme(loadAll(repoRoot), readme());
    for (const heading of ["## Tools by category", "## Free tools and free tiers", "## Pricing at a glance", "## Which tool for which job"]) {
      const pick = (doc: string) => normalize(doc.split(heading)[1]!.split("\n## ")[0]!);
      expect(pick(generated), heading).toBe(pick(before));
    }
    const guide = (doc: string) => normalize(doc.split("### 1. Before you build")[1]!.split("**Stuck?")[0]!);
    expect(guide(generated)).toBe(guide(before));
  });

  it("goes stale when the data changes and recovers after regenerating", () => {
    repo = tempRepo();
    const current = readme();
    const bolt = join(repo.root, "data/tools/bolt.yml");
    const text = readFileSync(bolt, "utf8");
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
    const regenerated = buildReadme(loadAll(repo.root), current);
    expect(outside(regenerated)).toBe(outside(current));
  });

  it("has every expected section", () => {
    expect(sectionNames(readme())).toEqual(expect.arrayContaining(["badges", "tools", "free-tiers", "pricing", "jobs", "guide"]));
  });

  it("refuses a README without markers", () => {
    expect(() => replaceSection("no markers here", "tools", "x")).toThrow(/missing/);
  });

  it("builds GitHub-style anchors", () => {
    expect(githubAnchor("Testing, security and monitoring")).toBe("testing-security-and-monitoring");
    expect(githubAnchor("3. Before you launch")).toBe("3-before-you-launch");
    expect(githubAnchor("🧰 Tools by category")).toBe("-tools-by-category");
  });
});
