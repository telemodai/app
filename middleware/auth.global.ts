import { fetchSession } from "@/lib/fetch-session";
import {
  normalizeAuthReturnTo,
  sanitizeReturnToPath,
} from "@/lib/auth-return-to";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return true;
  }
  // Referral landing must run before login so attribution can set tg_referral_code.
  if (pathname.startsWith("/r/")) {
    return true;
  }
  return false;
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (isPublicPath(to.path)) {
    return;
  }

  const session = await fetchSession();

  if (!session?.user) {
    const sanitized = sanitizeReturnToPath(
      normalizeAuthReturnTo(to.fullPath)
    );
    return navigateTo({
      path: "/login",
      ...(sanitized ? { query: { returnTo: sanitized } } : {}),
    });
  }
});
