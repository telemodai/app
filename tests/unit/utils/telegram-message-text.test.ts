import { describe, expect, test } from "bun:test";
import { getTelegramMessageText } from "@/server/utils/telegram-message-text";

describe("getTelegramMessageText", () => {
  test("returns plain text when present", () => {
    expect(getTelegramMessageText({ text: "hello" })).toBe("hello");
  });

  test("returns caption when text is absent", () => {
    expect(
      getTelegramMessageText({
        caption: "forwarded promo from another group",
      })
    ).toBe("forwarded promo from another group");
  });

  test("prefers text over caption when both are set", () => {
    expect(
      getTelegramMessageText({
        text: "primary",
        caption: "secondary",
      })
    ).toBe("primary");
  });

  test("trims whitespace and treats blank values as missing", () => {
    expect(getTelegramMessageText({ text: "  " })).toBeUndefined();
    expect(getTelegramMessageText({ caption: "  " })).toBeUndefined();
    expect(getTelegramMessageText({})).toBeUndefined();
  });
});
