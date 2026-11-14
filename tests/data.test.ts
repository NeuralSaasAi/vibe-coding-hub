import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DataError, loadAll, loadJobs, loadTools, stats } from "../lib/data.ts";
import { repoRoot, tempRepo } from "./helpers.ts";

const valid = `name: Example
url: https://example.com
category: ai-app-builders
description: An example tool used only in tests.
free_tier: false
open_source: false
`;

describe("repo data", () => {
  it("has the migrated counts", () => {
    const data = loadAll(repoRoot);
    const s = stats(data.tools);
    expect(s.tools).toBe(69);
    expect(s.categories).toBe(8);
    expect(s.freeTiers).toBe(18);
    expect(s.prices).toBe(16);
    expect(data.jobs.jobs).toHaveLength(6);
    expect(data.guide.map((g) => g.id)).toEqual([
      "before-you-build",
      "while-you-build",
      "before-you-launch",
      "when-something-breaks",
      "after-launch",
    ]);
  });

  it("names only existing tools in jobs", () => {
    const tools = loadTools(repoRoot);
    const slugs = new Set(tools.map((t) => t.slug));
    for (const job of loadJobs(repoRoot, tools).jobs) {
      for (const s of [...job.first_pick, ...job.also_consider]) expect(slugs).toContain(s);
    }
  });

  it("marks every priced tool with a chart value", () => {
    for (const tool of loadTools(repoRoot).filter((t) => t.pricing)) {
      expect(tool.pricing?.entry_usd, tool.slug).toBeTypeOf("number");
    }
  });

  it("keeps the free tier tag and free tier details consistent", () => {
    // A tool can be in the free-tier table without the tag only when the free part
    // is a different product (Claude's free chat does not include Claude Code).
    const untagged = loadTools(repoRoot)
      .filter((t) => t.free_details && !t.free_tier)
      .map((t) => t.slug);
    expect(untagged).toEqual(["claude-code"]);
  });
});

describe("schema rejects bad data", () => {
  let repo: ReturnType<typeof tempRepo>;
  afterEach(() => repo?.cleanup());

  const expectProblem = (pattern: RegExp) => {
    try {
      loadTools(repo.root);
    } catch (error) {
      expect(error).toBeInstanceOf(DataError);
      expect((error as DataError).problems.join("\n")).toMatch(pattern);
      return;
    }
    throw new Error("expected loadTools to fail");
  };

  it("accepts a valid new tool", () => {
    repo = tempRepo();
    repo.write("data/tools/example.yml", valid);
    expect(loadTools(repo.root).some((t) => t.slug === "example")).toBe(true);
  });

  it("rejects a missing url", () => {
    repo = tempRepo();
    repo.write("data/tools/example.yml", valid.replace("url: https://example.com\n", ""));
    expectProblem(/example\.yml: url/);
  });

  it("rejects a non-https url", () => {
    repo = tempRepo();
    repo.write("data/tools/example.yml", valid.replace("https://", "http://"));
    expectProblem(/example\.yml: url must be a full https/);
  });

  it("rejects an unknown category", () => {
    repo = tempRepo();
    repo.write("data/tools/example.yml", valid.replace("ai-app-builders", "toys"));
    expectProblem(/example\.yml: category/);
  });

  it("rejects a malformed last_verified month", () => {
    repo = tempRepo();
    const priced = `${valid}pricing:
  free_plan: "No"
  entry: Pro $10
  higher: None
  unit: Seats
  sources:
    - label: Pricing
      url: https://example.com/pricing
  last_verified: "Nov 2026"
`;
    repo.write("data/tools/example.yml", priced);
    expectProblem(/example\.yml: pricing\.last_verified must be a month in YYYY-MM/);
  });

  it("rejects a duplicate tool", () => {
    repo = tempRepo();
    const bolt = readFileSync(join(repo.root, "data/tools/bolt.yml"), "utf8");
    repo.write("data/tools/bolt-copy.yml", bolt);
    expectProblem(/bolt(-copy)?\.yml: same url as data\/tools\/bolt(-copy)?\.yml/);
  });

  it("rejects unknown fields so typos are caught", () => {
    repo = tempRepo();
    repo.write("data/tools/example.yml", `${valid}freetier: true\n`);
    expectProblem(/example\.yml/);
  });

  it("rejects a job that names a missing tool", () => {
    repo = tempRepo();
    const jobs = readFileSync(join(repo.root, "data/jobs.yml"), "utf8");
    repo.write("data/jobs.yml", jobs.replace("first_pick: [framer, v0]", "first_pick: [framer, nope]"));
    expect(() => loadJobs(repo.root)).toThrow(/unknown tool "nope"/);
  });
});
