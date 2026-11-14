import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Switching to a custom domain is a config change only:
//   SITE_URL=https://vibecodinghub.neuralsaasai.com BASE_PATH=/ npm run build
// Empty values count as unset, because GitHub passes unset repository variables as "".
const site = process.env.SITE_URL || "https://neuralsaasai.github.io";
const base = process.env.BASE_PATH || "/vibe-coding-hub";

export default defineConfig({
  site,
  base,
  // GitHub Pages serves folders, so every page URL ends in a slash. Matching it avoids redirects.
  trailingSlash: "always",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // The site reads data and helpers from the repo root (../data, ../lib, ../schema)
    server: { fs: { allow: [".."] } },
  },
});
