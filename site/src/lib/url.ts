/**
 * Joins a base path (like "/vibe-coding-hub" or "/") with a site path.
 * Page paths get a trailing slash, matching how GitHub Pages serves folders.
 * File paths (anything with an extension, like /og.png) are left as they are.
 */
export function joinBase(base: string, path: string): string {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  const b = base.replace(/\/+$/, "");
  const cut = path.search(/[?#]/);
  const pathname = cut === -1 ? path : path.slice(0, cut);
  const rest = cut === -1 ? "" : path.slice(cut);
  let p = pathname.replace(/^\/+/, "");
  const isFile = /\.[a-z0-9]+$/i.test(p);
  if (p && !isFile && !p.endsWith("/")) p += "/";
  return `${b}/${p}` + rest;
}

/** Use for every internal link, so a custom domain needs no code changes. */
export function withBase(path: string): string {
  return joinBase(import.meta.env.BASE_URL ?? "/", path);
}

export const UTM_SOURCE = "vibe-coding-hub-site";

/** neuralsaasai.com links carry UTM tags so visits from the site can be measured. */
export function neuralsaas(path = "/", content?: string): string {
  const url = new URL(path, "https://neuralsaasai.com");
  url.searchParams.set("utm_source", UTM_SOURCE);
  url.searchParams.set("utm_medium", "website");
  url.searchParams.set("utm_campaign", "vibe-coding-hub");
  if (content) url.searchParams.set("utm_content", content);
  return url.toString();
}

export const REPO_URL = "https://github.com/NeuralSaasAi/vibe-coding-hub";
export const editUrl = (path: string) => `${REPO_URL}/edit/main/${path}`;
export const issueUrl = (template: string, title?: string) =>
  `${REPO_URL}/issues/new?template=${template}${title ? `&title=${encodeURIComponent(title)}` : ""}`;
