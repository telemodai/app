/** AI confidence 0..1 → display percent and themed fill color (app action tokens). */

export function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

export function confidencePercent(value: number): number {
  return Math.round(clampConfidence(value) * 100);
}

/**
 * Two-segment OKLCH mix: danger → warning (0–50%), warning → unban (50–100%).
 * Uses existing --tm-* tokens so light/dark themes stay correct.
 */
export function confidenceFillColor(percent: number): string {
  const p = Math.max(0, Math.min(100, percent));

  if (p <= 50) {
    const weight = (1 - p / 50) * 100;
    return `color-mix(in oklch, var(--tm-danger) ${weight}%, var(--tm-action-warning))`;
  }

  const weight = (1 - (p - 50) / 50) * 100;
  return `color-mix(in oklch, var(--tm-action-warning) ${weight}%, var(--tm-action-unban))`;
}
