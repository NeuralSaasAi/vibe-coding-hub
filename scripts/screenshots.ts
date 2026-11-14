// Takes screenshots of the built site for design review. Start `npm run preview --prefix site` first.
// Usage: npx tsx scripts/screenshots.ts [outDir] [theme]
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.SITE_PREVIEW ?? "http://localhost:4321/vibe-coding-hub";
const out = process.argv[2] ?? "/tmp/vch-shots";
const theme = process.argv[3] ?? "dark";
const pages = ["/", "/tools", "/pricing", "/roadmap", "/which-tool", "/when-it-breaks"];
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
try {
  for (const [label, viewport] of [["desktop", { width: 1366, height: 900 }], ["mobile", { width: 390, height: 844 }]] as const) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
    await context.addInitScript((t) => localStorage.setItem("vch:theme", t), theme);
    const page = await context.newPage();
    for (const path of pages) {
      await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
      const name = path === "/" ? "home" : path.slice(1);
      await page.screenshot({ path: `${out}/${label}-${theme}-${name}.png`, fullPage: label === "desktop" });
      console.log(`${out}/${label}-${theme}-${name}.png`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
