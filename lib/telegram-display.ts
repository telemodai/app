/** Shared Telegram display labels for admin UI (decision journal, moderation). */

export function formatTelegramUsername(
  username: string | null | undefined
): string | null {
  const trimmed = username?.trim().replace(/^@/, "");
  return trimmed ? `@${trimmed}` : null;
}

export function formatTelegramUserDisplay(input: {
  username?: string | null;
  first_name?: string | null;
  user_id: number;
  fallbackLabel?: string;
}): string {
  const fromUsername = formatTelegramUsername(input.username);
  if (fromUsername) {
    return fromUsername;
  }

  const firstName = input.first_name?.trim();
  if (firstName) {
    return firstName;
  }

  if (input.fallbackLabel) {
    return input.fallbackLabel;
  }

  return String(input.user_id);
}

export function formatChatDisplay(input: {
  name?: string | null;
  chat_id: number;
  fallbackLabel?: string;
}): string {
  const name = input.name?.trim();
  if (name) {
    return name;
  }

  if (input.fallbackLabel) {
    return input.fallbackLabel;
  }

  return String(input.chat_id);
}

export function userContextKey(chatId: number, userId: number): string {
  return `${chatId}:${userId}`;
}
