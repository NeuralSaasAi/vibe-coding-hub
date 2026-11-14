import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findRoot } from "../lib/data.ts";

export const repoRoot = findRoot(import.meta.dirname);

/** Copies the data, content and diagrams into a temp folder so tests can break files safely. */
export function tempRepo(): { root: string; write: (path: string, text: string) => void; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), "vch-"));
  for (const dir of ["data", "content", "diagrams"]) {
    cpSync(join(repoRoot, dir), join(root, dir), { recursive: true });
  }
  return {
    root,
    write: (path, text) => writeFileSync(join(root, path), text),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
