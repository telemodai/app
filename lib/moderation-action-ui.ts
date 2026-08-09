export const MODERATION_ACTION_TYPES = [
  "warning",
  "delete",
  "ban",
  "reset_warnings",
  "unban",
  "pardon",
] as const;

export type ModerationActionType = (typeof MODERATION_ACTION_TYPES)[number];

export function isModerationActionType(
  value: string
): value is ModerationActionType {
  return (MODERATION_ACTION_TYPES as readonly string[]).includes(value);
}

export function moderationActionI18nKey(
  action: ModerationActionType
): `common.actions.${ModerationActionType}` {
  return `common.actions.${action}`;
}

/** Tailwind text color classes for action badges — app-only action tokens. */
export function moderationActionColorClass(action: ModerationActionType): string {
  switch (action) {
    case "warning":
      return "text-action-warning font-medium";
    case "delete":
      return "text-action-delete font-medium";
    case "ban":
      return "text-action-ban font-medium";
    case "reset_warnings":
      return "text-action-reset font-medium";
    case "unban":
      return "text-action-unban font-medium";
    case "pardon":
      return "text-action-pardon font-medium";
    default:
      return "text-fg";
  }
}
