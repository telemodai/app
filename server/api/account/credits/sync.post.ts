import { CreditService } from "@/server/core/credit-service";
import { isSaasMode } from "@/server/core/deployment-mode";
import {
  syncUserOpenProviderPayments,
  syncUserPurchaseFromProvider,
} from "@/server/core/payment-sync";
import { ProviderPaymentRepository } from "@/server/database/repositories/provider-payment-repository";
import { requireSession } from "@/server/utils/session";

type SyncBody = {
  payment_id?: string;
};

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Credits sync is only available in SaaS mode",
    });
  }

  const { user } = await requireSession(event);
  const body = (await readBody(event)) as SyncBody;
  const paymentId = body?.payment_id?.trim();

  let syncStatus: Awaited<
    ReturnType<typeof syncUserPurchaseFromProvider>
  >["status"] | undefined;

  if (paymentId) {
    const sync = await syncUserPurchaseFromProvider(user.id, paymentId);
    syncStatus = sync.status;
  } else {
    const open = await new ProviderPaymentRepository().findOpenByUserId(user.id);
    if (open.length > 0) {
      const sync = await syncUserOpenProviderPayments(user.id);
      syncStatus = sync.status;
    }
  }

  const creditService = new CreditService();
  const balance = await creditService.getUserBalance(user.id);

  return {
    success: true,
    data: {
      ...(syncStatus !== undefined && { sync_status: syncStatus }),
      balance,
    },
  };
});
