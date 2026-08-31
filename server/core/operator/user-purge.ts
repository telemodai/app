import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { eq, or, sql } from "drizzle-orm";
import { users, loginBotTokens } from "@/server/database/auth-schema";
import { getDatabaseConnection } from "@/server/database/connection";
import {
  bots,
  creditTransactions,
  promoRedemptions,
  providerPayments,
  referrals,
} from "@/server/database/schema";
import type { AppUser } from "@/server/database/models/user";
import { UserRepository } from "@/server/database/repositories/user-repository";

export type UserPurgeCounts = {
  promo_redemptions: number;
  referrals: number;
  provider_payments: number;
  credit_transactions: number;
  login_bot_tokens: number;
  bots_cascaded: number;
};

export type UserPurgeResult =
  | { ok: true; user: AppUser; counts: UserPurgeCounts }
  | { ok: false; error: "not_found" | "aborted" };

export async function promptUserPurgeConfirm(user: AppUser): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    const label = user.username ? `@${user.username}` : user.name;
    const answer = (
      await rl.question(
        `Delete user ${label} (${user.id}) and ALL related data? Type DELETE to confirm: `
      )
    ).trim();
    return answer === "DELETE";
  } finally {
    rl.close();
  }
}

export async function purgeUserOperator(
  userId: string
): Promise<UserPurgeResult> {
  const repo = new UserRepository();
  const user = await repo.findById(userId.trim());
  if (!user) {
    return { ok: false, error: "not_found" };
  }

  const db = getDatabaseConnection().getDb();

  const counts: UserPurgeCounts = {
    promo_redemptions: 0,
    referrals: 0,
    provider_payments: 0,
    credit_transactions: 0,
    login_bot_tokens: 0,
    bots_cascaded: 0,
  };

  const [botCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bots)
    .where(eq(bots.ownerUserId, user.id));
  counts.bots_cascaded = botCountRow?.count ?? 0;

  await db.transaction(async (tx) => {
    const deletedPromoRedemptions = await tx
      .delete(promoRedemptions)
      .where(eq(promoRedemptions.userId, user.id))
      .returning({ id: promoRedemptions.id });
    counts.promo_redemptions = deletedPromoRedemptions.length;

    const deletedReferrals = await tx
      .delete(referrals)
      .where(
        or(
          eq(referrals.referrerUserId, user.id),
          eq(referrals.refereeUserId, user.id)
        )
      )
      .returning({ id: referrals.id });
    counts.referrals = deletedReferrals.length;

    const deletedPayments = await tx
      .delete(providerPayments)
      .where(
        or(
          eq(providerPayments.userId, user.id),
          eq(providerPayments.purchaserUserId, user.id)
        )
      )
      .returning({ id: providerPayments.id });
    counts.provider_payments = deletedPayments.length;

    const deletedLedger = await tx
      .delete(creditTransactions)
      .where(
        or(
          eq(creditTransactions.userId, user.id),
          eq(creditTransactions.actorUserId, user.id)
        )
      )
      .returning({ id: creditTransactions.id });
    counts.credit_transactions = deletedLedger.length;

    const deletedLoginTokens = await tx
      .delete(loginBotTokens)
      .where(eq(loginBotTokens.telegramId, user.telegram_id))
      .returning({ id: loginBotTokens.id });
    counts.login_bot_tokens = deletedLoginTokens.length;

    await tx.delete(users).where(eq(users.id, user.id));
  });

  return { ok: true, user, counts };
}

export function formatUserPurgeResult(
  result: Extract<UserPurgeResult, { ok: true }>
): string {
  const { user, counts } = result;
  const label = user.username ? `@${user.username}` : user.name;
  const lines = [
    `User deleted: ${label} (${user.id})`,
    `  telegram_id: ${user.telegram_id}`,
    "  removed:",
    `    promo_redemptions: ${counts.promo_redemptions}`,
    `    referrals: ${counts.referrals}`,
    `    provider_payments: ${counts.provider_payments}`,
    `    credit_transactions (user wallet rows): ${counts.credit_transactions}`,
    `    login_bot_tokens: ${counts.login_bot_tokens}`,
    `    owned bots (cascade): ${counts.bots_cascaded}`,
    "  Re-registration with the same Telegram account will create a new user id.",
  ];
  return lines.join("\n");
}
