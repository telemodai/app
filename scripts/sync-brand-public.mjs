#!/usr/bin/env node
/**
 * Copies brand export registers into public/ for favicons and PWA assets.
 *
 *   bun scripts/sync-brand-public.mjs
 *
 * Source (first match): ./brand/assets/export/ or ../site/brand/assets/export/
 */

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const EXPORT_ROOTS = [
  join(ROOT, "brand/assets/export"),
  join(ROOT, "../site/brand/assets/export"),
];

const EXPORT_ROOT = EXPORT_ROOTS.find((dir) => existsSync(dir));
const PUBLIC = join(ROOT, "public");

const REGISTERS = ["dark", "light"];
const DIRS = ["favicon", "pwa", "avatars", "social"];
const FILES = ["apple-touch-icon.png"];

if (!EXPORT_ROOT) {
  console.warn(
    "sync-brand-public: no brand export found. Skipping (use committed public/{dark,light}/)."
  );
  process.exit(0);
}

for (const register of REGISTERS) {
  const source = join(EXPORT_ROOT, register);
  if (!existsSync(source)) {
    console.error(`Missing ${source}. Run brand:logo in site repo.`);
    process.exit(1);
  }

  const dest = join(PUBLIC, register);
  mkdirSync(dest, { recursive: true });

  for (const dir of DIRS) {
    const from = join(source, dir);
    const to = join(dest, dir);
    rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true });
  }

  for (const file of FILES) {
    cpSync(join(source, file), join(dest, file));
  }
}

console.log(`Synced ${EXPORT_ROOT}/{dark,light} → public/{dark,light}/`);
