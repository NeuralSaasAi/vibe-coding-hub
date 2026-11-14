// Renders diagrams/*.mmd to SVG (dark and light) for the website, plus the social preview image.
// GitHub renders the Mermaid blocks in the README itself; the site loads these static SVGs as images, so it needs no script.
// Run after changing a diagram: npm run diagrams
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { findRoot, loadTools, stats } from "../lib/data.ts";

const root = findRoot();
const require = createRequire(import.meta.url);
const mermaidJs = readFileSync(require.resolve("mermaid/dist/mermaid.min.js"), "utf8");
const outDir = join(root, "site", "public", "diagrams");
mkdirSync(outDir, { recursive: true });

const themes = {
  dark: {
    background: "transparent",
    primaryColor: "#18213f",
    primaryTextColor: "#e6e9f5",
    primaryBorderColor: "#7c5cff",
    lineColor: "#22d3ee",
    secondaryColor: "#121a33",
    tertiaryColor: "#0f1529",
    edgeLabelBackground: "#0b1020",
    fontFamily: "ui-sans-serif, -apple-system, Segoe UI, Helvetica, Arial, sans-serif",
    fontSize: "15px",
  },
  light: {
    background: "transparent",
    primaryColor: "#f5f3ff",
    primaryTextColor: "#151a33",
    primaryBorderColor: "#6d4cf5",
    lineColor: "#0891b2",
    secondaryColor: "#ffffff",
    tertiaryColor: "#fbfaff",
    edgeLabelBackground: "#ffffff",
    fontFamily: "ui-sans-serif, -apple-system, Segoe UI, Helvetica, Arial, sans-serif",
    fontSize: "15px",
  },
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: mermaidJs });

  for (const file of readdirSync(join(root, "diagrams")).filter((f) => f.endsWith(".mmd")).sort()) {
    const name = file.replace(/\.mmd$/, "");
    const source = readFileSync(join(root, "diagrams", file), "utf8");
    for (const [theme, themeVariables] of Object.entries(themes)) {
      const svg = await page.evaluate(
        async ({ source, id, themeVariables }) => {
          const m = (window as unknown as { mermaid: any }).mermaid;
          m.initialize({ startOnLoad: false, theme: "base", themeVariables, htmlLabels: false, flowchart: { htmlLabels: false, curve: "basis" }, securityLevel: "strict" });
          const { svg } = await m.render(id, source);
          const holder = document.createElement("div");
          holder.innerHTML = svg;
          const el = holder.querySelector("svg")!;
          // Fixed size so the file renders the same as an <img> in every browser
          const [, , w, h] = el.getAttribute("viewBox")!.split(" ").map(Number);
          el.setAttribute("width", String(Math.ceil(w!)));
          el.setAttribute("height", String(Math.ceil(h!)));
          el.removeAttribute("style");
          return new XMLSerializer().serializeToString(el);
        },
        { source, id: `${name}-${theme}`, themeVariables },
      );
      writeFileSync(join(outDir, `${name}.${theme}.svg`), `${svg}\n`);
      console.log(`site/public/diagrams/${name}.${theme}.svg`);
    }
  }

  // Social preview: 1200x630 PNG built from the dark banner.
  const s = stats(loadTools(root));
  const banner = readFileSync(join(root, "assets", "banner-dark.svg"), "utf8");
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.setContent(`<!doctype html><html><body style="margin:0;width:1200px;height:630px;background:linear-gradient(135deg,#0b1020,#1a1240);font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#e6e9f5;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:26px">
    <div style="width:1080px">${banner.replace(/width="1200" height="380"/, 'width="1080" height="342"')}</div>
    <div style="font-size:40px;font-weight:800;letter-spacing:-0.02em">Ship the app. <span style="background:linear-gradient(90deg,#7c5cff,#22d3ee);-webkit-background-clip:text;color:transparent">Keep it alive.</span></div>
    <div style="font-size:22px;color:#aab2d5">${s.tools} tools · ${s.freeTiers} free tiers · prices verified ${s.latestVerified}</div>
  </body></html>`);
  mkdirSync(join(root, "site", "public"), { recursive: true });
  await og.screenshot({ path: join(root, "site", "public", "og.png") });
  console.log("site/public/og.png");
} finally {
  await browser.close();
}
