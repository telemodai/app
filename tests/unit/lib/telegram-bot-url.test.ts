import { describe, expect, test } from "bun:test";
import { telegramBotWebUrl } from "@/lib/telegram-bot-url";

describe("telegramBotWebUrl", () => {
  test("builds t.me link from bot id", () => {
    expect(telegramBotWebUrl("mmmoder_ai_bot")).toBe(
      "https://t.me/mmmoder_ai_bot"
    );
  });

  test("strips leading @", () => {
    expect(telegramBotWebUrl("@my_bot")).toBe("https://t.me/my_bot");
  });
});
