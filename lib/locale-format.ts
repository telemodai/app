/** Map @nuxtjs/i18n locale code to a BCP 47 tag for Intl formatters. */
export function localeCodeToIntlLocale(localeCode: string): string {
  return localeCode === "ru" ? "ru-RU" : "en-US";
}

/** SSR-safe number formatting — always pass explicit locale, never bare toLocaleString(). */
export function formatLocaleNumber(
  value: number,
  localeCode: string
): string {
  return value.toLocaleString(localeCodeToIntlLocale(localeCode));
}
