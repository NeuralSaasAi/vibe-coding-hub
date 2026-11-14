import { Marked } from "marked";

const ALERT_LABELS: Record<string, string> = {
  NOTE: "Note",
  TIP: "Tip",
  IMPORTANT: "Important",
  WARNING: "Watch out",
  CAUTION: "Caution",
};

const marked = new Marked({ gfm: true });

marked.use({
  renderer: {
    link({ href, tokens }) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:/.test(href);
      return `<a href="${href}"${external ? ' rel="noopener" target="_blank"' : ""}>${text}</a>`;
    },
  },
});

/** Converts GitHub alert blockquotes into styled callouts. */
function alerts(html: string): string {
  return html.replace(
    /<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*?)<\/blockquote>/g,
    (_, kind: string, body: string) =>
      `<aside class="callout callout-${kind.toLowerCase()}"><p class="callout-title">${ALERT_LABELS[kind]}</p><p>${body}</aside>`,
  );
}

export function renderMarkdown(source: string): string {
  return alerts(marked.parse(source, { async: false }) as string);
}

/** Pulls the numbered steps and the text code blocks out of a guide stage. */
export function extractSteps(source: string): { title: string; text: string }[] {
  return [...source.matchAll(/^\d+\. \*\*(.+?)\*\* (.+)$/gm)].map((m) => ({
    title: m[1]!.replace(/\.$/, ""),
    text: renderInline(m[2]!),
  }));
}

export function extractPrompts(source: string): string[] {
  return [...source.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1]!.trim());
}

export function renderInline(source: string): string {
  return marked.parseInline(source, { async: false }) as string;
}
