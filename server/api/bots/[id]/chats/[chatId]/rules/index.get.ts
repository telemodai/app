import { RuleRepository } from "@/server/database/repositories/rule-repository";
import { requireBotAccess } from "@/server/utils/bot-access";
import { requireBotIdParam } from "@/server/utils/get-bot-id-param";
import { requireBotChat } from "@/server/utils/require-bot-chat";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  await requireBotAccess(event, botId);
  const chat = await requireBotChat(event, botId);
  const ruleRepo = new RuleRepository();
  const rules = await ruleRepo.findAllByChat(botId, chat.id);

  return {
    success: true,
    data: { rules },
  };
});
