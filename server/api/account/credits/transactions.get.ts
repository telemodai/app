import { isSaasMode } from "@/server/core/deployment-mode";
import { CreditTransactionRepository } from "@/server/database/repositories/credit-transaction-repository";
import { requireSession } from "@/server/utils/session";

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Credits history is only available in SaaS mode",
    });
  }

  const { user } = await requireSession(event);
  const query = getQuery(event);
  const limitRaw = Number(query.limit ?? 50);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100)
    : 50;

  const repo = new CreditTransactionRepository();
  const transactions = await repo.listForUser(user.id, limit);

  return {
    success: true,
    data: { transactions },
  };
});
