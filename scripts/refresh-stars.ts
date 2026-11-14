// Updates `stars` and `last_commit` in data/tools/*.yml for tools with a GitHub repo.
// Run weekly by .github/workflows/refresh.yml. Locally: npm run refresh-stars (uses `gh auth token` or GITHUB_TOKEN).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { findRoot, loadTools } from "../lib/data.ts";
import { updateToolFile } from "../lib/write.ts";

export interface RepoInfo {
  stargazers_count: number;
  pushed_at: string;
  archived: boolean;
  /** Set when GitHub redirected a renamed repo, as owner/name. */
  full_name: string;
}

export type FetchRepo = (repo: string) => Promise<RepoInfo | null>;

export interface RefreshResult {
  updated: string[];
  unchanged: string[];
  failed: string[];
  archived: string[];
  moved: { slug: string; from: string; to: string }[];
}

/** Writes only the `stars` and `last_commit` fields; everything else in each file is left alone. */
export async function refreshStars(root: string, fetchRepo: FetchRepo): Promise<RefreshResult> {
  const result: RefreshResult = { updated: [], unchanged: [], failed: [], archived: [], moved: [] };
  for (const tool of loadTools(root).filter((t) => t.repo)) {
    const info = await fetchRepo(tool.repo!);
    if (!info) {
      result.failed.push(tool.slug);
      continue;
    }
    if (info.archived) result.archived.push(tool.slug);
    if (info.full_name.toLowerCase() !== tool.repo!.toLowerCase()) {
      result.moved.push({ slug: tool.slug, from: tool.repo!, to: info.full_name });
    }
    const stars = info.stargazers_count;
    const lastCommit = info.pushed_at.slice(0, 10);
    const path = join(root, "data", "tools", `${tool.slug}.yml`);
    const current = parse(readFileSync(path, "utf8")) as { stars?: number; last_commit?: string };
    if (current.stars === stars && current.last_commit === lastCommit) {
      result.unchanged.push(tool.slug);
      continue;
    }
    updateToolFile(root, tool.slug, (t) => {
      t.stars = stars;
      t.last_commit = lastCommit;
    });
    result.updated.push(tool.slug);
  }
  return result;
}

function token(): string | undefined {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim() || undefined;
  } catch {
    return undefined;
  }
}

export function githubFetcher(auth = token()): FetchRepo {
  return async (repo) => {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "vibe-coding-hub-refresh",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as RepoInfo;
  };
}

async function main() {
  const root = findRoot();
  const r = await refreshStars(root, githubFetcher());
  console.log(`Updated ${r.updated.length}, unchanged ${r.unchanged.length}, failed ${r.failed.length}.`);
  if (r.failed.length) console.log(`Could not fetch: ${r.failed.join(", ")}`);
  if (r.archived.length) console.log(`Archived upstream, consider removing: ${r.archived.join(", ")}`);
  for (const m of r.moved) console.log(`Moved: ${m.slug} ${m.from} -> ${m.to} (update repo: in its file)`);
  // A short summary file the workflow uses as the pull request body
  if (process.env.REFRESH_SUMMARY) {
    const { writeFileSync } = await import("node:fs");
    const lines = [
      `Weekly refresh of GitHub stars and last-commit dates.`,
      ``,
      `- Updated: ${r.updated.length ? r.updated.join(", ") : "none"}`,
      `- Could not fetch: ${r.failed.length ? r.failed.join(", ") : "none"}`,
      `- Archived upstream: ${r.archived.length ? r.archived.join(", ") : "none"}`,
      ...r.moved.map((m) => `- Moved: ${m.slug} ${m.from} → ${m.to}`),
    ];
    writeFileSync(process.env.REFRESH_SUMMARY, `${lines.join("\n")}\n`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
