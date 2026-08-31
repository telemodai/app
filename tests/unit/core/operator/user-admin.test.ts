import { describe, expect, test } from "bun:test";
import { formatPromoCodesList } from "@/server/core/operator/promo-list";
import { formatUsersList } from "@/server/core/operator/user-list";
import { formatUserPurgeResult } from "@/server/core/operator/user-purge";

describe("operator user-list", () => {
  test("formatUsersList renders header and rows", () => {
    const output = formatUsersList([
      {
        id: "user-abc",
        telegram_id: 12345,
        username: "alice",
        name: "Alice",
        credit_balance: 100,
        created_at: new Date("2026-01-15T10:00:00Z"),
        updated_at: new Date("2026-01-15T10:00:00Z"),
      },
    ]);

    expect(output).toContain("id");
    expect(output).toContain("user-abc");
    expect(output).toContain("@alice");
    expect(output).toContain("100");
  });

  test("formatUsersList handles empty list", () => {
    expect(formatUsersList([])).toBe("No users found.");
  });
});

describe("operator user-purge", () => {
  test("formatUserPurgeResult summarizes deletion", () => {
    const output = formatUserPurgeResult({
      ok: true,
      user: {
        id: "user-abc",
        telegram_id: 12345,
        username: "alice",
        name: "Alice",
        credit_balance: 0,
        created_at: new Date("2026-01-15T10:00:00Z"),
        updated_at: new Date("2026-01-15T10:00:00Z"),
      },
      counts: {
        promo_redemptions: 1,
        referrals: 0,
        provider_payments: 2,
        credit_transactions: 3,
        login_bot_tokens: 0,
        bots_cascaded: 1,
      },
    });

    expect(output).toContain("User deleted");
    expect(output).toContain("provider_payments: 2");
    expect(output).toContain("owned bots (cascade): 1");
  });
});

describe("operator promo-list", () => {
  test("formatPromoCodesList renders promo rows", () => {
    const output = formatPromoCodesList([
      {
        id: 7,
        code: "SAVE10",
        discount_percent: 10,
        is_active: true,
        expires_at: null,
        created_at: new Date("2026-02-01T12:00:00Z"),
        updated_at: new Date("2026-02-01T12:00:00Z"),
      },
    ]);

    expect(output).toContain("SAVE10");
    expect(output).toContain("valid_now");
  });
});
