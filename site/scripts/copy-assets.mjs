// Copies the generated README images into public/ so the site serves the same files.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(site, "..", "assets");
const to = join(site, "public", "assets");

if (!existsSync(from)) throw new Error(`Missing ${from}. Run \`npm run readme\` in the repo root first.`);
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log("Copied assets/ into site/public/assets");
