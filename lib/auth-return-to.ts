/** Default landing after Telegram OIDC when no return path is stored. */
export const DEFAULT_POST_LOGIN_PATH = "/bots";

/** Paths that must never be used as post-login redirects (auth loop / plumbing). */
function isAuthPlumbingPath(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return true;
  }
  if (pathname.startsWith("/api/auth")) {
    return true;
  }
  return false;
}

/**
 * Validates a post-login redirect path (same-origin relative only).
 * Rejects protocol-relative URLs, backslashes, embedded schemes, and auth plumbing.
 */
export function sanitizeReturnToPath(
  input: string | null | undefined
): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.includes("\\") || trimmed.includes("\0")) {
    return null;
  }

  // Reject paths that look like "/http:" or "/javascript:".
  if (/^\/[^/?#]*:/i.test(trimmed)) {
    return null;
  }

  try {
    const url = new URL(trimmed, "http://local");
    if (isAuthPlumbingPath(url.pathname)) {
      return null;
    }
  } catch {
    return null;
  }

  return trimmed;
}

/** Map legacy invite URLs to the bots page join modal query. */
export function normalizeAuthReturnTo(fullPath: string): string {
  try {
    const url = new URL(fullPath, "http://local");
    if (url.pathname === "/join") {
      const params = new URLSearchParams({ add: "join" });
      const code = url.searchParams.get("code")?.trim();
      if (code) {
        params.set("code", code);
      }
      return `/bots?${params.toString()}`;
    }
  } catch {
    // fall through
  }

  return fullPath;
}

export function resolveReturnToPath(
  input: string | null | undefined
): string {
  const normalized =
    typeof input === "string" ? normalizeAuthReturnTo(input) : null;
  return sanitizeReturnToPath(normalized) ?? DEFAULT_POST_LOGIN_PATH;
}

/** Build href for the Telegram OIDC start link from an optional /login?returnTo value. */
export function buildTelegramAuthHref(
  returnToQuery: string | null | undefined
): string {
  if (!returnToQuery?.trim()) {
    return "/api/auth/telegram";
  }

  const sanitized = sanitizeReturnToPath(
    normalizeAuthReturnTo(returnToQuery)
  );
  if (!sanitized) {
    return "/api/auth/telegram";
  }

  return `/api/auth/telegram?returnTo=${encodeURIComponent(sanitized)}`;
}
