import { describe, expect, test } from "bun:test";
import {
  formatLocaleNumber,
  localeCodeToIntlLocale,
} from "@/lib/locale-format";

describe("locale-format", () => {
  test("localeCodeToIntlLocale maps app locales", () => {
    expect(localeCodeToIntlLocale("ru")).toBe("ru-RU");
    expect(localeCodeToIntlLocale("en")).toBe("en-US");
  });

  test("formatLocaleNumber uses explicit locale for stable SSR output", () => {
    const value = 1990;
    expect(formatLocaleNumber(value, "en")).toBe(
      value.toLocaleString("en-US")
    );
    expect(formatLocaleNumber(value, "ru")).toBe(
      value.toLocaleString("ru-RU")
    );
  });
});
