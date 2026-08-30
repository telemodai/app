import type { H3Event } from "h3";
import { BotMemberRepository, type BotMemberRole } from "@/server/database/repositories/bot-member-repository";
import { BotRepository } from "@/server/database/repositories/bot-repository";
import { requireSession } from "./session";

export function enforceBotAccess(
  role: BotMemberRole | null,
  allowedRoles?: BotMemberRole[]
): BotMemberRole {
  if (!role) {
    throw createError({
      statusCode: 403,
      statusMessage: "No access to this bot",
    });
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Insufficient bot permissions",
    });
  }

  return role;
}

export async function requireBotAccess(
  event: H3Event,
  botId: string,
  roles?: BotMemberRole[]
) {
  const { user } = await requireSession(event);
  const memberRepo = new BotMemberRepository();
  const role = await memberRepo.getMemberRole(botId, user.id);
  const resolvedRole = enforceBotAccess(role, roles);

  const botRepo = new BotRepository();
  const bot = await botRepo.findById(botId);
  if (!bot) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bot not found",
    });
  }

  return { user, role: resolvedRole };
}
