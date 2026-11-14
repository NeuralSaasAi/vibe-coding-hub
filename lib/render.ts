import type { Category, GuideStage, JobsFile, Tool } from "../schema/tool.ts";
import { stats, toolsInCategory } from "./data.ts";

export const REPO = "NeuralSaasAi/vibe-coding-hub";
export const REPO_URL = `https://github.com/${REPO}`;

/** The anchor GitHub generates for a heading. */
export function githubAnchor(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

const cell = (text: string) => text.replace(/\|/g, "\\|");

export function toolLink(tool: Tool): string {
  return `[${tool.name}](${tool.url})`;
}

export function tagList(tool: Tool): string[] {
  const tags: string[] = [];
  if (tool.free_tier) tags.push("`Free tier`");
  if (tool.open_source) tags.push("`Open source`");
  return tags;
}

export function toolLine(tool: Tool): string {
  return [`- ${toolLink(tool)} - ${tool.description}`, ...tagList(tool)].join(" ");
}

/** Replaces {slug} and {cat:id|label} tokens with Markdown links. */
export function expandTokens(text: string, tools: Tool[], categories: Category[]): string {
  const bySlug = new Map(tools.map((t) => [t.slug, t]));
  return text
    .replace(/\{cat:([a-z0-9-]+)(?:\|([^}]+))?\}/g, (_, id: string, label?: string) => {
      const cat = categories.find((c) => c.id === id)!;
      return `[${label ?? cat.title}](#${githubAnchor(cat.title)})`;
    })
    .replace(/\{([a-z0-9-]+)\}/g, (_, slug: string) => toolLink(bySlug.get(slug)!));
}

/** Featured tools first (alphabetical), then the rest (alphabetical). */
export function splitFeatured(tools: Tool[], limit = 3): { top: Tool[]; rest: Tool[] } {
  const featured = tools.filter((t) => t.featured).slice(0, limit);
  const fill = tools.filter((t) => !featured.includes(t)).slice(0, Math.max(0, limit - featured.length));
  const top = [...featured, ...fill].sort((a, b) => tools.indexOf(a) - tools.indexOf(b));
  return { top, rest: tools.filter((t) => !top.includes(t)) };
}

export interface RenderOptions {
  /** Collapse each category to its top three tools plus a <details> block. */
  collapse?: boolean;
}

export function renderTools(tools: Tool[], categories: Category[], options: RenderOptions = {}): string {
  return categories
    .map((cat) => {
      const list = toolsInCategory(tools, cat.id);
      const head = `### ${cat.title}\n\n${cat.intro}\n\n`;
      if (!options.collapse) return head + list.map(toolLine).join("\n");
      const { top, rest } = splitFeatured(list);
      const more = rest.length
        ? `\n\n<details>\n<summary>${rest.length} more ${cat.title.toLowerCase()}</summary>\n\n${rest.map(toolLine).join("\n")}\n\n</details>`
        : "";
      return head + top.map(toolLine).join("\n") + more;
    })
    .join("\n\n");
}

export function renderFreeTiers(tools: Tool[]): string {
  const rows = tools
    .filter((t) => t.free_details)
    .map((t) => ({ t, label: t.free_details!.label ?? t.name }))
    .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));
  const months = [...new Set(rows.map((r) => r.t.free_details!.last_verified))].sort();
  const intro = `What you get for $0. Checked on each vendor's page in ${months.at(-1)}. Free plans change often, so check the source before you rely on a limit.`;
  const table = [
    "| Tool | What's free | Main limits | Source |",
    "| --- | --- | --- | --- |",
    ...rows.map(({ t, label }) => {
      const f = t.free_details!;
      return `| ${cell(label)} | ${cell(f.whats_free)} | ${cell(f.limits)} | [${f.source.label}](${f.source.url}) |`;
    }),
  ];
  return `${intro}\n\n${table.join("\n")}`;
}

export function renderPricing(tools: Tool[]): string {
  const rows = tools
    .filter((t) => t.pricing)
    .map((t) => ({ t, label: t.pricing!.label ?? t.name }))
    .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));
  return [
    "| Tool | Free plan | Entry paid plan | Higher plans | How usage is measured | Source | Last verified |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(({ t, label }) => {
      const p = t.pricing!;
      const sources = p.sources.map((s) => `[${s.label}](${s.url})`).join(", ");
      return `| ${cell(label)} | ${cell(p.free_plan)} | ${cell(p.entry)} | ${cell(p.higher)} | ${cell(p.unit)} | ${sources} | ${p.last_verified} |`;
    }),
  ].join("\n");
}

export function renderJobs(jobs: JobsFile, tools: Tool[], categories: Category[]): string {
  const x = (text: string) => cell(expandTokens(text, tools, categories));
  return [
    jobs.intro,
    "",
    "| I want to build... | Good first pick | Also consider | Where people tend to outgrow it |",
    "| --- | --- | --- | --- |",
    ...jobs.jobs.map((j) => `| ${cell(j.use_case)} | ${x(j.first_pick_text)} | ${x(j.also_text)} | ${x(j.outgrow)} |`),
  ].join("\n");
}

export interface GuideExtras {
  /** Extra Markdown inserted after a stage's summary, keyed by stage id. */
  afterSummary?: Record<string, string>;
}

export function renderGuide(stages: GuideStage[], extras: GuideExtras = {}): string {
  return stages
    .map((s) => {
      const extra = extras.afterSummary?.[s.id];
      return [`### ${s.order}. ${s.title}`, s.summary, ...(extra ? [extra] : []), s.body].join("\n\n");
    })
    .join("\n\n");
}

export function renderBadges(tools: Tool[]): string {
  const s = stats(tools);
  const month = s.latestVerified.replace("-", "--");
  return [
    '<p align="center">',
    `  <img src="https://img.shields.io/badge/tools-${s.tools}-7c5cff" alt="${s.tools} tools">`,
    `  <img src="https://img.shields.io/badge/free%20tiers-${s.freeTiers}-16a34a" alt="${s.freeTiers} free tiers">`,
    `  <img src="https://img.shields.io/badge/prices%20verified-${month}-0ea5c6" alt="Prices verified ${s.latestVerified}">`,
    '  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome"></a>',
    '  <a href="LICENSE"><img src="https://img.shields.io/badge/license-CC0--1.0-blue" alt="CC0 license"></a>',
    "</p>",
  ].join("\n");
}

/** Replaces the text between <!-- BEGIN:name --> and <!-- END:name -->. */
export function replaceSection(doc: string, name: string, content: string): string {
  const begin = `<!-- BEGIN:${name} -->`;
  const end = `<!-- END:${name} -->`;
  const start = doc.indexOf(begin);
  const stop = doc.indexOf(end);
  if (start === -1 || stop === -1 || stop < start) {
    throw new Error(`README is missing the ${begin} ... ${end} markers`);
  }
  if (doc.indexOf(begin, start + 1) !== -1) throw new Error(`README has ${begin} more than once`);
  return `${doc.slice(0, start + begin.length)}\n\n${content.trim()}\n\n${doc.slice(stop)}`;
}

export function sectionNames(doc: string): string[] {
  return [...doc.matchAll(/<!-- BEGIN:([a-z0-9:-]+) -->/g)].map((m) => m[1]!);
}
