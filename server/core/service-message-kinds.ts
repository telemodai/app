import type { ServiceMessageKindId } from "../../lib/service-message-cleanup";
import type { TelegramMessage, TelegramUser } from "../types/telegram";

type ServiceMessageKind = {
  id: ServiceMessageKindId;
  matches: (message: TelegramMessage) => boolean;
};

const SERVICE_MESSAGE_KINDS: ServiceMessageKind[] = [
  {
    id: "member_joined",
    matches: (message) => (message.new_chat_members?.length ?? 0) > 0,
  },
  {
    id: "member_left",
    matches: (message) => message.left_chat_member != null,
  },
];

export function classifyServiceMessage(
  message: TelegramMessage
): ServiceMessageKindId | null {
  for (const kind of SERVICE_MESSAGE_KINDS) {
    if (kind.matches(message)) {
      return kind.id;
    }
  }
  return null;
}

/** Skip join service message when only the moderation bot itself was added. */
export function isSelfBotJoinMessage(
  message: TelegramMessage,
  botTelegramUserId: number | undefined
): boolean {
  if (!botTelegramUserId) {
    return false;
  }

  const members = message.new_chat_members;
  if (!members || members.length !== 1) {
    return false;
  }

  const member = members[0] as TelegramUser;
  return member.is_bot && member.id === botTelegramUserId;
}
