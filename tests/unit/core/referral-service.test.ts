import { describe, expect, test, beforeEach } from "bun:test";
import { ReferralService } from "@/server/core/referral-service";
import { InMemoryCreditStore } from "@/tests/helpers/in-memory-credit-store";
import { CreditService } from "@/server/core/credit-service";
import { resetDeploymentModeCacheForTests } from "@/server/core/deployment-mode";
import type { AppUser } from "@/server/database/models/user";

function user(
  id: string,
  createdAt: string,
  referralCode?: string | null
): AppUser {
  return {
    id,
    telegram_id: Number(id.replace(/\D/g, "") || "1"),
    name: id,
    referral_code: referralCode ?? null,
    created_at: new Date(createdAt),
    updated_at: new Date(createdAt),
    credit_balance: 0,
  };
}

describe("ReferralService", () => {
  beforeEach(() => {
    resetDeploymentModeCacheForTests();
  });

  test("skips self-referral", async () => {
    const store = new InMemoryCreditStore();
    const creditService = new CreditService({
      env: { DEPLOYMENT_MODE: "saas" },
      store,
      ledger: store,
    });

    const users = new Map<string, AppUser>([
      ["referrer", user("referrer", "2026-01-01", "FRIEND10")],
    ]);

    const service = new ReferralService({
      env: { DEPLOYMENT_MODE: "saas" },
      store: {
        async findUserByReferralCode() {
          return users.get("referrer") ?? null;
        },
        async findUserById(id: string) {
          return users.get(id) ?? null;
        },
        async findReferralByPaymentId() {
          return null;
        },
        async findReferralByReferee() {
          return null;
        },
        async countPriorPurchases() {
          return 0;
        },
        async createReferral() {
          return { id: 1 };
        },
      },
      creditService,
    });

    const self = await service.processPaidPurchase({
      providerPaymentId: "pay-self",
      refereeUserId: "referrer",
      baseCredits: 10_000,
      referralCodeFromCheckout: "FRIEND10",
    });
    expect(self.status).toBe("skipped");
    if (self.status === "skipped") {
      expect(self.reason).toBe("self_referral");
    }
  });

  test("skips when not first purchase", async () => {
    const store = new InMemoryCreditStore();
    const creditService = new CreditService({
      env: { DEPLOYMENT_MODE: "saas" },
      store,
      ledger: store,
    });

    const users = new Map<string, AppUser>([
      ["referrer", user("referrer", "2026-01-01", "FRIEND10")],
      ["referee", user("referee", "2026-06-01")],
    ]);

    const service = new ReferralService({
      env: { DEPLOYMENT_MODE: "saas" },
      store: {
        async findUserByReferralCode() {
          return users.get("referrer") ?? null;
        },
        async findUserById(id: string) {
          return users.get(id) ?? null;
        },
        async findReferralByPaymentId() {
          return null;
        },
        async findReferralByReferee() {
          return null;
        },
        async countPriorPurchases() {
          return 1;
        },
        async createReferral() {
          return { id: 1 };
        },
      },
      creditService,
    });

    const notFirst = await service.processPaidPurchase({
      providerPaymentId: "pay-2",
      refereeUserId: "referee",
      baseCredits: 10_000,
      referralCodeFromCheckout: "FRIEND10",
    });
    expect(notFirst.status).toBe("skipped");
    if (notFirst.status === "skipped") {
      expect(notFirst.reason).toBe("not_first_purchase");
    }
  });

  test("grants referee and referrer bonuses to user wallets immediately", async () => {
    const store = new InMemoryCreditStore();
    const creditService = new CreditService({
      env: { DEPLOYMENT_MODE: "saas" },
      store,
      ledger: store,
    });

    const users = new Map<string, AppUser>([
      ["referrer", user("referrer", "2026-01-01", "FRIEND10")],
      ["referee", user("referee", "2026-06-01")],
    ]);

    let createdReferral:
      | {
          referrer_status: string;
          referee_bonus_credits: number;
          referrer_bonus_credits: number;
        }
      | undefined;

    const referralStore = {
      async findUserByReferralCode() {
        return users.get("referrer") ?? null;
      },
      async findUserById(id: string) {
        return users.get(id) ?? null;
      },
      async findReferralByPaymentId() {
        return null;
      },
      async findReferralByReferee() {
        return null;
      },
      async countPriorPurchases() {
        return 0;
      },
      async createReferral(input: {
        referrer_status: string;
        referee_bonus_credits: number;
        referrer_bonus_credits: number;
      }) {
        createdReferral = input;
        return { id: 42 };
      },
    };

    const service = new ReferralService({
      env: { DEPLOYMENT_MODE: "saas" },
      store: referralStore,
      creditService,
    });

    const result = await service.processPaidPurchase({
      providerPaymentId: "pay-ok",
      refereeUserId: "referee",
      baseCredits: 10_000,
      referralCodeFromCheckout: "FRIEND10",
    });

    expect(result.status).toBe("applied");
    expect(createdReferral?.referrer_status).toBe("claimed");
    expect(createdReferral?.referee_bonus_credits).toBe(1000);
    expect(await creditService.getUserBalance("referee")).toBe(1000);
    expect(await creditService.getUserBalance("referrer")).toBe(1000);
  });
});
