import { describe, expect, test, beforeEach } from "bun:test";
import { InMemoryCreditStore } from "@/tests/helpers/in-memory-credit-store";
import { CreditService } from "@/server/core/credit-service";
import { resetDeploymentModeCacheForTests } from "@/server/core/deployment-mode";

function createService(env: NodeJS.ProcessEnv = { DEPLOYMENT_MODE: "saas" }) {
  resetDeploymentModeCacheForTests();
  const store = new InMemoryCreditStore();
  const service = new CreditService({
    env,
    store,
    ledger: store,
  });
  return { store, service };
}

describe("CreditService", () => {
  beforeEach(() => {
    resetDeploymentModeCacheForTests();
  });

  test("grant signup credits to user wallet in saas mode", async () => {
    const { service } = createService();
    const tx = await service.grantSignupCredits("user-1");
    expect(tx?.amount).toBe(100);
    expect(await service.getUserBalance("user-1")).toBe(100);
  });

  test("grant signup credits only once per user", async () => {
    const { service } = createService();
    await service.grantSignupCredits("user-1");
    const second = await service.grantSignupCredits("user-1");
    expect(second).toBeNull();
    expect(await service.getUserBalance("user-1")).toBe(100);
  });

  test("allocate moves credits from user wallet to bot", async () => {
    const { store, service } = createService();
    await store.setUserBalance("user-1", 500);
    await service.allocateToBot({
      userId: "user-1",
      botId: "bot-1",
      amount: 200,
      actorUserId: "user-1",
    });
    expect(await service.getUserBalance("user-1")).toBe(300);
    expect(await service.getBotBalance("bot-1")).toBe(200);
  });

  test("reclaim moves remaining bot balance to owner wallet", async () => {
    const { store, service } = createService();
    await store.setBotBalance("bot-1", 150);
    const result = await service.reclaimFromBot({
      botId: "bot-1",
      ownerUserId: "user-1",
    });
    expect(result).not.toBeNull();
    expect(await service.getBotBalance("bot-1")).toBe(0);
    expect(await service.getUserBalance("user-1")).toBe(150);
  });

  test("debit moderation is no-op in self-hosted mode", async () => {
    const { store, service } = createService({ DEPLOYMENT_MODE: "self-hosted" });
    await store.setBotBalance("bot-1", 5);
    const tx = await service.debitModeration({
      botId: "bot-1",
      chatId: -100,
      messageId: 42,
    });
    expect(tx).toBeNull();
    expect(await service.getBotBalance("bot-1")).toBe(5);
  });

  test("conditional debit prevents negative balance", async () => {
    const { store, service } = createService();
    await store.setBotBalance("bot-1", 0);
    const tx = await service.debitModeration({
      botId: "bot-1",
      chatId: -100,
      messageId: 1,
    });
    expect(tx).toBeNull();
    expect(await service.getBotBalance("bot-1")).toBe(0);
  });

  test("idempotent debit per message", async () => {
    const { store, service } = createService();
    await store.setBotBalance("bot-1", 5);
    const first = await service.debitModeration({
      botId: "bot-1",
      chatId: -100,
      messageId: 99,
    });
    const second = await service.debitModeration({
      botId: "bot-1",
      chatId: -100,
      messageId: 99,
    });

    expect(first?.id).toBeDefined();
    expect(second?.id).toBe(first?.id);
    expect(await service.getBotBalance("bot-1")).toBe(4);
  });

  test("reconcile fixes bot mismatch", async () => {
    const { store, service } = createService();
    await store.setBotBalance("bot-1", 10);
    await store.insertLedgerRow({
      bot_id: "bot-1",
      type: "allocate",
      amount: 100,
      balance_after: 100,
    });

    const result = await service.reconcileBot("bot-1");
    expect(result.fixed).toBe(true);
    expect(await service.getBotBalance("bot-1")).toBe(100);
  });

  test("grantAdminAdjust is no-op in self-hosted mode", async () => {
    const { store, service } = createService({ DEPLOYMENT_MODE: "self-hosted" });
    await store.setBotBalance("bot-1", 50);
    const result = await service.grantAdminAdjust({
      botId: "bot-1",
      amount: 100,
      reason: "support",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("not_saas");
    }
    expect(await service.getBotBalance("bot-1")).toBe(50);
  });

  test("grantAdminAdjust writes admin_adjust ledger row on bot", async () => {
    const { store, service } = createService();
    await store.setBotBalance("bot-1", 10);
    const result = await service.grantAdminAdjust({
      botId: "bot-1",
      amount: 5000,
      reason: "support ticket",
      reference: "admin-grant:test-1",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.created).toBe(true);
      expect(result.transaction.type).toBe("admin_adjust");
      expect(result.transaction.amount).toBe(5000);
    }
    expect(await service.getBotBalance("bot-1")).toBe(5010);
  });

  test("grantAdminAdjust rejects deduction below zero balance", async () => {
    const { store, service } = createService();
    await store.setBotBalance("bot-1", 5);
    const result = await service.grantAdminAdjust({
      botId: "bot-1",
      amount: -10,
      reason: "correction",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("insufficient_balance");
    }
  });

  test("grantAdminAdjust is idempotent on reference", async () => {
    const { service } = createService();
    const first = await service.grantAdminAdjust({
      botId: "bot-1",
      amount: 100,
      reason: "once",
      reference: "admin-grant:dup",
    });
    const second = await service.grantAdminAdjust({
      botId: "bot-1",
      amount: 100,
      reason: "once",
      reference: "admin-grant:dup",
    });
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.created).toBe(false);
      expect(second.transaction.id).toBe(first.transaction.id);
    }
    expect(await service.getBotBalance("bot-1")).toBe(100);
  });
});
