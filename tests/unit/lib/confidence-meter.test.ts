import { describe, expect, test } from "bun:test";
import {
  clampConfidence,
  confidenceFillColor,
  confidencePercent,
} from "@/lib/confidence-meter";

describe("confidence-meter", () => {
  test("clampConfidence bounds 0..1", () => {
    expect(clampConfidence(0.72)).toBe(0.72);
    expect(clampConfidence(-1)).toBe(0);
    expect(clampConfidence(2)).toBe(1);
    expect(clampConfidence(Number.NaN)).toBe(0);
  });

  test("confidencePercent rounds to integer percent", () => {
    expect(confidencePercent(0.724)).toBe(72);
    expect(confidencePercent(0.455)).toBe(46);
  });

  test("confidenceFillColor uses themed CSS color-mix", () => {
    expect(confidenceFillColor(0)).toContain("var(--tm-danger)");
    expect(confidenceFillColor(50)).toContain("var(--tm-action-warning)");
    expect(confidenceFillColor(100)).toContain("var(--tm-action-unban)");
  });
});
