export const STALE_DAYS = 60;

/** A YYYY-MM month counts from its last day, so "2026-11" is fresh through the end of November. */
export function monthEnd(month: string): Date {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0, 23, 59, 59));
}

export function isStale(month: string, now: Date = new Date(), days = STALE_DAYS): boolean {
  const age = (now.getTime() - monthEnd(month).getTime()) / 86_400_000;
  return age > days;
}

export interface PriceRow {
  name: string;
  entry_usd: number | null;
  verified: string;
}

export type SortKey = "name" | "price" | "verified";

export function sortRows<T extends PriceRow>(rows: T[], key: SortKey, dir: "asc" | "desc" = "asc"): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let diff = 0;
    if (key === "name") diff = a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    if (key === "price") diff = (a.entry_usd ?? Infinity) - (b.entry_usd ?? Infinity);
    if (key === "verified") diff = a.verified.localeCompare(b.verified);
    return diff * sign || a.name.localeCompare(b.name);
  });
}
