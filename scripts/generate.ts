import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DataError, loadAll, type HubData } from "../lib/data.ts";
import {
  renderBadges,
  renderFreeTiers,
  renderGuide,
  renderJobs,
  renderPricing,
  renderTools,
  replaceSection,
  sectionNames,
} from "../lib/render.ts";

export interface Output {
  /** Path relative to the repo root. */
  path: string;
  content: string;
}

/** Builds the README sections. Extra outputs (images) are added by later tasks. */
export function buildReadme(data: HubData, current: string): string {
  const sections: Record<string, string> = {
    badges: renderBadges(data.tools),
    tools: renderTools(data.tools, data.categories),
    "free-tiers": renderFreeTiers(data.tools),
    pricing: renderPricing(data.tools),
    jobs: renderJobs(data.jobs, data.tools, data.categories),
    guide: renderGuide(data.guide),
  };
  let doc = current;
  for (const name of sectionNames(current)) {
    const content = sections[name];
    if (content === undefined) throw new Error(`README has an unknown section marker: ${name}`);
    doc = replaceSection(doc, name, content);
  }
  for (const name of Object.keys(sections)) {
    if (!sectionNames(current).includes(name)) throw new Error(`README is missing the ${name} section markers`);
  }
  return doc;
}

export function buildOutputs(data: HubData): Output[] {
  const readmePath = join(data.root, "README.md");
  return [{ path: "README.md", content: buildReadme(data, readFileSync(readmePath, "utf8")) }];
}

function main() {
  const check = process.argv.includes("--check");
  let data: HubData;
  try {
    data = loadAll();
  } catch (error) {
    if (error instanceof DataError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }

  const stale: string[] = [];
  for (const out of buildOutputs(data)) {
    const path = join(data.root, out.path);
    let before = "";
    try {
      before = readFileSync(path, "utf8");
    } catch {
      // New file
    }
    if (before === out.content) continue;
    stale.push(out.path);
    if (!check) writeFileSync(path, out.content);
  }

  if (check && stale.length) {
    console.error(`These files are out of date with the data:\n${stale.map((p) => `  - ${p}`).join("\n")}`);
    console.error("Run `npm run readme` and commit the result.");
    process.exit(1);
  }
  console.log(check ? "README and images are up to date." : stale.length ? `Updated ${stale.join(", ")}` : "Nothing to update.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
