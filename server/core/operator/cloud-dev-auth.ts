import { randomUUID } from "node:crypto";
import { LoginBotTokenRepository } from "@/server/database/repositories/login-bot-token-repository";
import { UserRepository } from "@/server/database/repositories/user-repository";

/**
 * Cloud Agent environment only — see `.cursor/environment/scripts/install.sh`.
 * Fixed localhost browser login for the pre-seeded dev user. Not for production.
 */
export const CLOUD_DEV_USER_ID = "cloud-dev-user-0001";
export const CLOUD_DEV_TELEGRAM_ID = 100000001;
export const CLOUD_DEV_LOGIN_TOKEN = "cloud-dev-login";
export const CLOUD_DEV_BROWSER_LOGIN_URL = `http://localhost:3001/auth/bot-link?token=${CLOUD_DEV_LOGIN_TOKEN}`;

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function refreshCloudDevLoginToken(): Promise<string> {
  const userRepo = new UserRepository();
  const user = await userRepo.findByTelegramId(CLOUD_DEV_TELEGRAM_ID);
  if (!user) {
    throw new Error(
      "Cloud dev user not found. Rebuild the Cloud Agent environment snapshot."
    );
  }

  const tokenRepo = new LoginBotTokenRepository();
  await tokenRepo.deleteByToken(CLOUD_DEV_LOGIN_TOKEN);

  await tokenRepo.insert({
    id: randomUUID(),
    token: CLOUD_DEV_LOGIN_TOKEN,
    telegramId: user.telegram_id,
    username: user.username ?? null,
    name: user.name,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  });

  return CLOUD_DEV_BROWSER_LOGIN_URL;
}
