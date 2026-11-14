import * as simpleIcons from "simple-icons";
import type { Category, GuideStage, Tool } from "../schema/tool.ts";
import { stats } from "./data.ts";

const SANS = "-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

export const esc = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function svg(width: number, height: number, title: string, desc: string, body: string): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="t d">`,
    `  <title id="t">${esc(title)}</title>`,
    `  <desc id="d">${esc(desc)}</desc>`,
    body.trimEnd(),
    "</svg>",
    "",
  ].join("\n");
}

/** Wraps text into lines of at most `max` characters. */
export function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ---------- Banner ----------

export function banner(tools: Tool[], theme: "dark" | "light"): string {
  const s = stats(tools);
  const dark = theme === "dark";
  const c = dark
    ? { bg1: "#0b1020", bg2: "#1a1240", win: "#0f1529", stroke: "#2a3358", title: "#8b94bb", text: "#e6e9f5", dim: "#aab2d5", prompt: "#22d3ee", ok: "#28c840" }
    : { bg1: "#f5f3ff", bg2: "#e0f7fb", win: "#ffffff", stroke: "#d9d4ff", title: "#5b6280", text: "#151a33", dim: "#3f4766", prompt: "#0e7490", ok: "#16a34a" };
  const lines = [
    `${s.tools} tools across ${s.categories} categories`,
    `${s.freeTiers} free tiers, ${s.prices} prices checked on vendor pages`,
    "launch checklist + what to do when it breaks",
  ];
  return svg(
    1200,
    380,
    "Vibe Coding Hub",
    `A terminal prompt reading "build me an app that actually stays up", followed by: ${lines.join("; ")}.`,
    `  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.bg1}"/>
      <stop offset="1" stop-color="${c.bg2}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7c5cff"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="380" rx="24" fill="url(#bg)"/>
  <rect x="60" y="50" width="1080" height="280" rx="16" fill="${c.win}" stroke="${c.stroke}"/>
  <circle cx="92" cy="80" r="7" fill="#ff5f57"/>
  <circle cx="116" cy="80" r="7" fill="#febc2e"/>
  <circle cx="140" cy="80" r="7" fill="#28c840"/>
  <text x="600" y="86" fill="${c.title}" font-family="${SANS}" font-size="17" font-weight="600" text-anchor="middle">Vibe Coding Hub</text>
  <g font-family="${MONO}" font-size="26">
    <text x="100" y="148" fill="${c.prompt}">&gt;</text>
    <text x="130" y="148" fill="${c.text}">build me an app that actually stays up</text>
    <rect x="736" y="127" width="14" height="26" fill="${c.prompt}">
      <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1.1s" repeatCount="indefinite"/>
    </rect>
  </g>
  <g font-family="${MONO}" font-size="20">
${lines
  .map(
    (line, i) =>
      `    <text x="130" y="${204 + i * 36}" fill="${c.ok}">✓</text>\n    <text x="160" y="${204 + i * 36}" fill="${c.dim}">${esc(line)}</text>`,
  )
  .join("\n")}
  </g>
  <rect x="60" y="345" width="1080" height="4" rx="2" fill="url(#accent)"/>`,
  );
}

// ---------- Logo tiles ----------

interface SimpleIcon {
  slug: string;
  title: string;
  hex: string;
  path: string;
}

const iconsBySlug = new Map<string, SimpleIcon>(
  Object.values(simpleIcons as unknown as Record<string, SimpleIcon>)
    .filter((i) => i && typeof i === "object" && "slug" in i && "path" in i)
    .map((i) => [i.slug, i]),
);

export function hasIcon(slug: string): boolean {
  return iconsBySlug.has(slug);
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function initials(name: string): string {
  const words = name.replace(/\(.*?\)/g, "").split(/[\s./-]+/).filter(Boolean);
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  const w = words[0] ?? name;
  return (w[0]!.toUpperCase() + (w[1] ?? "")).slice(0, 2);
}

/** A 64x64 tile with the tool's Simple Icons glyph, or its initials. */
export function logoTile(tool: Tool, category: Category): string {
  const icon = tool.icon ? iconsBySlug.get(tool.icon) : undefined;
  let mark: string;
  if (icon) {
    const hex = `#${icon.hex}`;
    const fill = luminance(hex) < 0.12 ? "#e6e9f5" : hex;
    mark = `  <g transform="translate(16 16) scale(1.3333)"><path fill="${fill}" d="${icon.path}"/></g>`;
  } else {
    mark = `  <text x="32" y="41" fill="${category.color}" font-family="${SANS}" font-size="24" font-weight="700" text-anchor="middle">${esc(initials(tool.name))}</text>`;
  }
  return svg(
    64,
    64,
    tool.name,
    `${tool.name} logo tile${icon ? "" : " (initials)"}, in the ${category.title} category.`,
    `  <rect x="1" y="1" width="62" height="62" rx="14" fill="#111733" stroke="${category.color}" stroke-opacity="0.55" stroke-width="2"/>
${mark}`,
  );
}

// ---------- Category cards ----------

export function categoryCard(category: Category, tools: Tool[]): string {
  const inCat = tools.filter((t) => t.category === category.id);
  const free = inCat.filter((t) => t.free_tier).length;
  const open = inCat.filter((t) => t.open_source).length;
  const best = wrap(category.best_for, 30);
  return svg(
    400,
    220,
    category.title,
    `${category.title}: ${inCat.length} tools, ${free} with a free tier, ${open} open source. Best for: ${category.best_for}.`,
    `  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f1529"/>
      <stop offset="1" stop-color="#1a1240"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="398" height="218" rx="18" fill="url(#g)" stroke="${category.color}" stroke-opacity="0.6" stroke-width="2"/>
  <rect x="24" y="24" width="52" height="52" rx="14" fill="${category.color}" fill-opacity="0.16"/>
  <text x="50" y="61" font-size="28" text-anchor="middle">${category.emoji}</text>
  <text x="92" y="48" fill="#e6e9f5" font-family="${SANS}" font-size="20" font-weight="700">${esc(category.title.replace(" and editor extensions", ""))}</text>
  <text x="92" y="72" fill="${category.color}" font-family="${SANS}" font-size="15" font-weight="600">${inCat.length} tools · ${free} free tier${free === 1 ? "" : "s"}${open ? ` · ${open} open source` : ""}</text>
${best.map((line, i) => `  <text x="24" y="${126 + i * 26}" fill="#aab2d5" font-family="${SANS}" font-size="18">${esc(line)}</text>`).join("\n")}
  <text x="376" y="196" fill="${category.color}" font-family="${SANS}" font-size="15" font-weight="600" text-anchor="end">Browse →</text>`,
  );
}

// ---------- Roadmap stages ----------

const STAGE_COLORS = ["#7c5cff", "#0ea5c6", "#f59e0b", "#ef4444", "#16a34a"];

export function stageImage(stage: GuideStage, total: number): string {
  const color = STAGE_COLORS[(stage.order - 1) % STAGE_COLORS.length]!;
  const last = stage.order === total;
  return svg(
    240,
    150,
    `Stage ${stage.order}: ${stage.title}`,
    `Stage ${stage.order} of ${total} on the roadmap: ${stage.title}. ${stage.summary}`,
    `  <rect x="1" y="1" width="238" height="148" rx="18" fill="#0f1529" stroke="${color}" stroke-width="2"/>
  <circle cx="40" cy="42" r="22" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="2"/>
  <text x="40" y="50" font-size="22" text-anchor="middle">${stage.emoji}</text>
  <text x="72" y="38" fill="${color}" font-family="${SANS}" font-size="13" font-weight="700" letter-spacing="1">STEP ${stage.order}${last ? "" : " →"}</text>
  <text x="72" y="58" fill="#e6e9f5" font-family="${SANS}" font-size="17" font-weight="700">${esc(stage.short)}</text>
${stage.topics
  .slice(0, 3)
  .map((t, i) => `  <text x="22" y="${92 + i * 20}" fill="#aab2d5" font-family="${SANS}" font-size="13">• ${esc(t)}</text>`)
  .join("\n")}`,
  );
}

/** The four-step journey shown at the top of "Start here". */
export function journey(tools: Tool[]): string {
  const s = stats(tools);
  const steps = [
    { x: 170, emoji: "💡", fill: "#ede9ff", stroke: "#7c5cff", title: "1. Idea", sub: "pick your tool" },
    { x: 457, emoji: "🛠️", fill: "#e0f7fb", stroke: "#0ea5c6", title: "2. Build", sub: `${s.tools} tools, ${s.freeTiers} free` },
    { x: 743, emoji: "🚀", fill: "#fff4e0", stroke: "#f59e0b", title: "3. Launch", sub: "ship-ready checklist" },
    { x: 1030, emoji: "💚", fill: "#e5f8ea", stroke: "#16a34a", title: "4. Keep alive", sub: "debug, monitor, grow" },
  ];
  return svg(
    1200,
    260,
    "The vibe coding journey",
    `Four stages: ${steps.map((st) => `${st.title.replace(/^\d\. /, "")} (${st.sub})`).join(", ")}.`,
    `  <rect width="1200" height="260" rx="24" fill="#fbfaff" stroke="#e7e3ff"/>
  <line x1="170" y1="100" x2="1030" y2="100" stroke="#d9d4ff" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 14"/>
  <g font-family="${SANS}" text-anchor="middle">
${steps
  .map(
    (st) => `    <circle cx="${st.x}" cy="100" r="46" fill="${st.fill}" stroke="${st.stroke}" stroke-width="3"/>
    <text x="${st.x}" y="112" font-size="34">${st.emoji}</text>
    <text x="${st.x}" y="184" fill="#151a33" font-size="21" font-weight="600">${esc(st.title)}</text>
    <text x="${st.x}" y="212" fill="#5b6280" font-size="16">${esc(st.sub)}</text>`,
  )
  .join("\n")}
  </g>`,
  );
}

// ---------- Pricing chart ----------

export interface ChartRow {
  label: string;
  value: number;
  yearly: boolean;
  color: string;
}

export function pricingRows(tools: Tool[], categories: Category[]): ChartRow[] {
  return tools
    .filter((t) => t.pricing?.entry_usd !== undefined)
    .map((t) => ({
      label: t.pricing!.label ?? t.name,
      value: t.pricing!.entry_usd!,
      yearly: Boolean(t.pricing!.entry_yearly),
      color: categories.find((c) => c.id === t.category)!.color,
    }))
    .sort((a, b) => a.value - b.value || a.label.localeCompare(b.label));
}

export function pricingChart(tools: Tool[], categories: Category[]): string {
  const rows = pricingRows(tools, categories);
  const s = stats(tools);
  const max = Math.max(...rows.map((r) => r.value));
  const top = 86;
  const rowH = 34;
  const left = 250;
  const width = 900;
  const barMax = width - left - 110;
  const used = categories.filter((c) => tools.some((t) => t.pricing && t.category === c.id));
  const perRow = 4;
  const legendRows = Math.ceil(used.length / perRow);
  const legendTop = top + rows.length * rowH + 22;
  const height = legendTop + legendRows * 26 + 18;
  return svg(
    width,
    height,
    "Entry plan prices, per month",
    `Bar chart of the cheapest paid plan for ${rows.length} tools, verified ${s.latestVerified}: ${rows
      .map((r) => `${r.label} $${r.value}${r.yearly ? " billed yearly" : ""}`)
      .join(", ")}.`,
    `  <rect width="${width}" height="${height}" rx="20" fill="#0f1529"/>
  <text x="32" y="44" fill="#e6e9f5" font-family="${SANS}" font-size="22" font-weight="700">Entry plan, USD per month</text>
  <text x="${width - 32}" y="44" fill="#8b94bb" font-family="${SANS}" font-size="15" text-anchor="end">verified ${s.latestVerified} · * billed yearly</text>
${rows
  .map((r, i) => {
    const y = top + i * rowH;
    const w = Math.max(4, Math.round((r.value / max) * barMax));
    return `  <text x="${left - 14}" y="${y + 21}" fill="#c7cde6" font-family="${SANS}" font-size="16" text-anchor="end">${esc(r.label)}</text>
  <rect x="${left}" y="${y + 6}" width="${w}" height="22" rx="6" fill="${r.color}" fill-opacity="0.85"/>
  <text x="${left + w + 10}" y="${y + 23}" fill="#e6e9f5" font-family="${MONO}" font-size="15">$${r.value}${r.yearly ? "*" : ""}</text>`;
  })
  .join("\n")}
${used
  .map((c, i) => {
    const x = 32 + (i % perRow) * 210;
    const y = legendTop + Math.floor(i / perRow) * 26;
    const label = c.title.replace(" and editor extensions", "").replace(", security and monitoring", "");
    return `  <rect x="${x}" y="${y}" width="12" height="12" rx="3" fill="${c.color}"/>\n  <text x="${x + 18}" y="${y + 11}" fill="#8b94bb" font-family="${SANS}" font-size="13">${esc(label)}</text>`;
  })
  .join("\n")}`,
  );
}

// ---------- Footer card ----------

export function footerCard(): string {
  return svg(
    900,
    170,
    "Maintained by NeuralSaaS",
    "Maintained by NeuralSaaS. Built something with AI and need help shipping, fixing or scaling it? Book a free discovery call.",
    `  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7c5cff"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="900" height="170" rx="22" fill="url(#g)"/>
  <text x="40" y="58" fill="#ffffff" fill-opacity="0.85" font-family="${SANS}" font-size="15" font-weight="700" letter-spacing="2">MAINTAINED BY NEURALSAAS</text>
  <text x="40" y="96" fill="#ffffff" font-family="${SANS}" font-size="25" font-weight="800">Built something with AI and need help shipping it?</text>
  <text x="40" y="128" fill="#ffffff" fill-opacity="0.9" font-family="${SANS}" font-size="17">Fixing, securing or scaling a vibe-coded app, starting with a free review.</text>
  <rect x="664" y="112" width="210" height="40" rx="20" fill="#0b1020"/>
  <text x="769" y="138" fill="#ffffff" font-family="${SANS}" font-size="16" font-weight="700" text-anchor="middle">Book a free call →</text>`,
  );
}
