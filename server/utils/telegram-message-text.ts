import type { TelegramMessage } from "@/server/types/telegram";

/** Text payload Telegram sends for moderation: plain text or media caption. */
export function getTelegramMessageText(
  message: Pick<TelegramMessage, "text" | "caption">
): string | undefined {
  const text = message.text?.trim();
  if (text) {
    return text;
  }

  const caption = message.caption?.trim();
  return caption || undefined;
}
