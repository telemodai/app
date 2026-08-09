#!/usr/bin/env node
/**
 * Copies upstream brand CSS into assets/brand/css/ for committed vendored tokens.
 *
 *   bun scripts/sync-brand-css.mjs
 *
 * Source (first match): ./brand/css/ or ../site/brand/css/
 */

import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEST = join(ROOT, "assets/brand/css");

const SOURCES = [
  join(ROOT, "brand/css"),
  join(ROOT, "../site/brand/css"),
];

const FILES = ["tokens.css", "theme.css"];

const sourceRoot = SOURCES.find((dir) => existsSync(join(dir, "tokens.css")));

if (!sourceRoot) {
  console.warn(
    "sync-brand-css: no upstream brand/css found (brand/ symlink or ../site/brand). Skipping."
  );
  process.exit(0);
}

for (const file of FILES) {
  copyFileSync(join(sourceRoot, file), join(DEST, file));
}

console.log(`Synced ${sourceRoot} → ${DEST}`);
