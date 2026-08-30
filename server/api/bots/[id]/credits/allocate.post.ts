import {
  CreditService,
  InsufficientWalletError,
} from "@/server/core/credit-service";
import { isSaasMode } from "@/server/core/deployment-mode";
import { requireBotAccess } from "@/server/utils/bot-access";
import { requireBotIdParam } from "@/server/utils/get-bot-id-param";

type AllocateBody = {
  amount?: number;
};

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Credits allocate is only available in SaaS mode",
    });
  }

  const botId = requireBotIdParam(event);
  const { user } = await requireBotAccess(event, botId, ["owner"]);

  const body = (await readBody(event)) as AllocateBody;
  const amount = body?.amount;

  if (!Number.isInteger(amount) || (amount ?? 0) <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Amount must be a positive integer",
    });
  }

  const creditService = new CreditService();

  try {
    await creditService.allocateToBot({
      userId: user.id,
      botId,
      amount: amount!,
      actorUserId: user.id,
    });
  } catch (error) {
    if (error instanceof InsufficientWalletError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Insufficient wallet balance",
      });
    }
    throw error;
  }

  const botBalance = await creditService.getBotBalance(botId);
  const walletBalance = await creditService.getUserBalance(user.id);

  return {
    success: true,
    data: {
      bot_balance: botBalance,
      wallet_balance: walletBalance,
    },
  };
});
