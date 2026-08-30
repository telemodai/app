/** Number of prerequisite items shown in Add Chat modal (see chatActivation.prerequisites in locales). */
export const CHAT_ACTIVATION_PREREQUISITE_COUNT = 3;

/** Deep link to add the bot to a new Telegram group with required admin rights. */
export function buildTelegramStartGroupDeepLink(botUsername: string): string {
  const username = botUsername.trim().replace(/^@/, "");
  return `https://t.me/${username}?startgroup&admin=delete_messages+restrict_members`;
}
