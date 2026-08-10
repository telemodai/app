export interface TelegramChatLinkInput {
  chat_id: number;
  telegram_username?: string | null;
}

/** Public t.me URL for a group/channel when username or supergroup id is known. */
export function telegramChatWebUrl(input: TelegramChatLinkInput): string | null {
  const username = input.telegram_username?.trim().replace(/^@/, "");
  if (username) {
    return `https://t.me/${username}`;
  }

  const raw = String(input.chat_id);
  if (raw.startsWith("-100") && raw.length > 4) {
    return `https://t.me/c/${raw.slice(4)}`;
  }

  if (raw.startsWith("-")) {
    const withoutSign = raw.slice(1);
    if (withoutSign) {
      return `https://t.me/c/${withoutSign}`;
    }
  }

  return null;
}
