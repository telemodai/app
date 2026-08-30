import { describe, expect, test } from "bun:test";
import { CreditService } from "@/server/core/credit-service";
import {
  parseGrantAmount,
  runCreditsGrantOperator,
  validateGrantReason,
} from "@/server/core/operator/credits-grant";
import { InMemoryCreditStore } from "@/tests/helpers/in-memory-credit-store";

describe("operator credits-grant helpers", () => {
  test("parseGrantAmount accepts signed non-zero integers", () => {
    expect(parseGrantAmount("5000")).toBe(5000);
    expect(parseGrantAmount("-100")).toBe(-100);
    expect(parseGrantAmount("0")).toBeNull();
    expect(parseGrantAmount("1.5")).toBeNull();
    expect(parseGrantAmount("")).toBeNull();
  });

  test("validateGrantReason requires non-empty text", () => {
    expect(validateGrantReason(" support ")).toBe("support");
    expect(validateGrantReason("")).toBeNull();
    expect(validateGrantReason(undefined)).toBeNull();
  });
});

describe("runCreditsGrantOperator", () => {
  test("requires exactly one target", async () => {
    const store = new InMemoryCreditStore();
    const service = new CreditService({
      env: { DEPLOYMENT_MODE: "saas" },
      store,
      ledger: store,
    });

    const missing = await runCreditsGrantOperator(
      { amount: 100, reason: "support" },
      service
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error).toBe("missing_target");
    }

    const ambiguous = await runCreditsGrantOperator(
      { bot_id: "bot1", user_id: "user1", amount: 100, reason: "support" },
      service
    );
    expect(ambiguous.ok).toBe(false);
    if (!ambiguous.ok) {
      expect(ambiguous.error).toBe("ambiguous_target");
    }
  });
});
