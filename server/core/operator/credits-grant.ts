import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { randomUUID } from "node:crypto";
import { BotRepository } from "@/server/database/repositories/bot-repository";
import { UserRepository } from "@/server/database/repositories/user-repository";
import type { CreditTransaction } from "@/server/database/models/credit-transaction";
import type { CreditService } from "@/server/core/credit-service";

export type CreditsGrantInput = {
  bot_id?: string;
  user_id?: string;
  amount: number;
  reason: string;
  actor_user_id?: string;
  reference?: string;
  operator_note?: string;
};

export type CreditsGrantCliError =
  | "not_saas"
  | "missing_target"
  | "ambiguous_target"
  | "missing_reason"
  | "invalid_amount"
  | "bot_not_found"
  | "user_not_found"
  | "insufficient_balance";

export type CreditsGrantCliResult =
  | {
      ok: true;
      transaction: CreditTransaction;
      created: boolean;
      dry_run?: boolean;
    }
  | { ok: false; error: CreditsGrantCliError; message?: string };

export function parseGrantAmount(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") {
    return null;
  }
  const amount = Number(raw);
  if (!Number.isInteger(amount) || amount === 0) {
    return null;
  }
  return amount;
}

export function validateGrantReason(reason: string | undefined): string | null {
  const trimmed = reason?.trim();
  return trimmed ? trimmed : null;
}

function resolveGrantTarget(input: CreditsGrantInput): {
  botId?: string;
  userId?: string;
} {
  const botId = input.bot_id?.trim() || undefined;
  const userId = input.user_id?.trim() || undefined;

  if (botId && userId) {
    return { botId, userId };
  }

  return { botId, userId };
}

export async function promptInteractiveCreditsGrant(): Promise<CreditsGrantInput> {
  const rl = createInterface({ input, output });
  try {
    const targetType = (
      await rl.question("Target type (user/bot) [user]: ")
    )
      .trim()
      .toLowerCase();

    const useBot = targetType === "bot" || targetType === "b";
    const targetLabel = useBot ? "Bot id" : "User id";
    const targetId = (await rl.question(`${targetLabel}: `)).trim();
    if (!targetId) {
      throw new Error(`${targetLabel} is required`);
    }

    const amountRaw = await rl.question("Amount (signed integer, + grant / − deduct): ");
    const amount = parseGrantAmount(amountRaw);
    if (amount === null) {
      throw new Error("Amount must be a non-zero integer");
    }

    const reason = validateGrantReason(await rl.question("Reason: "));
    if (!reason) {
      throw new Error("Reason is required");
    }

    const operator_note = (await rl.question("Operator note (optional): ")).trim();

    const targetName = useBot ? `bot ${targetId}` : `user ${targetId}`;
    const confirmLabel =
      amount < 0
        ? `Deduct ${Math.abs(amount)} credits from ${targetName}? [y/N] `
        : `Grant ${amount} credits to ${targetName}? [y/N] `;
    const confirm = (await rl.question(confirmLabel)).trim().toLowerCase();
    if (confirm !== "y" && confirm !== "yes") {
      throw new Error("Aborted");
    }

    return {
      ...(useBot ? { bot_id: targetId } : { user_id: targetId }),
      amount,
      reason,
      ...(operator_note ? { operator_note } : {}),
    };
  } finally {
    rl.close();
  }
}

export async function runCreditsGrantOperator(
  input: CreditsGrantInput,
  service: CreditService,
  options: { dryRun?: boolean } = {}
): Promise<CreditsGrantCliResult> {
  const { botId, userId } = resolveGrantTarget(input);

  if (!botId && !userId) {
    return { ok: false, error: "missing_target" };
  }

  if (botId && userId) {
    return { ok: false, error: "ambiguous_target" };
  }

  const reason = validateGrantReason(input.reason);
  if (!reason) {
    return { ok: false, error: "missing_reason" };
  }

  if (!Number.isInteger(input.amount) || input.amount === 0) {
    return { ok: false, error: "invalid_amount" };
  }

  if (!service.isBillingEnabled()) {
    return { ok: false, error: "not_saas" };
  }

  if (userId) {
    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);
    if (!user) {
      return { ok: false, error: "user_not_found" };
    }

    const balance = await service.getUserBalance(userId);
    const balanceAfter = balance + input.amount;
    if (balanceAfter < 0) {
      return { ok: false, error: "insufficient_balance" };
    }

    const reference = input.reference?.trim() || `admin-grant:${randomUUID()}`;

    if (options.dryRun) {
      return {
        ok: true,
        created: false,
        dry_run: true,
        transaction: {
          id: 0,
          user_id: userId,
          type: "admin_adjust",
          amount: input.amount,
          balance_after: balanceAfter,
          chat_id: null,
          reference,
          actor_user_id: input.actor_user_id ?? null,
          metadata: {
            reason,
            source: "cli",
            ...(input.operator_note?.trim()
              ? { operator_note: input.operator_note.trim() }
              : {}),
          },
          created_at: new Date(),
        },
      };
    }

    const result = await service.grantAdminAdjust({
      userId,
      amount: input.amount,
      reason,
      actorUserId: input.actor_user_id,
      reference: input.reference,
      operatorNote: input.operator_note,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return {
      ok: true,
      transaction: result.transaction,
      created: result.created,
    };
  }

  const botRepo = new BotRepository();
  const bot = await botRepo.findById(botId!);
  if (!bot) {
    return { ok: false, error: "bot_not_found" };
  }

  const balance = await service.getBalance(botId!);
  const balanceAfter = balance + input.amount;
  if (balanceAfter < 0) {
    return { ok: false, error: "insufficient_balance" };
  }

  const reference = input.reference?.trim() || `admin-grant:${randomUUID()}`;

  if (options.dryRun) {
    return {
      ok: true,
      created: false,
      dry_run: true,
      transaction: {
        id: 0,
        bot_id: botId,
        type: "admin_adjust",
        amount: input.amount,
        balance_after: balanceAfter,
        chat_id: null,
        reference,
        actor_user_id: input.actor_user_id ?? null,
        metadata: {
          reason,
          source: "cli",
          ...(input.operator_note?.trim()
            ? { operator_note: input.operator_note.trim() }
            : {}),
        },
        created_at: new Date(),
      },
    };
  }

  const result = await service.grantAdminAdjust({
    botId,
    amount: input.amount,
    reason,
    actorUserId: input.actor_user_id,
    reference: input.reference,
    operatorNote: input.operator_note,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    transaction: result.transaction,
    created: result.created,
  };
}

export function formatCreditsGrantResult(result: CreditsGrantCliResult): string {
  if (!result.ok) {
    return result.message ?? CREDITS_GRANT_ERROR_MESSAGES[result.error];
  }

  if (result.dry_run) {
    const tx = result.transaction;
    return [
      "Dry run — no changes written.",
      `  target: ${tx.user_id ? `user ${tx.user_id}` : `bot ${tx.bot_id}`}`,
      `  amount: ${tx.amount}`,
      `  balance_after: ${tx.balance_after}`,
      `  reference: ${tx.reference}`,
    ].join("\n");
  }

  const tx = result.transaction;
  const lines = [
    result.created
      ? "Credits adjusted:"
      : "Idempotent replay (existing ledger row):",
    `  id: ${tx.id}`,
    `  target: ${tx.user_id ? `user ${tx.user_id}` : `bot ${tx.bot_id}`}`,
    `  amount: ${tx.amount}`,
    `  balance_after: ${tx.balance_after}`,
    `  reference: ${tx.reference}`,
    `  type: ${tx.type}`,
  ];
  return lines.join("\n");
}

export const CREDITS_GRANT_ERROR_MESSAGES: Record<CreditsGrantCliError, string> =
  {
    not_saas: "Credit grants are only available when DEPLOYMENT_MODE=saas",
    missing_target: "Provide exactly one of --bot-id or --user-id",
    ambiguous_target: "Provide only one of --bot-id or --user-id",
    missing_reason: "reason is required (--reason)",
    invalid_amount: "amount must be a non-zero integer (--amount)",
    bot_not_found: "Bot not found",
    user_not_found: "User not found",
    insufficient_balance: "Deduction would make credit balance negative",
  };
