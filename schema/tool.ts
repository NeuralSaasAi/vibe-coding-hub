import { z } from "zod";

/** Category ids, in the order they appear in the README and on the site. */
export const CATEGORY_IDS = [
  "ai-app-builders",
  "ai-ides",
  "cli-agents",
  "ui-design",
  "backend-database",
  "auth-payments",
  "deploy-hosting",
  "testing-monitoring",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "must be a month in YYYY-MM format, for example 2026-11");

const httpsUrl = z.url({ protocol: /^https$/, message: "must be a full https:// URL" });

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be lowercase letters, numbers and dashes");

export const linkSchema = z.object({
  label: z.string().min(1),
  url: httpsUrl,
});

export const categorySchema = z.object({
  id: z.enum(CATEGORY_IDS),
  title: z.string().min(1),
  emoji: z.string().min(1),
  /** Short intro shown under the category heading. */
  intro: z.string().min(1),
  /** One line for gallery cards: who this category is for. */
  best_for: z.string().min(1),
  /** Accent color used in generated images, hex like #7c5cff. */
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
});

export const freeDetailsSchema = z.object({
  /** Name shown in the free-tier table, if different from the tool name. */
  label: z.string().optional(),
  whats_free: z.string().min(1),
  limits: z.string().min(1),
  source: linkSchema,
  last_verified: month,
});

export const pricingSchema = z.object({
  /** Name shown in the pricing table, if different from the tool name. */
  label: z.string().optional(),
  free_plan: z.string().min(1),
  entry: z.string().min(1),
  /** Monthly USD price of the entry plan, used for the chart. */
  entry_usd: z.number().nonnegative().optional(),
  /** True if the entry price is only shown billed yearly. */
  entry_yearly: z.boolean().optional(),
  higher: z.string().min(1),
  unit: z.string().min(1),
  sources: z.array(linkSchema).min(1),
  last_verified: month,
});

export const toolSchema = z
  .object({
    name: z.string().min(1),
    url: httpsUrl,
    category: z.enum(CATEGORY_IDS),
    description: z.string().min(10).max(220),
    free_tier: z.boolean(),
    open_source: z.boolean(),
    /** GitHub repo as owner/name, for open-source tools. */
    repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
    /** Simple Icons slug, used for the logo tile. */
    icon: z.string().optional(),
    featured: z.boolean().optional(),
    best_for: z.string().optional(),
    free_details: freeDetailsSchema.optional(),
    pricing: pricingSchema.optional(),
    /** Written by scripts/refresh-stars.ts. Do not edit by hand. */
    stars: z.number().int().nonnegative().optional(),
    last_commit: z.string().optional(),
  })
  .strict();

const jobOptionSchema = z.object({
  id: slug,
  label: z.string().min(1),
});

export const jobSchema = z.object({
  id: slug,
  use_case: z.string().min(1),
  /** Text with {slug} tokens for tools and {cat:id} tokens for categories. */
  first_pick_text: z.string().min(1),
  also_text: z.string().min(1),
  outgrow: z.string().min(1),
  first_pick: z.array(slug).min(1),
  also_consider: z.array(slug).default([]),
});

export const jobsFileSchema = z.object({
  intro: z.string().min(1),
  jobs: z.array(jobSchema).min(1),
  questions: z.object({
    coding: z.array(jobOptionSchema).min(2),
    budget: z.array(jobOptionSchema).min(2),
  }),
});

export const guideSchema = z.object({
  id: slug,
  title: z.string().min(1),
  /** Short label for roadmap nodes and stage images. */
  short: z.string().min(1).max(18),
  emoji: z.string().min(1),
  order: z.number().int().positive(),
  summary: z.string().min(1),
  /** Sub-topics shown as roadmap nodes. */
  topics: z.array(z.string().min(1)).min(1),
  /** Items a reader can tick off on the site roadmap. */
  checklist: z.array(z.string().min(1)).min(1),
});

export type Link = z.infer<typeof linkSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Tool = z.infer<typeof toolSchema> & { slug: string };
export type Job = z.infer<typeof jobSchema>;
export type JobsFile = z.infer<typeof jobsFileSchema>;
export type GuideStage = z.infer<typeof guideSchema> & { body: string };
