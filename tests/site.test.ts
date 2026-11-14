import { describe, expect, it } from "vitest";
import { loadAll } from "../lib/data.ts";
import { recommend } from "../lib/recommend.ts";
import { emptyState, matches, parseState, toSearch } from "../site/src/lib/filter.ts";
import { isStale, monthEnd, sortRows } from "../site/src/lib/pricing.ts";
import { joinBase } from "../site/src/lib/url.ts";
import { repoRoot } from "./helpers.ts";

const data = loadAll(repoRoot);

describe("joinBase", () => {
  it("joins with a repo base path", () => {
    expect(joinBase("/vibe-coding-hub", "/tools")).toBe("/vibe-coding-hub/tools");
    expect(joinBase("/vibe-coding-hub/", "tools?free=1")).toBe("/vibe-coding-hub/tools?free=1");
    expect(joinBase("/vibe-coding-hub", "/roadmap#after-launch")).toBe("/vibe-coding-hub/roadmap#after-launch");
    expect(joinBase("/vibe-coding-hub", "/")).toBe("/vibe-coding-hub/");
  });
  it("joins without a base path, for a custom domain", () => {
    expect(joinBase("/", "/tools")).toBe("/tools");
    expect(joinBase("/", "/")).toBe("/");
    expect(joinBase("", "pricing")).toBe("/pricing");
  });
  it("leaves absolute links alone", () => {
    expect(joinBase("/x", "https://neuralsaasai.com")).toBe("https://neuralsaasai.com");
    expect(joinBase("/x", "#top")).toBe("#top");
  });
});

describe("tool filters", () => {
  const tools = data.tools;
  const run = (search: string) => tools.filter((t) => matches(t, parseState(search))).map((t) => t.slug);

  it("filters by category", () => {
    expect(run("?category=cli-agents")).toEqual(tools.filter((t) => t.category === "cli-agents").map((t) => t.slug));
  });
  it("combines category and toggles", () => {
    const expected = tools.filter((t) => t.category === "ai-app-builders" && t.free_tier).map((t) => t.slug);
    expect(run("?category=ai-app-builders&free=1")).toEqual(expected);
    expect(run("?open=1&free=1")).toEqual(tools.filter((t) => t.open_source && t.free_tier).map((t) => t.slug));
  });
  it("searches name and description, all words, any case", () => {
    expect(run("?q=SUPABASE")).toContain("supabase");
    expect(run("?q=row level security")).toEqual(["supabase"]);
    expect(run("?q=nothing-matches-this")).toEqual([]);
  });
  it("limits to explicit ids", () => {
    expect(run("?ids=bolt,stripe")).toEqual(["bolt", "stripe"]);
  });
  it("round-trips through the URL", () => {
    const state = { category: "ui-design", free: true, open: false, q: "react", ids: [] };
    expect(parseState(toSearch(state))).toEqual(state);
    expect(toSearch(emptyState())).toBe("");
  });
});

describe("pricing rules", () => {
  it("counts a month as fresh until its last day", () => {
    expect(monthEnd("2026-11").toISOString()).toBe("2026-11-30T23:59:59.000Z");
    expect(isStale("2026-11", new Date("2027-01-20T00:00:00Z"))).toBe(false);
    expect(isStale("2026-11", new Date("2027-02-01T00:00:00Z"))).toBe(true);
    expect(isStale("2026-08", new Date("2026-11-14T00:00:00Z"))).toBe(true);
  });
  it("sorts by price, name and date", () => {
    const rows = [
      { name: "B", entry_usd: 20, verified: "2026-10" },
      { name: "A", entry_usd: 8, verified: "2026-11" },
      { name: "C", entry_usd: null, verified: "2026-09" },
    ];
    expect(sortRows(rows, "price").map((r) => r.name)).toEqual(["A", "B", "C"]);
    expect(sortRows(rows, "price", "desc").map((r) => r.name)).toEqual(["C", "B", "A"]);
    expect(sortRows(rows, "name").map((r) => r.name)).toEqual(["A", "B", "C"]);
    expect(sortRows(rows, "verified", "desc").map((r) => r.name)).toEqual(["A", "B", "C"]);
  });
});

describe("which-tool recommendations", () => {
  const { jobs } = data;
  it("reaches a result for every combination, naming only real tools", () => {
    const slugs = new Set(data.tools.map((t) => t.slug));
    for (const job of jobs.jobs)
      for (const coding of jobs.questions.coding)
        for (const budget of jobs.questions.budget) {
          const rec = recommend(jobs, data.tools, { job: job.id, coding: coding.id, budget: budget.id });
          expect(rec.picks.length, `${job.id}/${coding.id}/${budget.id}`).toBeGreaterThan(0);
          for (const s of rec.slugs) expect(slugs).toContain(s);
        }
  });
  it("sends a non-coder building a SaaS MVP to Lovable or Bolt with Supabase and Stripe", () => {
    const rec = recommend(jobs, data.tools, { job: "saas-mvp", coding: "none", budget: "any" });
    expect(rec.picks.map((t) => t.slug)).toEqual(["lovable", "bolt", "supabase", "stripe"]);
  });
  it("keeps free picks first on a free budget", () => {
    const rec = recommend(jobs, data.tools, { job: "saas-mvp", coding: "none", budget: "free" });
    expect(rec.picks.every((t) => t.free_tier || t.open_source)).toBe(true);
    expect(rec.also.map((t) => t.slug)).toContain("stripe");
  });
  it("adds AI IDEs for developers", () => {
    const rec = recommend(jobs, data.tools, { job: "mobile-app", coding: "developer", budget: "any" });
    expect(rec.also.map((t) => t.slug)).toContain("cursor");
  });
});
