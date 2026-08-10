import { describe, expect, test } from "bun:test";
import { telegramChatWebUrl } from "@/lib/telegram-chat-url";

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

  test("builds supergroup link from -100 id", () => {
    expect(
      telegramChatWebUrl({
        chat_id: -1002740965103,
      })
    ).toBe("https://t.me/c/2740965103");
  });

  test("builds legacy group link from negative id", () => {
    expect(
      telegramChatWebUrl({
        chat_id: -12345,
      })
    ).toBe("https://t.me/c/12345");
  });

  test("returns null for non-group positive id", () => {
    expect(
      telegramChatWebUrl({
        chat_id: 42,
      })
    ).toBeNull();
  });
});
