/**
 * Read themed CSS custom properties for Chart.js (client-only).
 */

const TOKEN_MAP = {
  accent: "--tm-accent",
  danger: "--tm-danger",
  "action-warning": "--tm-action-warning",
  "action-delete": "--tm-action-delete",
  "action-ban": "--tm-action-ban",
  "action-reset": "--tm-action-reset",
  "fg-muted": "--tm-fg-muted",
  line: "--tm-line",
} as const;

export type ChartToken = keyof typeof TOKEN_MAP;

export function chartColor(token: ChartToken): string {
  if (import.meta.server) {
    return "oklch(0.5 0 0)";
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(TOKEN_MAP[token])
    .trim();

  return value || "oklch(0.5 0 0)";
}

export function chartColorAlpha(token: ChartToken, alpha: number): string {
  const color = chartColor(token);
  if (color.startsWith("oklch(")) {
    return color.replace(/\)$/, ` / ${alpha})`);
  }
  return color;
}
