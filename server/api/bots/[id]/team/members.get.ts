import { BotMemberRepository } from "@/server/database/repositories/bot-member-repository";
import { requireBotAccess } from "@/server/utils/bot-access";
import { requireBotIdParam } from "@/server/utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  await requireBotAccess(event, botId);
  const memberRepo = new BotMemberRepository();
  const members = await memberRepo.listMembers(botId);

  return {
    success: true,
    data: { members },
  };
});
