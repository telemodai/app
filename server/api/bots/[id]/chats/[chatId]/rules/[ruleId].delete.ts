import { RuleRepository } from "@/server/database/repositories/rule-repository";
import { requireBotAccess } from "@/server/utils/bot-access";
import { requireBotIdParam } from "@/server/utils/get-bot-id-param";
import { requireBotChat } from "@/server/utils/require-bot-chat";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);
  const ruleId = getRouterParam(event, "ruleId");

  if (!ruleId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ruleId is required",
    });
  }

  await requireBotAccess(event, botId);
  const chat = await requireBotChat(event, botId);
  const ruleRepo = new RuleRepository();
  const deleted = await ruleRepo.delete(ruleId, botId, chat.id);

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: "Rule not found",
    });
  }

  return {
    success: true,
    message: "Rule deleted successfully",
  };
});
