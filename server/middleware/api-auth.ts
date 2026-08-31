import { requireSession } from "@/server/utils/session";

export default defineEventHandler(async (event) => {
  const path = event.path;

  if (!path.startsWith("/api/")) {
    return;
  }

  if (path.startsWith("/api/auth")) {
    return;
  }

  if (path.startsWith("/api/telegram/webhook")) {
    return;
  }

  if (path === "/api/health") {
    return;
  }

  // Anonymous referral landing (/r/:code, ?ref=) must set cookie before login.
  if (path === "/api/referral/attribution") {
    return;
  }

  await requireSession(event);
});
