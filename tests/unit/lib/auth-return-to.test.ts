import { describe, expect, test } from "bun:test";
import {
  DEFAULT_POST_LOGIN_PATH,
  buildTelegramAuthHref,
  normalizeAuthReturnTo,
  resolveReturnToPath,
  sanitizeReturnToPath,
} from "../../../lib/auth-return-to";

describe("auth returnTo", () => {
  test("sanitizeReturnToPath accepts in-app paths", () => {
    expect(sanitizeReturnToPath("/bots?add=join&code=ABC")).toBe(
      "/bots?add=join&code=ABC"
    );
  });

  test("sanitizeReturnToPath rejects open redirects", () => {
    expect(sanitizeReturnToPath("//evil.example")).toBeNull();
    expect(sanitizeReturnToPath("https://evil.example")).toBeNull();
    expect(sanitizeReturnToPath("/javascript:alert(1)")).toBeNull();
  });

  test("sanitizeReturnToPath rejects auth plumbing paths", () => {
    expect(sanitizeReturnToPath("/login")).toBeNull();
    expect(sanitizeReturnToPath("/login?foo=bar")).toBeNull();
    expect(sanitizeReturnToPath("/api/auth/telegram")).toBeNull();
    expect(sanitizeReturnToPath("/api/auth/telegram?returnTo=/")).toBeNull();
  });

  test("buildTelegramAuthHref avoids nested returnTo", () => {
    expect(buildTelegramAuthHref(null)).toBe("/api/auth/telegram");
    expect(buildTelegramAuthHref("/bots")).toBe(
      "/api/auth/telegram?returnTo=%2Fbots"
    );
    expect(buildTelegramAuthHref("/api/auth/telegram?returnTo=/")).toBe(
      "/api/auth/telegram"
    );
    expect(buildTelegramAuthHref("/login?returnTo=/")).toBe(
      "/api/auth/telegram"
    );
  });

  test("normalizeAuthReturnTo maps /join to bots join modal", () => {
    expect(normalizeAuthReturnTo("/join?code=TEAM42")).toBe(
      "/bots?add=join&code=TEAM42"
    );
    expect(normalizeAuthReturnTo("/join")).toBe("/bots?add=join");
  });

  test("resolveReturnToPath falls back to default", () => {
    expect(resolveReturnToPath(null)).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(resolveReturnToPath("//bad")).toBe(DEFAULT_POST_LOGIN_PATH);
  });
});
