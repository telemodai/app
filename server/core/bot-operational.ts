/** Whether the bot should receive webhooks and appear in product UI. */
export function isBotOperational(bot: {
  is_active: boolean;
  deleted_at?: Date | null;
}): boolean {
  return bot.is_active && bot.deleted_at == null;
}
