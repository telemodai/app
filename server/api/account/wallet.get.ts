import { isSaasMode } from "@/server/core/deployment-mode";
import { CreditService } from "@/server/core/credit-service";
import { requireSession } from "@/server/utils/session";

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Wallet is only available in SaaS mode",
    });
  }

  const { user } = await requireSession(event);
  const creditService = new CreditService();
  const balance = await creditService.getUserBalance(user.id);

  return {
    success: true,
    data: { balance },
  };
});
