import { loadDashboardData } from "@/server/core/dashboard-service";
import { loadChatNameMap, resolveChatName } from "@/server/core/chat-name-lookup";
import { loadRuleNameMap, resolveRuleName } from "@/server/core/rule-name-lookup";
import { BotRepository } from "@/server/database/repositories/bot-repository";
import { ChatStatisticsRepository } from "@/server/database/repositories/chat-statistics-repository";
import { ModerationActionRepository } from "@/server/database/repositories/moderation-action-repository";
import { UserContextRepository } from "@/server/database/repositories/user-context-repository";
import { requireSession } from "@/server/utils/session";

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireSession(event);
    const botRepo = new BotRepository();
    const statsRepo = new ChatStatisticsRepository();
    const actionRepo = new ModerationActionRepository();
    const userContextRepo = new UserContextRepository();

    const data = await loadDashboardData(user.id, {
      findBots: (userId) => botRepo.findAllForUser(userId),
      getTodayTotals: (botIds, date) =>
        statsRepo.getBotTodayTotals(botIds, date),
      getDailyStats: (botIds, startDate, endDate) =>
        statsRepo.getBotDailyAggregates(botIds, startDate, endDate),
      getActionBreakdown: (botIds, startDate, endDate) =>
        actionRepo.getActionBreakdownByBotIds(botIds, startDate, endDate),
      getRecentActions: (botIds, limit) =>
        actionRepo.getRecentByBotIds(botIds, limit),
      countActiveUsers24h: (botIds) =>
        userContextRepo.countDistinctUsersByBotIds(botIds, {
          activeWithinHours: 24,
        }),
      countBannedUsers: (botIds) =>
        userContextRepo.countDistinctUsersByBotIds(botIds, {
          bannedOnly: true,
        }),
    });

    const ruleNames = await loadRuleNameMap(
      data.recent_activity.map((item) => ({
        botId: item.bot_id,
        ruleId: item.rule_violated,
      }))
    );
    const chatNames = await loadChatNameMap(
      data.recent_activity.map((item) => ({
        botId: item.bot_id,
        chatId: item.chat_id,
      }))
    );
    data.recent_activity = data.recent_activity.map((item) => ({
      ...item,
      rule_name: resolveRuleName(item.rule_violated, ruleNames),
      chat_name: resolveChatName(item.bot_id, item.chat_id, chatNames),
    }));

    return {
      success: true,
      data,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading dashboard data",
    });
  }
});
