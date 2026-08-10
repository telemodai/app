import { BotRepository } from "@/server/database/repositories/bot-repository";
import { ModerationDecisionRepository } from "@/server/database/repositories/moderation-decision-repository";
import { logger } from "@/server/core/logger";
import {
  buildDecisionsPagination,
  parseDecisionsQuery,
} from "@/server/utils/decisions-query";
import {
  enrichWithRuleName,
  loadRuleNameMap,
} from "@/server/core/rule-name-lookup";
import {
  enrichDecisionDisplay,
  loadChatNameMap,
  loadUserContextDisplayMap,
} from "@/server/core/decision-display-lookup";
import { requireBotAccess } from "@/server/utils/bot-access";
import { requireBotIdParam } from "@/server/utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  try {
    const botId = requireBotIdParam(event);

    await requireBotAccess(event, botId);
    const botRepo = new BotRepository();
    const bot = await botRepo.findById(botId);

    if (!bot) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bot not found",
      });
    }

    const { page, limit } = parseDecisionsQuery(
      getQuery(event) as Record<string, unknown>
    );
    const decisionRepo = new ModerationDecisionRepository();
    const { items, total } = await decisionRepo.listByBot(botId, { page, limit });
    const ruleNames = await loadRuleNameMap(
      items.map((item) => ({ botId, ruleId: item.rule_violated }))
    );
    const chatNames = await loadChatNameMap(
      botId,
      items.map((item) => item.chat_id)
    );
    const userContexts = await loadUserContextDisplayMap(botId, items);
    const enrichedItems = items.map((item) =>
      enrichDecisionDisplay(
        enrichWithRuleName(item, ruleNames),
        chatNames,
        userContexts
      )
    );

    return {
      success: true,
      data: {
        items: enrichedItems,
        pagination: buildDecisionsPagination(page, limit, total),
      },
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    logger.error({ error: error as Error }, "Error loading moderation decisions");
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading moderation decisions",
    });
  }
});
