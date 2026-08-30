import { CreditService } from "@/server/core/credit-service";
import { BotRepository } from "@/server/database/repositories/bot-repository";
import { CreditTransactionRepository } from "@/server/database/repositories/credit-transaction-repository";
import { UserRepository } from "@/server/database/repositories/user-repository";
import { isSaasMode } from "@/server/core/deployment-mode";
import { logger } from "@/server/core/logger";

export default defineTask({
  meta: {
    name: "billing:reconcile-credits",
    description:
      "Reconcile bot operating balances and user wallet balances against ledger sums",
  },
  async run() {
    if (!isSaasMode()) {
      return { result: "skipped", reason: "self-hosted" };
    }

    const botRepo = new BotRepository();
    const userRepo = new UserRepository();
    const creditTxnRepo = new CreditTransactionRepository();
    const creditService = new CreditService();

    const bots = await botRepo.findActive();
    let botMismatches = 0;

    for (const bot of bots) {
      const result = await creditService.reconcileBot(bot.id);
      if (result.fixed) {
        botMismatches += 1;
      }
    }

    const userIds = new Set<string>();
    for (const userId of await creditTxnRepo.listDistinctUserIds()) {
      userIds.add(userId);
    }
    for (const userId of await userRepo.listIdsWithNonZeroCreditBalance()) {
      userIds.add(userId);
    }

    let userMismatches = 0;
    for (const userId of userIds) {
      const result = await creditService.reconcileUser(userId);
      if (result.fixed) {
        userMismatches += 1;
      }
    }

    logger.info(
      {
        bots: bots.length,
        botMismatches,
        users: userIds.size,
        userMismatches,
      },
      "Credit reconcile completed"
    );

    return {
      result: "ok",
      bots: bots.length,
      botMismatches,
      users: userIds.size,
      userMismatches,
    };
  },
});
