import { describe, expect, test } from "bun:test";
import { buildTelegramStartGroupDeepLink } from "@/lib/chat-activation-ui";

describe("buildTelegramStartGroupDeepLink", () => {
  test("builds startgroup link with moderation admin rights", () => {
    expect(buildTelegramStartGroupDeepLink("my_bot")).toBe(
      "https://t.me/my_bot?startgroup&admin=delete_messages+restrict_members"
    );
    expect(buildTelegramStartGroupDeepLink("@my_bot")).toBe(
      "https://t.me/my_bot?startgroup&admin=delete_messages+restrict_members"
    );
  });
});
