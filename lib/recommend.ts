import type { JobsFile, Tool } from "../schema/tool.ts";

export interface Answers {
  job: string;
  coding: string;
  budget: string;
}

export interface Recommendation {
  jobId: string;
  useCase: string;
  picks: Tool[];
  also: Tool[];
  outgrow: string;
  notes: string[];
  /** Slugs for a filtered /tools view. */
  slugs: string[];
}

const DEVELOPER_ROUTE = ["cursor", "kiro", "claude-code"];

/** Turns the three which-tool answers into picks. Pure, so the site and tests share it. */
export function recommend(jobs: JobsFile, tools: Tool[], answers: Answers): Recommendation {
  const job = jobs.jobs.find((j) => j.id === answers.job);
  if (!job) throw new Error(`Unknown job: ${answers.job}`);
  const bySlug = new Map(tools.map((t) => [t.slug, t]));
  const get = (s: string) => {
    const t = bySlug.get(s);
    if (!t) throw new Error(`Unknown tool: ${s}`);
    return t;
  };

  let picks = job.first_pick.map(get);
  let also = job.also_consider.map(get);
  const notes: string[] = [];

  if (answers.coding === "developer" && job.id !== "existing-codebase") {
    const extra = DEVELOPER_ROUTE.map(get).filter((t) => !picks.includes(t) && !also.includes(t));
    also = [...also, ...extra];
    notes.push("You code, so you can also skip the builder and start in an AI IDE or CLI agent. You will own every file from day one.");
  }
  if (answers.coding === "none" && job.id === "existing-codebase") {
    notes.push("These tools assume you can read code. If you can't yet, pair them with someone who can, or start a fresh version in an AI app builder.");
  }

  if (answers.budget === "free") {
    const free = (t: Tool) => t.free_tier || t.open_source;
    const freePicks = picks.filter(free);
    const moved = picks.filter((t) => !free(t));
    if (freePicks.length) {
      picks = freePicks;
      also = [...also.filter(free), ...moved];
    }
    notes.push("Free plans have tight limits. Expect to upgrade once real users arrive. Payments services like Stripe charge per transaction, not per month.");
  } else if (answers.budget === "small") {
    notes.push("Most entry plans here cost $8 to $30 a month. Check the pricing page before you commit.");
  }

  return {
    jobId: job.id,
    useCase: job.use_case,
    picks,
    also,
    outgrow: job.outgrow,
    notes,
    slugs: [...picks, ...also].map((t) => t.slug),
  };
}
