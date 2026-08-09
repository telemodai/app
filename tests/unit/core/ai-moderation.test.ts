import { describe, expect, test } from "bun:test";
import type OpenAI from "openai";
import {
  analyzeMessage,
  buildModerationSystemPrompt,
  buildModerationUserPrompt,
} from "@/server/core/ai-moderation";

function createCapturingClient(
  responseContent: string,
  onCreate?: (messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) => void
): OpenAI {
  return {
    chat: {
      completions: {
        create: async (params) => {
          onCreate?.(params.messages);
          return {
            choices: [{ message: { content: responseContent } }],
          };
        },
      },
    },
  } as unknown as OpenAI;
}

describe("buildModerationSystemPrompt", () => {
  test("contains moderator role and JSON format without rule-specific content", () => {
    const prompt = buildModerationSystemPrompt();

    expect(prompt).toContain("chat moderator");
    expect(prompt).toContain("violation_detected");
    expect(prompt).toContain("chat_history");
    expect(prompt).not.toContain("CHAT RULES");
  });

  test("instructs model to use history for intent, tone, and patterns", () => {
    const prompt = buildModerationSystemPrompt();

    const mustContain = [
      "intent",
      "sarcasm",
      "multi-message",
      "lower confidence",
      "reasoning",
      "MESSAGE TO ANALYZE",
    ];

    for (const phrase of mustContain) {
      expect(prompt.toLowerCase()).toContain(phrase.toLowerCase());
    }
  });
});

describe("buildModerationUserPrompt", () => {
  test("includes rules and message without duplicated system instructions", () => {
    const prompt = buildModerationUserPrompt(
      {
        message: "buy now",
        user_id: 424242,
        username: "alice",
        chat_id: 1,
        rules: ["spam"],
        context: {
          user_warnings: 1,
          chat_history: [
            {
              text: "hello",
              timestamp: "2026-07-11T10:00:00.000Z",
            },
          ],
        },
      },
      [
        {
          id: "spam",
          name: "Spam",
          comment: "No spam",
          ai_prompt: "commercial links without permission",
        },
      ]
    );

    expect(prompt).toContain("MESSAGE TO ANALYZE");
    expect(prompt).toContain("[spam]");
    expect(prompt).toContain("commercial links without permission");
    expect(prompt).toContain("Telegram user id: 424242");
    expect(prompt).toContain("Telegram username: @alice");
    expect(prompt).toContain("Previous warnings: 1");
    expect(prompt).toContain('"text":"hello"');
    expect(prompt).toContain("2026-07-11T10:00:00.000Z");
    expect(prompt).not.toContain("JSON response only");
    expect(prompt).not.toContain("You are a chat moderator");
  });

  test("shows (none) when Telegram username is missing", () => {
    const prompt = buildModerationUserPrompt(
      {
        message: "hi",
        user_id: 99,
        chat_id: 1,
        rules: [],
        context: { user_warnings: 0, chat_history: [] },
      },
      []
    );

    expect(prompt).toContain("Telegram user id: 99");
    expect(prompt).toContain("Telegram username: (none)");
  });
});

describe("analyzeMessage", () => {
  test("parses LLM JSON response", async () => {
    const client = createMockClient(
      JSON.stringify({
        violation_detected: true,
        rule_violated: "spam",
        confidence: 0.91,
        reasoning: "Promotional link",
      })
    );

    const result = await analyzeMessage(
      {
        message: "buy now",
        user_id: 111,
        username: "bob",
        chat_id: 1,
        rules: ["spam"],
        context: {
          user_warnings: 1,
          chat_history: [
            {
              text: "hello",
              timestamp: "2026-07-11T10:00:00.000Z",
            },
          ],
        },
      },
      [
        {
          id: "spam",
          name: "Spam",
          comment: "No spam",
          ai_prompt: "detect spam",
        },
      ],
      {
        client,
        model: "gpt-test",
        config: {
          apiKey: "test",
          model: "gpt-test",
        },
      }
    );

    expect(result.response.violation_detected).toBe(true);
    expect(result.response.rule_violated).toBe("spam");
    expect(result.response.confidence).toBeCloseTo(0.91);
  });

  test("sends system and user prompts without duplicated methodology", async () => {
    let capturedMessages:
      | OpenAI.Chat.Completions.ChatCompletionMessageParam[]
      | undefined;

    const client = createCapturingClient(
      JSON.stringify({
        violation_detected: false,
        confidence: 0.1,
        reasoning: "Allowed",
      }),
      (messages) => {
        capturedMessages = messages;
      }
    );

    await analyzeMessage(
      {
        message: "hello",
        user_id: 555,
        username: "carol",
        chat_id: 1,
        rules: ["spam"],
        context: { user_warnings: 0, chat_history: [] },
      },
      [
        {
          id: "spam",
          name: "Spam",
          comment: "No spam",
          ai_prompt: "commercial ads",
        },
      ],
      {
        client,
        model: "gpt-test",
        config: {
          apiKey: "test",
          model: "gpt-test",
        },
      }
    );

    const system = String(capturedMessages?.[0]?.content ?? "");
    const user = String(capturedMessages?.[1]?.content ?? "");

    expect(system).toContain("chat moderator");
    expect(user).toContain("MESSAGE TO ANALYZE");
    expect(user).toContain("Telegram user id: 555");
    expect(user).toContain("Telegram username: @carol");
    expect(user).not.toContain("JSON response only");
    expect(system).toContain("chat_history");
  });

  test("works with alternate provider config without throwing", async () => {
    const client = createMockClient(
      JSON.stringify({
        violation_detected: false,
        confidence: 0.2,
        reasoning: "Allowed",
      })
    );

    const result = await analyzeMessage(
      {
        message: "hello team",
        user_id: 777,
        chat_id: 1,
        rules: [],
        context: {
          user_warnings: 0,
          chat_history: [],
        },
      },
      [],
      {
        client,
        model: "openrouter/test-model",
        config: {
          apiKey: "test",
          baseUrl: "https://openrouter.ai/api/v1",
          model: "openrouter/test-model",
        },
      }
    );

    expect(result.response.violation_detected).toBe(false);
  });
});

function createMockClient(responseContent: string): OpenAI {
  return createCapturingClient(responseContent);
}
