// Opens each built page and prints browser console errors and failed requests. Start the preview server first.
import { chromium } from "@playwright/test";

const base = process.env.SITE_PREVIEW ?? "http://localhost:4321/vibe-coding-hub";
const pages = ["/", "/tools", "/pricing", "/roadmap", "/which-tool", "/when-it-breaks", "/404"];
const browser = await chromium.launch();
let problems = 0;
try {
  const page = await browser.newPage();
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const source = m.location().url ?? "";
    // Third-party calls (GitHub API stars, contrib.rocks) may be rate limited; the page handles that.
    if (source && !source.startsWith(base)) return console.log(`(ignored third-party) ${source}: ${m.text()}`);
    problems++;
    console.log(`console error on ${page.url()}: ${m.text()} ${source}`);
  });
  page.on("pageerror", (e) => {
    problems++;
    console.log(`page error on ${page.url()}: ${e.message}`);
  });
  page.on("requestfailed", (r) => {
    if (r.url().startsWith(base)) {
      problems++;
      console.log(`failed request: ${r.url()}`);
    }
  });
  page.on("response", (r) => {
    if (r.url().startsWith(base) && r.status() >= 400 && !r.url().endsWith("/404")) {
      problems++;
      console.log(`HTTP ${r.status()}: ${r.url()}`);
    }
  });
  for (const path of pages) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.mouse.wheel(0, 20000);
    await page.waitForTimeout(400);
  }
  // Images that failed to decode
  for (const path of ["/which-tool", "/when-it-breaks"]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll("img").forEach((i) => i.scrollIntoView()));
    await page.waitForTimeout(800);
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        // Third-party community images (contrib.rocks) can be empty for a new repo; only our own files must load
        .filter((i) => i.src.startsWith(location.origin) && i.complete && i.naturalWidth === 0 && i.offsetParent !== null)
        .map((i) => i.src),
    );
    for (const src of broken) {
      problems++;
      console.log(`broken image on ${path}: ${src}`);
    }
  }
} finally {
  await browser.close();
}
console.log(problems ? `${problems} problems` : "No console errors, failed requests or broken images.");
process.exit(problems ? 1 : 0);
