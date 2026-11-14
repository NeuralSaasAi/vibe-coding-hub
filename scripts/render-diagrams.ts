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
    primaryColor: "#1c1b18",
    primaryTextColor: "#edebe4",
    primaryBorderColor: "#edebe4",
    lineColor: "#aaa597",
    secondaryColor: "#191815",
    tertiaryColor: "#131210",
    edgeLabelBackground: "#131210",
    fontFamily: "IBM Plex Sans, ui-sans-serif, -apple-system, Segoe UI, Helvetica, Arial, sans-serif",
    fontSize: "15px",
  },
  light: {
    background: "transparent",
    primaryColor: "#fbfaf7",
    primaryTextColor: "#16150f",
    primaryBorderColor: "#16150f",
    lineColor: "#57534a",
    secondaryColor: "#efece3",
    tertiaryColor: "#f6f4ee",
    edgeLabelBackground: "#f6f4ee",
    fontFamily: "IBM Plex Sans, ui-sans-serif, -apple-system, Segoe UI, Helvetica, Arial, sans-serif",
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

  // Social preview: 1200x630 PNG in the site's editorial style.
  const s = stats(loadTools(root));
  const fontDir = join(root, "site", "node_modules", "@fontsource");
  const font = (pkg: string, file: string) => `data:font/woff2;base64,${readFileSync(join(fontDir, pkg, "files", file)).toString("base64")}`;
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.setContent(`<!doctype html><html><head><style>
    @font-face { font-family: Serif; src: url(${font("instrument-serif", "instrument-serif-latin-400-normal.woff2")}); }
    @font-face { font-family: Serif; font-style: italic; src: url(${font("instrument-serif", "instrument-serif-latin-400-italic.woff2")}); }
    @font-face { font-family: Mono; src: url(${font("ibm-plex-mono", "ibm-plex-mono-latin-400-normal.woff2")}); }
    body { margin: 0; width: 1200px; height: 630px; background: #f6f4ee; color: #16150f; box-sizing: border-box; padding: 64px 72px; display: flex; flex-direction: column; font-family: Mono; }
    .top { display: flex; justify-content: space-between; font-size: 20px; letter-spacing: .06em; text-transform: uppercase; color: #57534a; border-bottom: 2px solid #16150f; padding-bottom: 22px; }
    h1 { font-family: Serif; font-weight: 400; font-size: 132px; line-height: .95; letter-spacing: -.015em; margin: 44px 0 0; }
    em { color: #b23a09; }
    .stats { margin-top: auto; display: flex; border-top: 1px solid #b3ac9a; font-size: 20px; color: #57534a; }
    .stats div { flex: 1; padding-top: 18px; }
    .stats b { display: block; font-family: Serif; font-weight: 400; font-size: 48px; color: #16150f; margin-top: 4px; }
  </style></head><body>
    <div class="top"><span>Vibe Coding Hub</span><span>verified ${s.latestVerified}</span></div>
    <h1>Ship the app.<br>Keep it <em>alive.</em></h1>
    <div class="stats">
      <div>tools<b>${s.tools}</b></div><div>free tiers<b>${s.freeTiers}</b></div><div>dated prices<b>${s.prices}</b></div><div>open source<b>${s.openSource}</b></div>
    </div>
  </body></html>`);
  await og.waitForTimeout(200);
  mkdirSync(join(root, "site", "public"), { recursive: true });
  await og.screenshot({ path: join(root, "site", "public", "og.png") });
  console.log("site/public/og.png");
} finally {
  await browser.close();
}
