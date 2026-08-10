/** Public Telegram bot link — bot id is the @username without the at-sign. */
export function telegramBotWebUrl(botId: string): string {
  const username = botId.trim().replace(/^@/, "");
  return `https://t.me/${username}`;
}
