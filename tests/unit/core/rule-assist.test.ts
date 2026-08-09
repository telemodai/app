import { describe, expect, test } from "bun:test";
import {
  isRuleAssistDraftMode,
  parseRuleAssistResponse,
} from "@/server/core/rule-assist";

describe("rule-assist", () => {
  test("isRuleAssistDraftMode when comment and ai_prompt are empty", () => {
    expect(
      isRuleAssistDraftMode({
        comment: "x",
        ai_prompt: "y",
      })
    ).toBe(false);
    expect(
      isRuleAssistDraftMode({
        comment: "",
        ai_prompt: "",
      })
    ).toBe(true);
  });

  test("isRuleAssistDraftMode treats whitespace-only comment as empty", () => {
    expect(
      isRuleAssistDraftMode({ comment: "  ", ai_prompt: "" })
    ).toBe(true);
    expect(
      isRuleAssistDraftMode({
        comment: "",
        ai_prompt: "criteria",
      })
    ).toBe(false);
  });

  test("parseRuleAssistResponse extracts name, comment and ai_prompt", () => {
    const result = parseRuleAssistResponse(
      `Here you go:\n{"name":"Ads","comment":"Short","ai_prompt":"Long rule text"}`
    );
    expect(result).toEqual({
      name: "Ads",
      comment: "Short",
      ai_prompt: "Long rule text",
    });
  });

  test("parseRuleAssistResponse allows empty comment", () => {
    const result = parseRuleAssistResponse(
      '{"name":"Ads","comment":"","ai_prompt":"Long rule text"}'
    );
    expect(result.comment).toBe("");
  });

  test("parseRuleAssistResponse rejects missing name or ai_prompt", () => {
    expect(() =>
      parseRuleAssistResponse('{"comment":"only comment","ai_prompt":"x"}')
    ).toThrow(/missing name or ai_prompt/);
  });
});
