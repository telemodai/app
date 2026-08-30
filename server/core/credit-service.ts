import { eq, sql, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { isSaasMode } from "./deployment-mode";
import { logger } from "./logger";
import { SIGNUP_CREDIT_GRANT } from "./credit-packages";
import { BotRepository } from "@/server/database/repositories/bot-repository";
import { UserRepository } from "@/server/database/repositories/user-repository";
import { CreditTransactionRepository } from "@/server/database/repositories/credit-transaction-repository";
import { bots } from "@/server/database/schema";
import { users } from "@/server/database/auth-schema";
import { getDatabaseConnection } from "@/server/database/connection";
import type { CreditTransaction } from "@/server/database/models/credit-transaction";

export type DebitModerationInput = {
  botId: string;
  chatId: number;
  messageId: number;
};

export type BotCreditStore = {
  getBotBalance(botId: string): Promise<number>;
  conditionalDebit(botId: string): Promise<number | null>;
  applyBotDelta(botId: string, amount: number): Promise<number>;
};

export type UserCreditStore = {
  getUserBalance(userId: string): Promise<number>;
  applyUserDelta(userId: string, amount: number): Promise<number>;
};

export type CreditStore = BotCreditStore & UserCreditStore;

export type CreditLedger = {
  create(input: {
    user_id?: string | null;
    bot_id?: string | null;
    type: CreditTransaction["type"];
    amount: number;
    balance_after: number;
    chat_id?: number | null;
    reference?: string | null;
    actor_user_id?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<CreditTransaction>;
  findDebitModeration(
    botId: string,
    chatId: number,
    messageId: number
  ): Promise<CreditTransaction | null>;
  findPurchaseByProviderPaymentId(
    paymentId: string
  ): Promise<CreditTransaction | null>;
  findByReferenceAndType?(
    reference: string,
    type: CreditTransaction["type"]
  ): Promise<CreditTransaction | null>;
  sumAmountByBot(botId: string): Promise<number>;
  sumAmountByUser(userId: string): Promise<number>;
};

export class InsufficientWalletError extends Error {
  constructor(userId: string, required: number, available: number) {
    super(
      `Insufficient wallet balance for user ${userId}: need ${required}, have ${available}`
    );
    this.name = "InsufficientWalletError";
  }
}

class DrizzleCreditStore implements CreditStore {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async getBotBalance(botId: string): Promise<number> {
    const botRepo = new BotRepository();
    return botRepo.getCreditBalance(botId);
  }

  async getUserBalance(userId: string): Promise<number> {
    const userRepo = new UserRepository();
    return userRepo.getCreditBalance(userId);
  }

  async conditionalDebit(botId: string): Promise<number | null> {
    const updated = await this.db
      .update(bots)
      .set({
        creditBalance: sql`${bots.creditBalance} - 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(bots.id, botId), sql`${bots.creditBalance} >= 1`))
      .returning({ creditBalance: bots.creditBalance });

    return updated[0]?.creditBalance ?? null;
  }

  async applyBotDelta(botId: string, amount: number): Promise<number> {
    const updated = await this.db
      .update(bots)
      .set({
        creditBalance: sql`${bots.creditBalance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(bots.id, botId))
      .returning({ creditBalance: bots.creditBalance });

    if (updated.length === 0) {
      throw new Error(`Bot not found: ${botId}`);
    }

    return updated[0]!.creditBalance;
  }

  async applyUserDelta(userId: string, amount: number): Promise<number> {
    const updated = await this.db
      .update(users)
      .set({
        creditBalance: sql`${users.creditBalance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ creditBalance: users.creditBalance });

    if (updated.length === 0) {
      throw new Error(`User not found: ${userId}`);
    }

    return updated[0]!.creditBalance;
  }
}

type CreditServiceOptions = {
  env?: NodeJS.ProcessEnv;
  store?: CreditStore;
  ledger?: CreditLedger;
};

export type GrantAdminAdjustError =
  | "not_saas"
  | "invalid_amount"
  | "missing_reason"
  | "bot_not_found"
  | "user_not_found"
  | "insufficient_balance";

export type GrantAdminAdjustResult =
  | { ok: true; transaction: CreditTransaction; created: boolean }
  | { ok: false; error: GrantAdminAdjustError };

export class CreditService {
  private env: NodeJS.ProcessEnv;
  private store: CreditStore;
  private ledger: CreditLedger;

  constructor(options: CreditServiceOptions = {}) {
    this.env = options.env ?? process.env;
    this.store = options.store ?? new DrizzleCreditStore();
    this.ledger = options.ledger ?? new CreditTransactionRepository();
  }

  isBillingEnabled(): boolean {
    return isSaasMode(this.env);
  }

  /** Bot operating balance (moderation). */
  async getBotBalance(botId: string): Promise<number> {
    return this.store.getBotBalance(botId);
  }

  /** Alias for bot operating balance. */
  async getBalance(botId: string): Promise<number> {
    return this.getBotBalance(botId);
  }

  async getUserBalance(userId: string): Promise<number> {
    return this.store.getUserBalance(userId);
  }

  async grantSignupCredits(userId: string): Promise<CreditTransaction | null> {
    if (!this.isBillingEnabled()) {
      return null;
    }

    const reference = `signup:${userId}`;
    const existing = await this.ledger.findByReferenceAndType?.(
      reference,
      "grant_signup"
    );
    if (existing) {
      return null;
    }

    return this.applyUserCreditDelta({
      userId,
      amount: SIGNUP_CREDIT_GRANT,
      type: "grant_signup",
      reference,
      metadata: { reason: "new_user" },
    });
  }

  async grantPurchase(input: {
    userId: string;
    credits: number;
    actorUserId: string;
    providerPaymentId: string;
    packageId: string;
    amountRub: number;
    originalAmountRub?: number;
    promoCode?: string;
  }): Promise<CreditTransaction> {
    const metadata: Record<string, unknown> = {
      package_id: input.packageId,
      amount_rub: input.amountRub,
      provider_payment_id: input.providerPaymentId,
    };
    if (
      input.originalAmountRub !== undefined &&
      input.originalAmountRub !== input.amountRub
    ) {
      metadata.original_amount_rub = input.originalAmountRub;
    }
    if (input.promoCode) {
      metadata.promo_code = input.promoCode;
    }

    return this.applyUserCreditDelta({
      userId: input.userId,
      amount: input.credits,
      type: "purchase",
      actorUserId: input.actorUserId,
      reference: input.providerPaymentId,
      metadata,
    });
  }

  async grantAdminAdjust(input: {
    botId?: string;
    userId?: string;
    amount: number;
    reason: string;
    actorUserId?: string;
    reference?: string;
    operatorNote?: string;
    metadata?: Record<string, unknown>;
  }): Promise<GrantAdminAdjustResult> {
    if (!this.isBillingEnabled()) {
      return { ok: false, error: "not_saas" };
    }

    if (!input.botId && !input.userId) {
      return { ok: false, error: "invalid_amount" };
    }

    const reason = input.reason.trim();
    if (!reason) {
      return { ok: false, error: "missing_reason" };
    }

    if (!Number.isInteger(input.amount) || input.amount === 0) {
      return { ok: false, error: "invalid_amount" };
    }

    const reference = input.reference?.trim() || `admin-grant:${randomUUID()}`;

    const existing = await this.ledger.findByReferenceAndType?.(
      reference,
      "admin_adjust"
    );
    if (existing) {
      return { ok: true, transaction: existing, created: false };
    }

    if (input.userId) {
      const balance = await this.getUserBalance(input.userId);
      if (input.amount < 0 && balance + input.amount < 0) {
        return { ok: false, error: "insufficient_balance" };
      }
    } else if (input.botId) {
      const balance = await this.getBotBalance(input.botId);
      if (input.amount < 0 && balance + input.amount < 0) {
        return { ok: false, error: "insufficient_balance" };
      }
    }

    const metadata: Record<string, unknown> = {
      reason,
      source: "cli",
      ...input.metadata,
    };
    const operatorNote = input.operatorNote?.trim();
    if (operatorNote) {
      metadata.operator_note = operatorNote;
    }

    try {
      if (input.userId) {
        const transaction = await this.applyUserCreditDelta({
          userId: input.userId,
          amount: input.amount,
          type: "admin_adjust",
          actorUserId: input.actorUserId,
          reference,
          metadata,
        });
        return { ok: true, transaction, created: true };
      }

      const transaction = await this.applyBotCreditDelta({
        botId: input.botId!,
        amount: input.amount,
        type: "admin_adjust",
        actorUserId: input.actorUserId,
        reference,
        metadata,
      });
      return { ok: true, transaction, created: true };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Bot not found:")) {
        return { ok: false, error: "bot_not_found" };
      }
      if (error instanceof Error && error.message.startsWith("User not found:")) {
        return { ok: false, error: "user_not_found" };
      }
      throw error;
    }
  }

  async grantReferralBonus(input: {
    userId: string;
    credits: number;
    actorUserId: string;
    referralId: number;
    role: "referrer" | "referee";
    baseCredits: number;
    percent: number;
    providerPaymentId: string;
    reference?: string;
    metadata?: Record<string, unknown>;
  }): Promise<CreditTransaction | null> {
    if (input.credits <= 0) {
      return null;
    }

    const reference =
      input.reference ?? `referral:${input.referralId}:${input.role}`;
    const existing = await this.ledger.findByReferenceAndType?.(
      reference,
      "referral_bonus"
    );
    if (existing) {
      return existing;
    }

    return this.applyUserCreditDelta({
      userId: input.userId,
      amount: input.credits,
      type: "referral_bonus",
      actorUserId: input.actorUserId,
      reference,
      metadata: {
        referral_id: input.referralId,
        role: input.role,
        percent: input.percent,
        base_credits: input.baseCredits,
        provider_payment_id: input.providerPaymentId,
        ...input.metadata,
      },
    });
  }

  async allocateToBot(input: {
    userId: string;
    botId: string;
    amount: number;
    actorUserId: string;
  }): Promise<{ userTransaction: CreditTransaction; botTransaction: CreditTransaction }> {
    if (!this.isBillingEnabled()) {
      throw new Error("Billing is disabled");
    }

    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new Error("Allocate amount must be a positive integer");
    }

    const available = await this.getUserBalance(input.userId);
    if (available < input.amount) {
      throw new InsufficientWalletError(input.userId, input.amount, available);
    }

    const reference = `allocate:${randomUUID()}`;
    const metadata = {
      bot_id: input.botId,
      allocate_reference: reference,
    };

    const userTransaction = await this.applyUserCreditDelta({
      userId: input.userId,
      amount: -input.amount,
      type: "allocate",
      actorUserId: input.actorUserId,
      reference,
      metadata,
    });

    const botTransaction = await this.applyBotCreditDelta({
      botId: input.botId,
      amount: input.amount,
      type: "allocate",
      actorUserId: input.actorUserId,
      reference,
      metadata: { user_id: input.userId, allocate_reference: reference },
    });

    return { userTransaction, botTransaction };
  }

  async reclaimFromBot(input: {
    botId: string;
    ownerUserId: string;
  }): Promise<{ userTransaction: CreditTransaction; botTransaction: CreditTransaction } | null> {
    if (!this.isBillingEnabled()) {
      return null;
    }

    const remaining = await this.getBotBalance(input.botId);
    if (remaining <= 0) {
      return null;
    }

    const reference = `reclaim:${input.botId}`;
    const existingUser = await this.ledger.findByReferenceAndType?.(
      reference,
      "reclaim"
    );
    if (existingUser) {
      return null;
    }

    const metadata = {
      bot_id: input.botId,
      reclaim_reference: reference,
    };

    const botTransaction = await this.applyBotCreditDelta({
      botId: input.botId,
      amount: -remaining,
      type: "reclaim",
      actorUserId: input.ownerUserId,
      reference,
      metadata: { user_id: input.ownerUserId, reclaim_reference: reference },
    });

    const userTransaction = await this.applyUserCreditDelta({
      userId: input.ownerUserId,
      amount: remaining,
      type: "reclaim",
      actorUserId: input.ownerUserId,
      reference,
      metadata,
    });

    return { userTransaction, botTransaction };
  }

  async debitModeration(
    input: DebitModerationInput
  ): Promise<CreditTransaction | null> {
    if (!this.isBillingEnabled()) {
      return null;
    }

    const existing = await this.ledger.findDebitModeration(
      input.botId,
      input.chatId,
      input.messageId
    );
    if (existing) {
      return existing;
    }

    const balanceAfter = await this.store.conditionalDebit(input.botId);
    if (balanceAfter === null) {
      logger.warn(
        { botId: input.botId, chatId: input.chatId, messageId: input.messageId },
        "Skipped moderation debit — insufficient credits"
      );
      return null;
    }

    const reference = String(input.messageId);

    try {
      return await this.ledger.create({
        bot_id: input.botId,
        type: "debit_moderation",
        amount: -1,
        balance_after: balanceAfter,
        chat_id: input.chatId,
        reference,
        metadata: { message_id: input.messageId },
      });
    } catch (error) {
      await this.store.applyBotDelta(input.botId, 1);

      const raced = await this.ledger.findDebitModeration(
        input.botId,
        input.chatId,
        input.messageId
      );
      if (raced) {
        return raced;
      }
      throw error;
    }
  }

  async reconcileBot(botId: string): Promise<{
    actual: number;
    expected: number;
    fixed: boolean;
  }> {
    const actual = await this.getBotBalance(botId);
    const expected = await this.ledger.sumAmountByBot(botId);

    if (actual === expected) {
      return { actual, expected, fixed: false };
    }

    logger.error(
      { botId, actual, expected },
      "Bot credit balance mismatch — applying reconcile_fix"
    );

    const delta = expected - actual;
    await this.applyBotCreditDelta({
      botId,
      amount: delta,
      type: "reconcile_fix",
      reference: `reconcile:bot:${Date.now()}`,
      metadata: { previous_balance: actual, ledger_sum: expected },
    });

    return { actual, expected, fixed: true };
  }

  async reconcileUser(userId: string): Promise<{
    actual: number;
    expected: number;
    fixed: boolean;
  }> {
    const actual = await this.getUserBalance(userId);
    const expected = await this.ledger.sumAmountByUser(userId);

    if (actual === expected) {
      return { actual, expected, fixed: false };
    }

    logger.error(
      { userId, actual, expected },
      "User wallet balance mismatch — applying reconcile_fix"
    );

    const delta = expected - actual;
    await this.applyUserCreditDelta({
      userId,
      amount: delta,
      type: "reconcile_fix",
      reference: `reconcile:user:${Date.now()}`,
      metadata: { previous_balance: actual, ledger_sum: expected },
    });

    return { actual, expected, fixed: true };
  }

  private async applyBotCreditDelta(input: {
    botId: string;
    amount: number;
    type: CreditTransaction["type"];
    reference?: string;
    actorUserId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<CreditTransaction> {
    const balanceAfter = await this.store.applyBotDelta(input.botId, input.amount);

    return this.ledger.create({
      bot_id: input.botId,
      type: input.type,
      amount: input.amount,
      balance_after: balanceAfter,
      reference: input.reference,
      actor_user_id: input.actorUserId,
      metadata: input.metadata,
    });
  }

  private async applyUserCreditDelta(input: {
    userId: string;
    amount: number;
    type: CreditTransaction["type"];
    reference?: string;
    actorUserId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<CreditTransaction> {
    const balanceAfter = await this.store.applyUserDelta(
      input.userId,
      input.amount
    );

    return this.ledger.create({
      user_id: input.userId,
      type: input.type,
      amount: input.amount,
      balance_after: balanceAfter,
      reference: input.reference,
      actor_user_id: input.actorUserId,
      metadata: input.metadata,
    });
  }
}
