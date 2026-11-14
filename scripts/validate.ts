import { DataError, loadAll, stats } from "../lib/data.ts";

try {
  const data = loadAll();
  const s = stats(data.tools);
  console.log(
    `OK: ${s.tools} tools in ${s.categories} categories, ${s.freeTiers} free tiers, ` +
      `${s.prices} prices, ${data.jobs.jobs.length} jobs, ${data.guide.length} guide stages.`,
  );
} catch (error) {
  if (error instanceof DataError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
