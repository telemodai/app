import { isSaasMode } from "@/server/core/deployment-mode";
import { UserRepository } from "@/server/database/repositories/user-repository";
import { requireSession } from "@/server/utils/session";
import { getWebhookBaseUrl } from "@/server/utils/telegram-webhook";

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Referral rewards are only available in SaaS mode",
    });
  }

  const { user } = await requireSession(event);
  const users = new UserRepository();
  const code = await users.ensureReferralCode(user.id);
  const baseUrl = getWebhookBaseUrl() ?? "";

  return {
    success: true,
    data: {
      code,
      link: `${baseUrl}/r/${encodeURIComponent(code)}`,
    },
  };
});
