import { requireBotAccess } from "@/server/utils/bot-access";
import { requireBotIdParam } from "@/server/utils/get-bot-id-param";
import { isSaasMode } from "@/server/core/deployment-mode";
import { CreditService } from "@/server/core/credit-service";

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Credits are only available in SaaS mode",
    });
  }

  const botId = requireBotIdParam(event);
  await requireBotAccess(event, botId);

  const creditService = new CreditService();
  const balance = await creditService.getBalance(botId);

  return {
    success: true,
    data: { balance },
  };
});
