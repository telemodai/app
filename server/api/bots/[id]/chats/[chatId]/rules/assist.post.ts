import { rewriteRuleText, type RuleAssistInput } from "@/server/core/rule-assist";
import { logger } from "@/server/core/logger";
import { requireBotAccess } from "@/server/utils/bot-access";
import { requireBotIdParam } from "@/server/utils/get-bot-id-param";
import { requireBotChat } from "@/server/utils/require-bot-chat";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  await requireBotAccess(event, botId);
  await requireBotChat(event, botId);

  const body = (await readBody(event)) as Partial<RuleAssistInput>;

  const input: RuleAssistInput = {
    name: typeof body.name === "string" ? body.name : undefined,
    comment: typeof body.comment === "string" ? body.comment : "",
    ai_prompt: typeof body.ai_prompt === "string" ? body.ai_prompt : "",
    instruction: typeof body.instruction === "string" ? body.instruction : "",
  };

  if (!input.instruction.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "instruction is required",
    });
  }

  try {
    const { result } = await rewriteRuleText(input);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error({ error: error as Error, botId }, "Rule assist failed");
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to rewrite rule text",
    });
  }
});
