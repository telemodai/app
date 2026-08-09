import { reconcileStaleProviderPayments } from "@/server/core/payment-sync";
import { isSaasMode } from "@/server/core/deployment-mode";
import { logger } from "@/server/core/logger";

export default defineTask({
  meta: {
    name: "billing:reconcile-stale-payments",
    description:
      "Poll YooKassa for stale pending provider_payments (webhook miss fallback)",
  },
  async run() {
    if (!isSaasMode()) {
      return { result: "skipped", reason: "self-hosted" };
    }

    const { checked, applied } = await reconcileStaleProviderPayments();
    logger.info(
      { checked, applied },
      "Stale provider payment reconcile completed"
    );
    return { result: "ok", checked, applied };
  },
});
