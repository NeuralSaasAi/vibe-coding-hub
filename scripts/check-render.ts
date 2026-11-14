// Renders README.md with GitHub's Markdown API and checks the visual parts survive the sanitizer.
// Needs the GitHub CLI (`gh`) logged in, or GH_TOKEN set in CI.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findRoot } from "../lib/data.ts";
import { REPO } from "../lib/render.ts";

const root = findRoot();
const source = readFileSync(join(root, "README.md"), "utf8");
const html = execFileSync("gh", ["api", "markdown", "-f", "mode=gfm", "-f", `context=${REPO}`, "-F", "text=@README.md"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

const count = (re: RegExp, text: string) => [...text.matchAll(re)].length;
const expected = {
  mermaid: count(/```mermaid/g, source),
  alerts: count(/^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gm, source),
  pictures: count(/<picture>/g, source),
  details: count(/<details>/g, source),
  images: count(/<img\b/g, source),
};
const found = {
  mermaid: count(/lang="mermaid"|class="[^"]*mermaid/g, html),
  alerts: count(/class="markdown-alert markdown-alert-/g, html),
  pictures: count(/<picture>/g, html),
  details: count(/<details>/g, html),
  images: count(/<img\b/g, html),
};

const problems = (Object.keys(expected) as (keyof typeof expected)[]).filter((k) => found[k] < expected[k]);
for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
  console.log(`${key.padEnd(9)} source ${String(expected[key]).padStart(3)}  rendered ${String(found[key]).padStart(3)}`);
}
if (problems.length) {
  console.error(`GitHub dropped or changed: ${problems.join(", ")}`);
  process.exit(1);
}
console.log("GitHub renders every visual element.");
