import { CreditService } from "@/server/core/credit-service";
import { BotRepository } from "@/server/database/repositories/bot-repository";
import { isSaasMode } from "@/server/core/deployment-mode";
import { logger } from "@/server/core/logger";

export default defineTask({
  meta: {
    name: "billing:reconcile-credits",
    description: "Reconcile bot credit balances against ledger sums",
  },
  async run() {
    if (!isSaasMode()) {
      return { result: "skipped", reason: "self-hosted" };
    }

    const botRepo = new BotRepository();
    const creditService = new CreditService();
    const bots = await botRepo.findActive();
    let mismatches = 0;

    for (const bot of bots) {
      const result = await creditService.reconcileBot(bot.id);
      if (result.fixed) {
        mismatches += 1;
      }
    }

    logger.info({ bots: bots.length, mismatches }, "Credit reconcile completed");
    return { result: "ok", bots: bots.length, mismatches };
  },
});
