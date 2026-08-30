import { logger } from "./logger";
import { CreditService } from "./credit-service";
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
  softDeleteBot: (botId: string) => Promise<boolean>;
  reclaimFromBot: (botId: string, ownerUserId: string) => Promise<void>;
  deleteWebhook: (token: string, fetchFn?: TelegramFetch) => Promise<void>;
  fetchFn: TelegramFetch;
};

function getDeps(overrides?: Partial<DeleteBotDeps>): DeleteBotDeps {
  const botRepo = new BotRepository();
  const creditService = new CreditService();
  return {
    findByIdWithToken: (botId) => botRepo.findByIdWithTokenIncludingDeleted(botId),
    softDeleteBot: (botId) => botRepo.softDelete(botId),
    reclaimFromBot: async (botId, ownerUserId) => {
      await creditService.reclaimFromBot({ botId, ownerUserId });
    },
    deleteWebhook: (token, fetchFn) => telegramDeleteWebhook(token, fetchFn),
    fetchFn: fetch,
    ...overrides,
  };
}

/** Soft-deletes a bot; reclaims credits to owner wallet; webhook removal is best-effort. */
export async function deleteBotPermanently(
  botId: string,
  deps?: Partial<DeleteBotDeps>
): Promise<void> {
  const { findByIdWithToken, softDeleteBot, reclaimFromBot, deleteWebhook, fetchFn } =
    getDeps(deps);
  const bot = await findByIdWithToken(botId);

  if (!bot || bot.deleted_at) {
    throw new DeleteBotError(404, "Bot not found");
  }

  await reclaimFromBot(botId, bot.owner_user_id);

  if (bot.token) {
    try {
      await deleteWebhook(bot.token, fetchFn);
      logger.info(`Webhook removed before bot soft-delete: ${botId}`);
    } catch (error) {
      logger.warn(
        { error: error as Error, botId },
        "Failed to delete Telegram webhook before bot soft-delete"
      );
    }
  }

  const deleted = await softDeleteBot(botId);
  if (!deleted) {
    throw new DeleteBotError(404, "Bot not found");
  }

  logger.info({ botId }, "Bot soft-deleted");
}
