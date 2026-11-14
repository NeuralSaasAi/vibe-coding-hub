import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import {
  CATEGORY_IDS,
  categorySchema,
  guideSchema,
  jobsFileSchema,
  toolSchema,
  type Category,
  type GuideStage,
  type JobsFile,
  type Tool,
} from "../schema/tool.ts";

export class DataError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Data validation failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "DataError";
  }
}

/** Walks up from `start` until it finds the repo root (the folder holding data/tools). */
export function findRoot(start = process.cwd()): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, "data", "tools"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`Could not find data/tools above ${start}`);
    dir = parent;
  }
}

function formatIssues(file: string, error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join(".") : "(root)";
    return `${file}: ${path} ${issue.message}`;
  });
}

function readYaml(path: string): unknown {
  return parse(readFileSync(path, "utf8"));
}

export function loadCategories(root = findRoot()): Category[] {
  const file = "data/categories.yml";
  const result = z.array(categorySchema).safeParse(readYaml(join(root, file)));
  if (!result.success) throw new DataError(formatIssues(file, result.error));
  const ids = result.data.map((c) => c.id);
  const missing = CATEGORY_IDS.filter((id) => !ids.includes(id));
  if (missing.length) throw new DataError([`${file}: missing categories ${missing.join(", ")}`]);
  return CATEGORY_IDS.map((id) => result.data.find((c) => c.id === id)!);
}

export function loadTools(root = findRoot()): Tool[] {
  const dir = join(root, "data", "tools");
  const problems: string[] = [];
  const tools: Tool[] = [];
  const seenUrls = new Map<string, string>();

  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".yml")) {
      problems.push(`data/tools/${name}: tool files must end in .yml`);
      continue;
    }
    const slug = name.replace(/\.yml$/, "");
    const file = `data/tools/${name}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      problems.push(`${file}: file name must be lowercase letters, numbers and dashes`);
    }
    const result = toolSchema.safeParse(readYaml(join(dir, name)));
    if (!result.success) {
      problems.push(...formatIssues(file, result.error));
      continue;
    }
    const url = result.data.url.replace(/\/$/, "").toLowerCase();
    const other = seenUrls.get(url);
    if (other) problems.push(`${file}: same url as data/tools/${other}.yml`);
    seenUrls.set(url, slug);
    tools.push({ ...result.data, slug });
  }

  if (problems.length) throw new DataError(problems);
  return tools;
}

export function loadJobs(root = findRoot(), tools = loadTools(root)): JobsFile {
  const file = "data/jobs.yml";
  const result = jobsFileSchema.safeParse(readYaml(join(root, file)));
  if (!result.success) throw new DataError(formatIssues(file, result.error));

  const slugs = new Set(tools.map((t) => t.slug));
  const problems: string[] = [];
  for (const job of result.data.jobs) {
    const text = `${job.first_pick_text} ${job.also_text} ${job.outgrow}`;
    const tokens = [...text.matchAll(/\{([a-z0-9-]+)\}/g)].map((m) => m[1]!);
    for (const s of [...job.first_pick, ...job.also_consider, ...tokens]) {
      if (!slugs.has(s)) problems.push(`${file}: job "${job.id}" names unknown tool "${s}"`);
    }
    for (const m of text.matchAll(/\{cat:([a-z0-9-]+)(?:\|[^}]+)?\}/g)) {
      if (!(CATEGORY_IDS as readonly string[]).includes(m[1]!)) {
        problems.push(`${file}: job "${job.id}" names unknown category "${m[1]}"`);
      }
    }
  }
  if (problems.length) throw new DataError(problems);
  return result.data;
}

/** Splits a Markdown file into YAML front matter and body. */
export function splitFrontMatter(text: string): { data: unknown; body: string } {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: undefined, body: text };
  return { data: parse(match[1]!), body: match[2]!.trim() };
}

export function loadGuide(root = findRoot()): GuideStage[] {
  const dir = join(root, "content", "guide");
  const problems: string[] = [];
  const stages: GuideStage[] = [];
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".md")).sort()) {
    const file = `content/guide/${name}`;
    const { data, body } = splitFrontMatter(readFileSync(join(dir, name), "utf8"));
    const result = guideSchema.safeParse(data);
    if (!result.success) {
      problems.push(...formatIssues(file, result.error));
      continue;
    }
    if (`${result.data.id}.md` !== name.replace(/^\d+-/, "")) {
      problems.push(`${file}: id "${result.data.id}" must match the file name`);
    }
    stages.push({ ...result.data, body });
  }
  const orders = stages.map((s) => s.order);
  if (new Set(orders).size !== orders.length) problems.push("content/guide: two stages share the same order");
  if (problems.length) throw new DataError(problems);
  return stages.sort((a, b) => a.order - b.order);
}

export interface HubData {
  root: string;
  categories: Category[];
  tools: Tool[];
  jobs: JobsFile;
  guide: GuideStage[];
}

export function loadAll(root = findRoot()): HubData {
  const categories = loadCategories(root);
  const tools = loadTools(root);
  return { root, categories, tools, jobs: loadJobs(root, tools), guide: loadGuide(root) };
}

/** Tools in a category, alphabetical. */
export function toolsInCategory(tools: Tool[], category: string): Tool[] {
  return tools
    .filter((t) => t.category === category)
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

export function stats(tools: Tool[]) {
  const verified = tools
    .map((t) => t.pricing?.last_verified)
    .filter((v): v is string => Boolean(v))
    .sort();
  return {
    tools: tools.length,
    freeTiers: tools.filter((t) => t.free_details).length,
    prices: tools.filter((t) => t.pricing).length,
    openSource: tools.filter((t) => t.open_source).length,
    categories: new Set(tools.map((t) => t.category)).size,
    latestVerified: verified.at(-1) ?? "",
  };
}
