import { describe, expect, test } from "bun:test";
import { buildCliProgram } from "@/scripts/cli";

describe("operator cli program", () => {
  test("registers promo create and global help", () => {
    const program = buildCliProgram();
    const help = program.helpInformation();

    expect(help).toContain("promo");
    expect(help).toContain("credits");
    expect(help).toContain("Operator CLI");
  });
});
