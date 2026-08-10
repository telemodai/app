export interface TelegramChatLinkInput {
  chat_id: number;
  telegram_username?: string | null;
}

/**
 * Browser URL to open a Telegram chat.
 * - Public @username → t.me/{username}
 * - Private supergroup/channel → Telegram Web hash (t.me/c/{id} alone redirects to telegram.org)
 */
export function telegramChatWebUrl(input: TelegramChatLinkInput): string | null {
  const username = input.telegram_username?.trim().replace(/^@/, "");
  if (username) {
    return `https://t.me/${username}`;
  }

  const chatId = input.chat_id;
  if (!Number.isFinite(chatId) || chatId >= 0) {
    return null;
  }

  // Opens the dialog in Telegram Web when the user is logged in there.
  return `https://web.telegram.org/a/#${chatId}`;
}

/** @deprecated Use telegramChatWebUrl. Kept for tests/docs — bare t.me/c/{id} is invalid. */
export function telegramPrivatePostUrl(chatId: number, messageId = 1): string | null {
  const raw = String(chatId);
  if (raw.startsWith("-100") && raw.length > 4) {
    return `https://t.me/c/${raw.slice(4)}/${messageId}`;
  }
  if (raw.startsWith("-")) {
    const withoutSign = raw.slice(1);
    if (withoutSign) {
      return `https://t.me/c/${withoutSign}/${messageId}`;
    }
  }
  return null;
}
