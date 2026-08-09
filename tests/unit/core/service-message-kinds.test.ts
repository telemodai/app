import { describe, expect, test } from "bun:test";
import {
  classifyServiceMessage,
  isSelfBotJoinMessage,
} from "@/server/core/service-message-kinds";
import type { TelegramMessage } from "@/server/types/telegram";

function baseMessage(overrides: Partial<TelegramMessage> = {}): TelegramMessage {
  return {
    message_id: 1,
    chat: { id: -100, type: "supergroup" },
    date: 0,
    ...overrides,
  };
}

describe("service-message-kinds", () => {
  test("classifyServiceMessage detects join and leave", () => {
    expect(
      classifyServiceMessage(
        baseMessage({ new_chat_members: [{ id: 2, is_bot: false, first_name: "A" }] })
      )
    ).toBe("member_joined");
    expect(
      classifyServiceMessage(
        baseMessage({ left_chat_member: { id: 2, is_bot: false, first_name: "A" } })
      )
    ).toBe("member_left");
    expect(classifyServiceMessage(baseMessage({ text: "hello" }))).toBeNull();
  });

  test("isSelfBotJoinMessage matches only lone bot join", () => {
    const selfJoin = baseMessage({
      new_chat_members: [{ id: 99, is_bot: true, first_name: "ModBot" }],
    });
    expect(isSelfBotJoinMessage(selfJoin, 99)).toBe(true);
    expect(isSelfBotJoinMessage(selfJoin, 100)).toBe(false);
    expect(
      isSelfBotJoinMessage(
        baseMessage({
          new_chat_members: [
            { id: 99, is_bot: true, first_name: "ModBot" },
            { id: 2, is_bot: false, first_name: "Human" },
          ],
        }),
        99
      )
    ).toBe(false);
  });
});
