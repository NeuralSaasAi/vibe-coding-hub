/** Joins a base path (like "/vibe-coding-hub" or "/") with a site path. */
export function joinBase(base: string, path: string): string {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  const b = base.replace(/\/+$/, "");
  const [pathname, rest = ""] = path.split(/(?=[?#])/, 2) as [string, string?];
  const p = pathname.replace(/^\/+/, "");
  const joined = `${b}/${p}`;
  return (joined === "" ? "/" : joined) + rest;
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
