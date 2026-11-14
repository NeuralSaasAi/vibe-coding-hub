import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findRoot } from "../lib/data.ts";

export const repoRoot = findRoot(import.meta.dirname);

/** Copies data/ and content/ into a temp folder so tests can break files safely. */
export function tempRepo(): { root: string; write: (path: string, text: string) => void; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), "vch-"));
  cpSync(join(repoRoot, "data"), join(root, "data"), { recursive: true });
  cpSync(join(repoRoot, "content"), join(root, "content"), { recursive: true });
  return {
    root,
    write: (path, text) => writeFileSync(join(root, path), text),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
