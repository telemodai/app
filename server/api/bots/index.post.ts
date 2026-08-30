import { BotRepository } from "@/server/database/repositories/bot-repository";
import {
  BotCreateValidationError,
  resolveBotIdentityFromGetMe,
} from "@/server/core/resolve-bot-from-token";
import { registerBotWebhook } from "@/server/utils/bot-lifecycle";
import { getBotDeliveryHealth, withDeliveryHealth } from "@/server/utils/bot-delivery";
import { requireSession } from "@/server/utils/session";
import {
  TelegramBotApiError,
  telegramGetMe,
} from "@/server/utils/telegram-bot-api";
import {
  fetchBotProfilePhotoFileId,
  refreshBotAvatar,
} from "@/server/core/bot-avatar";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as { token?: string };
  const rawToken = body?.token;

  if (typeof rawToken !== "string" || !rawToken.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bot token is required",
    });
  }

  const { user } = await requireSession(event);
  const botRepo = new BotRepository();

  let identity;
  let me;
  try {
    me = await telegramGetMe(rawToken.trim());
    identity = resolveBotIdentityFromGetMe(me, rawToken);
  } catch (error) {
    if (error instanceof BotCreateValidationError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message,
      });
    }

    if (error instanceof TelegramBotApiError) {
      throw createError({
        statusCode: error.code === "invalid_token" ? 401 : 400,
        statusMessage: error.message,
      });
    }

    throw error;
  }

  const deletedBot = await botRepo.findByIdWithTokenIncludingDeleted(identity.id);
  if (deletedBot?.deleted_at) {
    if (deletedBot.owner_user_id !== user.id) {
      throw createError({
        statusCode: 409,
        statusMessage: "Bot is registered to another account",
      });
    }

    let photoFileId: string | null = null;
    try {
      photoFileId = await fetchBotProfilePhotoFileId(identity.token, me.id);
    } catch {
      // Best effort — bot may have no profile photo.
    }

    const restored =
      (await botRepo.restoreBot(identity.id, {
        token: identity.token,
        name: identity.name,
        telegram_bot_id: me.id,
        photo_file_id: photoFileId,
      })) ?? undefined;

    if (!restored) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to restore bot",
      });
    }

    let warning: string | undefined;
    const botWithToken = await botRepo.findByIdWithToken(restored.id);
    if (botWithToken) {
      try {
        const registration = await registerBotWebhook(restored.id, botWithToken);
        warning = registration.warning;
      } catch (error) {
        warning =
          error instanceof Error
            ? error.message
            : "Failed to register webhook for restored bot";
      }
    }

    const health = await getBotDeliveryHealth(event, restored.id);
    return {
      success: true,
      data: withDeliveryHealth(restored, health),
      warning,
      message: "Bot restored successfully",
    };
  }

  const existing = await botRepo.findById(identity.id);
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Bot already registered",
    });
  }

  try {
    let photoFileId: string | null = null;
    try {
      photoFileId = await fetchBotProfilePhotoFileId(
        identity.token,
        me.id
      );
    } catch {
      // Best effort — bot may have no profile photo.
    }

    const bot = await botRepo.create(user.id, {
      id: identity.id,
      name: identity.name,
      token: identity.token,
      telegram_bot_id: me.id,
      photo_file_id: photoFileId,
    });

    const refreshedBot = (await botRepo.findById(bot.id)) ?? bot;

    let warning: string | undefined;
    if (bot.is_active) {
      const botWithToken = await botRepo.findByIdWithToken(refreshedBot.id);
      if (botWithToken) {
        try {
          const registration = await registerBotWebhook(refreshedBot.id, botWithToken);
          warning = registration.warning;
        } catch (error) {
          warning =
            error instanceof Error
              ? error.message
              : "Failed to register webhook for new bot";
        }
      }
    }

    const health = await getBotDeliveryHealth(event, refreshedBot.id);

    return {
      success: true,
      data: withDeliveryHealth(refreshedBot, health),
      warning,
      message: "Bot created successfully",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error creating bot",
      cause: error,
    });
  }
});
