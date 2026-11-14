import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { afterEach, describe, expect, it } from "vitest";
import { refreshStars, type RepoInfo } from "../scripts/refresh-stars.ts";
import { tempRepo } from "./helpers.ts";

const info = (repo: string, stars: number, extra: Partial<RepoInfo> = {}): RepoInfo => ({
  full_name: repo,
  stargazers_count: stars,
  pushed_at: "2026-11-10T08:00:00Z",
  archived: false,
  ...extra,
});

describe("refresh-stars", () => {
  let repo: ReturnType<typeof tempRepo>;
  afterEach(() => repo?.cleanup());

  it("writes only stars and last_commit, leaving the rest of the file untouched", async () => {
    repo = tempRepo();
    const file = join(repo.root, "data/tools/supabase.yml");
    const before = parse(readFileSync(file, "utf8"));
    const result = await refreshStars(repo.root, async (r) => info(r, 123456));
    const after = parse(readFileSync(file, "utf8"));
    expect(after.stars).toBe(123456);
    expect(after.last_commit).toBe("2026-11-10");
    const strip = ({ stars, last_commit, ...rest }: Record<string, unknown>) => rest;
    expect(strip(after)).toEqual(strip(before));
    expect(result.updated).toContain("supabase");
    expect(result.updated).not.toContain("lovable"); // no repo
  });

  it("reports nothing to do on a second run with the same numbers", async () => {
    repo = tempRepo();
    const fetcher = async (r: string) => info(r, 42);
    await refreshStars(repo.root, fetcher);
    const second = await refreshStars(repo.root, fetcher);
    expect(second.updated).toEqual([]);
    expect(second.unchanged.length).toBeGreaterThan(10);
  });

  it("keeps going when a repo fails, and flags archived or moved repos", async () => {
    repo = tempRepo();
    const aiderBefore = readFileSync(join(repo.root, "data/tools/aider.yml"), "utf8");
    const result = await refreshStars(repo.root, async (r) => {
      if (r === "aider-ai/aider" || r === "Aider-AI/aider") return null;
      if (r === "gitleaks/gitleaks") return info(r, 1, { archived: true });
      if (r === "cline/cline") return info("cline-org/cline", 1);
      return info(r, 1);
    });
    expect(result.failed).toEqual(["aider"]);
    expect(result.archived).toEqual(["gitleaks"]);
    expect(result.moved).toEqual([{ slug: "cline", from: "cline/cline", to: "cline-org/cline" }]);
    // A failed fetch leaves the file exactly as it was
    expect(readFileSync(join(repo.root, "data/tools/aider.yml"), "utf8")).toBe(aiderBefore);
  });
});
