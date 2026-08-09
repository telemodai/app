import { BotAccessCodeRepository } from "@/server/database/repositories/bot-access-code-repository";
import { requireBotAccess } from "@/server/utils/bot-access";
import { requireBotIdParam } from "@/server/utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  await requireBotAccess(event, botId, ["owner"]);
  const codeRepo = new BotAccessCodeRepository();
  const code = await codeRepo.getOrCreateActiveCode(botId);

  return {
    success: true,
    data: {
      code: code.code,
      created_at: code.createdAt,
    },
  };
});
