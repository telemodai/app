import { describe, expect, test } from "bun:test";
import {
  enrichDecisionDisplay,
  loadChatNameMap,
  loadUserContextDisplayMap,
} from "@/server/core/decision-display-lookup";
import {
  formatChatDisplay,
  formatTelegramUserDisplay,
} from "@/lib/telegram-display";

describe("telegram-display", () => {
  test("formatTelegramUserDisplay prefers @username", () => {
    expect(
      formatTelegramUserDisplay({
        username: "alice",
        first_name: "Alice",
        user_id: 42,
      })
    ).toBe("@alice");
  });

  test("formatTelegramUserDisplay falls back to first name then id", () => {
    expect(
      formatTelegramUserDisplay({
        username: null,
        first_name: "Bob",
        user_id: 42,
      })
    ).toBe("Bob");

    expect(
      formatTelegramUserDisplay({
        username: null,
        first_name: null,
        user_id: 42,
      })
    ).toBe("42");
  });

  test("formatChatDisplay prefers chat name", () => {
    expect(
      formatChatDisplay({
        name: "Support group",
        chat_id: -1001,
      })
    ).toBe("Support group");
  });
});

describe("decision-display-lookup", () => {
  test("loadChatNameMap batches unique chat ids", async () => {
    const chatRepo = {
      findNamesByTelegramChatIds: async (_botId: string, ids: number[]) =>
        ids.map((chatId) => ({ chatId, name: `Chat ${chatId}` })),
    };

    const map = await loadChatNameMap("bot1", [-1001, -1001, -1002], {
      chatRepo,
    });

    expect(map.get(-1001)).toBe("Chat -1001");
    expect(map.get(-1002)).toBe("Chat -1002");
  });

  test("enrichDecisionDisplay attaches chat and user fields", () => {
    const enriched = enrichDecisionDisplay(
      {
        chat_id: -1001,
        user_id: 42,
        message_text: "hi",
      },
      new Map([[-1001, "My chat"]]),
      new Map([
        [
          "-1001:42",
          { user_username: "alice", user_first_name: "Alice" },
        ],
      ])
    );

    expect(enriched.chat_name).toBe("My chat");
    expect(enriched.user_username).toBe("alice");
    expect(enriched.user_first_name).toBe("Alice");
  });

  test("loadUserContextDisplayMap dedupes user pairs", async () => {
    const calls: Array<{ chatId: number; userId: number }> = [];
    const userContextRepo = {
      findByUserPairs: async (
        _botId: string,
        pairs: Array<{ chatId: number; userId: number }>
      ) => {
        calls.push(...pairs);
        return [
          {
            chat_id: pairs[0].chatId,
            user_id: pairs[0].userId,
            username: "bob",
            first_name: "Bob",
          },
        ];
      },
    };

    const map = await loadUserContextDisplayMap(
      "bot1",
      [
        { chat_id: -1001, user_id: 7 },
        { chat_id: -1001, user_id: 7 },
      ],
      { userContextRepo }
    );

    expect(calls).toEqual([{ chatId: -1001, userId: 7 }]);
    expect(map.get("-1001:7")).toEqual({
      user_username: "bob",
      user_first_name: "Bob",
    });
  });
});
