import { ChatRepository } from "@/server/database/repositories/chat-repository";
import { UserContextRepository } from "@/server/database/repositories/user-context-repository";
import { userContextKey } from "@/lib/telegram-display";

export type UserContextDisplayFields = {
  user_username: string | null;
  user_first_name: string | null;
};

export async function loadChatNameMap(
  botId: string,
  chatIds: number[],
  deps?: { chatRepo?: Pick<ChatRepository, "findNamesByTelegramChatIds"> }
): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(chatIds)];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const chatRepo = deps?.chatRepo ?? new ChatRepository();
  const rows = await chatRepo.findNamesByTelegramChatIds(botId, uniqueIds);
  return new Map(rows.map((row) => [row.chatId, row.name]));
}

export async function loadUserContextDisplayMap(
  botId: string,
  entries: Array<{ chat_id: number; user_id: number }>,
  deps?: {
    userContextRepo?: Pick<UserContextRepository, "findByUserPairs">;
  }
): Promise<Map<string, UserContextDisplayFields>> {
  const userContextRepo = deps?.userContextRepo ?? new UserContextRepository();
  const uniqueEntries = [
    ...new Map(
      entries.map((entry) => [
        userContextKey(entry.chat_id, entry.user_id),
        entry,
      ])
    ).values(),
  ];
  const contexts = await userContextRepo.findByUserPairs(
    botId,
    uniqueEntries.map((entry) => ({
      chatId: entry.chat_id,
      userId: entry.user_id,
    }))
  );

  const map = new Map<string, UserContextDisplayFields>();
  for (const context of contexts) {
    map.set(userContextKey(context.chat_id, context.user_id), {
      user_username: context.username ?? null,
      user_first_name: context.first_name ?? null,
    });
  }

  return map;
}

export function enrichDecisionDisplay<
  T extends { chat_id: number; user_id: number },
>(
  item: T,
  chatNames: Map<number, string>,
  userContexts: Map<string, UserContextDisplayFields>
): T & {
  chat_name: string | null;
  user_username: string | null;
  user_first_name: string | null;
} {
  const user = userContexts.get(userContextKey(item.chat_id, item.user_id));

  return {
    ...item,
    chat_name: chatNames.get(item.chat_id) ?? null,
    user_username: user?.user_username ?? null,
    user_first_name: user?.user_first_name ?? null,
  };
}
