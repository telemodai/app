import { describe, expect, test } from "bun:test";
import { shouldDeleteServiceMessage } from "@/server/core/service-message-cleanup";
import type { TelegramMessage } from "@/server/types/telegram";

const message: TelegramMessage = {
  message_id: 10,
  chat: { id: -100, type: "supergroup" },
  date: 0,
  new_chat_members: [{ id: 42, is_bot: false, first_name: "User" }],
};

describe("shouldDeleteServiceMessage", () => {
  test("requires enabled flag and matching type", () => {
    expect(
      shouldDeleteServiceMessage({
        settings: { enabled: false, types: ["member_joined"] },
        kind: "member_joined",
        message,
      })
    ).toBe(false);

    expect(
      shouldDeleteServiceMessage({
        settings: { enabled: true, types: ["member_left"] },
        kind: "member_joined",
        message,
      })
    ).toBe(false);

    expect(
      shouldDeleteServiceMessage({
        settings: { enabled: true, types: ["member_joined"] },
        kind: "member_joined",
        message,
      })
    ).toBe(true);
  });

  test("skips lone self-bot join", () => {
    const selfJoin: TelegramMessage = {
      ...message,
      new_chat_members: [{ id: 7, is_bot: true, first_name: "Bot" }],
    };

    expect(
      shouldDeleteServiceMessage({
        settings: { enabled: true, types: ["member_joined"] },
        kind: "member_joined",
        message: selfJoin,
        botTelegramUserId: 7,
      })
    ).toBe(false);
  });
});
