import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loadAll } from "../../lib/data.ts";

const data = loadAll();
const freeBuilders = data.tools.filter((t) => t.category === "ai-app-builders" && t.free_tier).length;
const pages = ["", "tools/", "pricing/", "roadmap/", "which-tool/", "when-it-breaks/"];

test.describe("tool explorer", () => {
  test("filters by category and free tier, and keeps the filter in the URL", async ({ page }) => {
    await page.goto("tools/");
    await expect(page.locator("[data-tool]:visible")).toHaveCount(data.tools.length);

    await page.getByRole("button", { name: /AI app builders/ }).click();
    await page.getByRole("button", { name: /Free tier/ }).click();
    await expect(page).toHaveURL(/category=ai-app-builders/);
    await expect(page).toHaveURL(/free=1/);
    await expect(page.locator("[data-tool]:visible")).toHaveCount(freeBuilders);
    await expect(page.locator("#result-count")).toHaveText(`Showing ${freeBuilders} of ${data.tools.length} tools`);

    await page.reload();
    await expect(page.locator("[data-tool]:visible")).toHaveCount(freeBuilders);
    await expect(page.getByRole("button", { name: /Free tier/ })).toHaveAttribute("aria-pressed", "true");
  });

  test("searches and shows the empty state", async ({ page }) => {
    await page.goto("tools/");
    await page.getByRole("searchbox", { name: "Search tools" }).fill("supabase");
    await expect(page.locator('[data-tool][data-slug="supabase"]')).toBeVisible();
    await page.getByRole("searchbox", { name: "Search tools" }).fill("zzzz-no-such-tool");
    await expect(page.locator("[data-tool]:visible")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Suggest a tool" }).first()).toBeVisible();
  });

  test("lists every tool without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("tools/");
    await expect(page.locator("[data-tool]")).toHaveCount(data.tools.length);
    await context.close();
  });
});

test.describe("pricing", () => {
  test("sorts by entry price", async ({ page }) => {
    await page.goto("pricing/");
    const prices = async () =>
      page.locator("[data-row]").evaluateAll((rows) => rows.map((r) => Number((r as HTMLElement).dataset.price)));
    const asc = await prices();
    expect(asc).toEqual([...asc].sort((a, b) => a - b));

    await page.getByRole("button", { name: /Entry price/ }).click();
    const desc = await prices();
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    await expect(page.locator("th", { has: page.getByRole("button", { name: /Entry price/ }) })).toHaveAttribute("aria-sort", "descending");
  });

  test("prefills the pricing update issue", async ({ page }) => {
    await page.goto("pricing/");
    const link = page.locator('[data-row][data-name="Bolt"]').getByRole("link", { name: "Report a change" });
    await expect(link).toHaveAttribute("href", /template=pricing-update\.yml&title=%5BPricing%5D%20Bolt/);
  });
});

test.describe("roadmap", () => {
  test("opens a stage, saves a tick and restores it after reload", async ({ page }) => {
    await page.goto("roadmap/");
    await page.getByRole("button", { name: "Open step 3: Before you launch" }).click();
    const dialog = page.getByRole("dialog", { name: "Before you launch" });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/#before-you-launch$/);

    await dialog.getByRole("checkbox").first().check();
    await expect(page.locator("#done-count")).toHaveText("1");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await page.reload();
    await expect(page.locator("#done-count")).toHaveText("1");
  });

  test("deep links open the right panel", async ({ page }) => {
    await page.goto("roadmap/#when-something-breaks");
    await expect(page.getByRole("dialog", { name: "When something breaks" })).toBeVisible();
  });

  test("works with the keyboard alone", async ({ page }) => {
    await page.goto("roadmap/");
    const node = page.getByRole("button", { name: "Open step 1: Before you build" });
    await node.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Before you build" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(node).toBeFocused();
  });
});

test.describe("which tool", () => {
  test("SaaS MVP with no coding leads to Lovable, Bolt, Supabase and Stripe", async ({ page }) => {
    await page.goto("which-tool/");
    await page.getByLabel("A SaaS MVP with login and payments").check();
    await page.getByLabel("I don't code").check();
    await page.getByLabel("Whatever gets it done").check();
    const picks = page.locator('[data-r="picks"]');
    for (const name of ["Lovable", "Bolt", "Supabase", "Stripe"]) await expect(picks).toContainText(name);
    await expect(page.locator('[data-r="tools-link"]')).toHaveAttribute("href", /\/tools\/\?ids=lovable,bolt,supabase,stripe/);
  });

  test("the result link opens a filtered tool list", async ({ page }) => {
    await page.goto("which-tool/");
    await page.getByLabel("A mobile app").check();
    await page.locator('[data-r="tools-link"]').click();
    await expect(page).toHaveURL(/\/tools\/\?ids=/);
    await expect(page.locator('[data-tool][data-slug="bolt"]')).toBeVisible();
    await expect(page.locator('[data-tool][data-slug="vercel"]')).toBeHidden();
  });
});

test.describe("when it breaks", () => {
  test("renders the diagram and copies a prompt", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("when-it-breaks/");
    const diagram = page.locator(".diagram img:visible").first();
    await expect(diagram).toBeVisible();
    expect(await diagram.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(100);

    await page.getByRole("button", { name: "Copy prompt" }).first().click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("Before changing any code");
    await expect(page.locator("#copy-status")).toHaveText("Prompt copied to the clipboard.");
  });
});

test.describe("every page", () => {
  for (const path of pages) {
    test(`/${path} has SEO tags, UTM links and no serious accessibility issues`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/neuralsaasai\.github\.io\/vibe-coding-hub\/([a-z-]+\/)?$/);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og\.png$/);
      expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);

      const hrefs = await page.locator('a[href*="neuralsaasai.com"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) expect(href).toContain("utm_source=vibe-coding-hub-site");
      for (const href of hrefs) expect(href).not.toContain("/vibe-coding?");

      for (const theme of ["dark", "light"]) {
        await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
        // Let the theme change finish painting before measuring contrast
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 150)))));
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${theme}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`)).toEqual([]);
      }
    });
  }

  test("robots.txt points at the sitemap", async ({ request }) => {
    const res = await request.get("robots.txt");
    expect(await res.text()).toContain("Sitemap: https://neuralsaasai.github.io/vibe-coding-hub/sitemap-index.xml");
    expect((await request.get("sitemap-index.xml")).status()).toBe(200);
  });
});
