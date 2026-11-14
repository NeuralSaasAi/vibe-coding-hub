import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";

/** Key order used for every data/tools/*.yml file, so diffs stay small. */
export const TOOL_KEY_ORDER = [
  "name",
  "url",
  "category",
  "description",
  "free_tier",
  "open_source",
  "repo",
  "icon",
  "featured",
  "best_for",
  "free_details",
  "pricing",
  "stars",
  "last_commit",
] as const;

export function orderToolKeys(tool: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of TOOL_KEY_ORDER) if (tool[key] !== undefined) out[key] = tool[key];
  for (const key of Object.keys(tool)) if (!(key in out)) out[key] = tool[key];
  return out;
}

export function toolYaml(tool: Record<string, unknown>): string {
  return stringify(orderToolKeys(tool), { lineWidth: 0 });
}

/** Reads a tool file, applies `change`, and writes it back in canonical order. */
export function updateToolFile(
  root: string,
  slug: string,
  change: (tool: Record<string, unknown>) => void,
): void {
  const path = join(root, "data", "tools", `${slug}.yml`);
  const tool = parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  change(tool);
  writeFileSync(path, toolYaml(tool));
}
