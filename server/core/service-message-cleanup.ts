import type {
  ServiceMessageCleanupSettings,
  ServiceMessageKindId,
} from "@/lib/service-message-cleanup";
import type { TelegramMessage } from "@/server/types/telegram";
import { isSelfBotJoinMessage } from "./service-message-kinds";

export function shouldDeleteServiceMessage(input: {
  settings: ServiceMessageCleanupSettings;
  kind: ServiceMessageKindId;
  message: TelegramMessage;
  botTelegramUserId?: number;
}): boolean {
  const { settings, kind, message, botTelegramUserId } = input;

  if (!settings.enabled || !settings.types.includes(kind)) {
    return false;
  }

  if (kind === "member_joined" && isSelfBotJoinMessage(message, botTelegramUserId)) {
    return false;
  }

  return true;
}
