import { execFileSync } from "node:child_process";
import { loadAll, stats, toolsInCategory } from "../../../lib/data.ts";
import type { Category, Tool } from "../../../schema/tool.ts";

/** Loaded once per build from ../data and ../content, validated by the shared schema. */
export const hub = loadAll();
export const summary = stats(hub.tools);

export const categoryOf = (tool: Tool): Category => hub.categories.find((c) => c.id === tool.category)!;
export const byCategory = (id: string) => toolsInCategory(hub.tools, id);
export const toolBySlug = (slug: string) => hub.tools.find((t) => t.slug === slug)!;

/** Last commit date of the data, for "Last updated" in the footer. */
export const lastUpdated = (() => {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", "data", "content"], {
      cwd: hub.root,
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
})();

/** Star count at build time, so the footer shows a chart only once there is history to show. */
export const repoStars: number = await fetch("https://api.github.com/repos/NeuralSaasAi/vibe-coding-hub", {
  headers: process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {},
})
  .then((r) => (r.ok ? r.json() : { stargazers_count: 0 }))
  .then((repo: { stargazers_count?: number }) => repo.stargazers_count ?? 0)
  .catch(() => 0);

export const shortTitle = (c: Category) =>
  c.title.replace(" and editor extensions", "").replace(", security and monitoring", " and security");
