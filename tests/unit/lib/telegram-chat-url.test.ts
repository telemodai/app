import { describe, expect, test } from "bun:test";
import {
  telegramChatWebUrl,
  telegramPrivatePostUrl,
} from "@/lib/telegram-chat-url";

describe("telegramChatWebUrl", () => {
  test("prefers public username", () => {
    expect(
      telegramChatWebUrl({
        chat_id: -1002740965103,
        telegram_username: "mygroup",
      })
    ).toBe("https://t.me/mygroup");
  });

  test("strips @ from username", () => {
    expect(
      telegramChatWebUrl({
        chat_id: -1001,
        telegram_username: "@channel",
      })
    ).toBe("https://t.me/channel");
  });

  test("opens private supergroup in Telegram Web", () => {
    expect(
      telegramChatWebUrl({
        chat_id: -1002740965103,
      })
    ).toBe("https://web.telegram.org/a/#-1002740965103");
  });

  test("opens legacy group in Telegram Web", () => {
    expect(
      telegramChatWebUrl({
        chat_id: -12345,
      })
    ).toBe("https://web.telegram.org/a/#-12345");
  });

  test("returns null for non-group positive id", () => {
    expect(
      telegramChatWebUrl({
        chat_id: 42,
      })
    ).toBeNull();
  });
});

describe("telegramPrivatePostUrl", () => {
  test("includes message id for t.me private post links", () => {
    expect(telegramPrivatePostUrl(-1002740965103)).toBe(
      "https://t.me/c/2740965103/1"
    );
  });
});
