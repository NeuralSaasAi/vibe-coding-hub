import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DataError, loadAll, type HubData } from "../lib/data.ts";
import {
  cardPath,
  logoPath,
  mermaidBlock,
  renderBadges,
  renderFreeTiers,
  renderGallery,
  renderGlance,
  renderGuide,
  renderJobs,
  renderPricing,
  renderRecentlyVerified,
  renderRoadmap,
  renderTools,
  replaceSection,
  sectionNames,
  stagePath,
  whichToolDiagram,
} from "../lib/render.ts";
import { siteLink } from "../lib/site-url.ts";
import { banner, categoryCard, footerCard, journey, logoTile, pricingChart, stageImage } from "../lib/svg.ts";

export interface Output {
  /** Path relative to the repo root. */
  path: string;
  content: string;
}

/** Folders whose contents are fully generated. Stray files in them are removed. */
export const GENERATED_DIRS = ["assets/logos", "assets/cards", "assets/roadmap"];

const readDiagram = (root: string, name: string) => readFileSync(join(root, "diagrams", `${name}.mmd`), "utf8");

export function buildReadme(data: HubData, current: string): string {
  const whichTool = whichToolDiagram(data.jobs, data.tools);
  const sections: Record<string, string> = {
    badges: renderBadges(data.tools),
    glance: renderGlance(data.tools, data.categories),
    gallery: renderGallery(data.tools, data.categories, (c) => siteLink(`tools/?category=${c.id}`)),
    roadmap: renderRoadmap(data.guide, (s) => siteLink(`roadmap/#${s.id}`)),
    tools: renderTools(data.tools, data.categories, { collapse: true }),
    "free-tiers": renderFreeTiers(data.tools),
    pricing: renderPricing(data.tools),
    jobs: `${mermaidBlock(whichTool)}\n\n${renderJobs(data.jobs, data.tools, data.categories)}`,
    guide: renderGuide(data.guide, {
      afterSummary: { "when-something-breaks": mermaidBlock(readDiagram(data.root, "when-it-breaks")) },
    }),
    "recently-verified": renderRecentlyVerified(data.tools),
    "diagram:contribute": mermaidBlock(readDiagram(data.root, "contribute")),
  };
  const present = sectionNames(current);
  let doc = current;
  for (const name of present) {
    const content = sections[name];
    if (content === undefined) throw new Error(`README has an unknown section marker: ${name}`);
    doc = replaceSection(doc, name, content);
  }
  for (const name of Object.keys(sections)) {
    if (!present.includes(name)) throw new Error(`README is missing the ${name} section markers`);
  }
  return doc;
}

export function buildOutputs(data: HubData): Output[] {
  const outputs: Output[] = [
    { path: "README.md", content: buildReadme(data, readFileSync(join(data.root, "README.md"), "utf8")) },
    { path: "assets/banner-dark.svg", content: banner(data.tools, "dark") },
    { path: "assets/banner-light.svg", content: banner(data.tools, "light") },
    { path: "assets/journey.svg", content: journey(data.tools) },
    { path: "assets/pricing-chart.svg", content: pricingChart(data.tools, data.categories) },
    { path: "assets/footer-card.svg", content: footerCard() },
    { path: "diagrams/which-tool.mmd", content: whichToolDiagram(data.jobs, data.tools) },
  ];
  for (const tool of data.tools) {
    const category = data.categories.find((c) => c.id === tool.category)!;
    outputs.push({ path: logoPath(tool), content: logoTile(tool, category) });
  }
  for (const category of data.categories) {
    outputs.push({ path: cardPath(category), content: categoryCard(category, data.tools) });
  }
  for (const stage of data.guide) {
    outputs.push({ path: stagePath(stage), content: stageImage(stage, data.guide.length) });
  }
  return outputs;
}

/** Files in generated folders that no output claims, for example the logo of a removed tool. */
export function strayFiles(root: string, outputs: Output[]): string[] {
  const claimed = new Set(outputs.map((o) => o.path));
  return GENERATED_DIRS.flatMap((dir) =>
    existsSync(join(root, dir))
      ? readdirSync(join(root, dir))
          .map((name) => `${dir}/${name}`)
          .filter((path) => !claimed.has(path))
      : [],
  );
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

  const outputs = buildOutputs(data);
  const stale: string[] = [];
  for (const out of outputs) {
    const path = join(data.root, out.path);
    const before = existsSync(path) ? readFileSync(path, "utf8") : undefined;
    if (before === out.content) continue;
    stale.push(out.path);
    if (!check) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, out.content);
    }
  }
  const strays = strayFiles(data.root, outputs);
  if (!check) for (const path of strays) rmSync(join(data.root, path));

  if (check && (stale.length || strays.length)) {
    if (stale.length) console.error(`These files are out of date with the data:\n${stale.map((p) => `  - ${p}`).join("\n")}`);
    if (strays.length) console.error(`These generated files are no longer used:\n${strays.map((p) => `  - ${p}`).join("\n")}`);
    console.error("Run `npm run readme` and commit the result.");
    process.exit(1);
  }
  const changed = [...stale, ...strays.map((p) => `${p} (removed)`)];
  if (check) console.log(`README and ${outputs.length - 1} generated files are up to date.`);
  else console.log(changed.length ? `Updated ${changed.length} files.` : "Nothing to update.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
