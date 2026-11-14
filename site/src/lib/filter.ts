export interface FilterState {
  category: string | null;
  free: boolean;
  open: boolean;
  q: string;
  /** Explicit tool slugs, used by the which-tool result link. */
  ids: string[];
}

export interface FilterableTool {
  slug: string;
  name: string;
  description: string;
  category: string;
  free_tier: boolean;
  open_source: boolean;
}

export const emptyState = (): FilterState => ({ category: null, free: false, open: false, q: "", ids: [] });

export function parseState(search: string): FilterState {
  const params = new URLSearchParams(search);
  return {
    category: params.get("category") || null,
    free: params.get("free") === "1",
    open: params.get("open") === "1",
    q: (params.get("q") ?? "").trim(),
    ids: (params.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  };
}

export function toSearch(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.category) params.set("category", state.category);
  if (state.free) params.set("free", "1");
  if (state.open) params.set("open", "1");
  if (state.q) params.set("q", state.q);
  if (state.ids.length) params.set("ids", state.ids.join(","));
  const text = params.toString();
  return text ? `?${text}` : "";
}

const fold = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

export function matches(tool: FilterableTool, state: FilterState): boolean {
  if (state.ids.length && !state.ids.includes(tool.slug)) return false;
  if (state.category && tool.category !== state.category) return false;
  if (state.free && !tool.free_tier) return false;
  if (state.open && !tool.open_source) return false;
  if (state.q) {
    const hay = fold(`${tool.name} ${tool.description} ${tool.slug}`);
    if (!fold(state.q).split(/\s+/).every((word) => hay.includes(word))) return false;
  }
  return true;
}

export function isFiltered(state: FilterState): boolean {
  return Boolean(state.category || state.free || state.open || state.q || state.ids.length);
}
