import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dir, "../../..");
const CORE_ROOT = path.join(PROJECT_ROOT, "server/core");
const ALIAS_IMPORT_RE = /from\s+["']@\/([^"']+)["']/g;
const RELATIVE_IMPORT_RE = /from\s+["'](\.[^"']+)["']/g;

function collectTsFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      continue;
    }

    if (entry.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function resolveAliasImport(importPath: string): string | null {
  const resolved = path.resolve(PROJECT_ROOT, importPath);
  const candidates = [
    resolved,
    `${resolved}.ts`,
    path.join(resolved, "index.ts"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function resolveRelativeImport(fromFile: string, importPath: string): string | null {
  const resolved = path.resolve(path.dirname(fromFile), importPath);
  const candidates = [
    resolved,
    `${resolved}.ts`,
    path.join(resolved, "index.ts"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

describe("server/core import paths", () => {
  test("@/ alias imports resolve to existing files", () => {
    const failures: string[] = [];

    for (const file of collectTsFiles(CORE_ROOT)) {
      const content = readFileSync(file, "utf8");

      for (const match of content.matchAll(ALIAS_IMPORT_RE)) {
        const importPath = match[1];
        if (!importPath) {
          continue;
        }

        if (!resolveAliasImport(importPath)) {
          failures.push(`${path.relative(CORE_ROOT, file)} -> @/${importPath}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  test("same-directory relative imports resolve to existing files", () => {
    const failures: string[] = [];

    for (const file of collectTsFiles(CORE_ROOT)) {
      const content = readFileSync(file, "utf8");

      for (const match of content.matchAll(RELATIVE_IMPORT_RE)) {
        const importPath = match[1];
        if (!importPath || importPath.includes("../")) {
          continue;
        }

        if (!resolveRelativeImport(file, importPath)) {
          failures.push(`${path.relative(CORE_ROOT, file)} -> ${importPath}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
