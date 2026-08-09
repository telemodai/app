import { logger } from "./logger";
import type { Bot } from "@/server/database/models/bot";
import { BotRepository } from "@/server/database/repositories/bot-repository";
import { telegramDeleteWebhook } from "@/server/utils/telegram-webhook";
import type { TelegramFetch } from "@/server/utils/telegram-fetch";

export class DeleteBotError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "DeleteBotError";
  }
}

type DeleteBotDeps = {
  findByIdWithToken: (botId: string) => Promise<Bot | null>;
  deleteBot: (botId: string) => Promise<boolean>;
  deleteWebhook: (token: string, fetchFn?: TelegramFetch) => Promise<void>;
  fetchFn: TelegramFetch;
};

function getDeps(overrides?: Partial<DeleteBotDeps>): DeleteBotDeps {
  const botRepo = new BotRepository();
  return {
    findByIdWithToken: (botId) => botRepo.findByIdWithToken(botId),
    deleteBot: (botId) => botRepo.delete(botId),
    deleteWebhook: (token, fetchFn) => telegramDeleteWebhook(token, fetchFn),
    fetchFn: fetch,
    ...overrides,
  };
}

/** Permanently deletes a bot; webhook removal is best-effort, DB rows cascade via FK. */
export async function deleteBotPermanently(
  botId: string,
  deps?: Partial<DeleteBotDeps>
): Promise<void> {
  const { findByIdWithToken, deleteBot, deleteWebhook, fetchFn } = getDeps(deps);
  const bot = await findByIdWithToken(botId);

  if (!bot) {
    throw new DeleteBotError(404, "Bot not found");
  }

  if (bot.token) {
    try {
      await deleteWebhook(bot.token, fetchFn);
      logger.info(`Webhook removed before bot delete: ${botId}`);
    } catch (error) {
      logger.warn(
        { error: error as Error, botId },
        "Failed to delete Telegram webhook before bot removal"
      );
    }
  }

  const deleted = await deleteBot(botId);
  if (!deleted) {
    throw new DeleteBotError(404, "Bot not found");
  }

  logger.info({ botId }, "Bot deleted permanently");
}
