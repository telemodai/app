/** Brand asset paths (synced from brand/assets/export/{dark,light} by scripts/sync-brand-public.mjs). */

export type ThemeRegister = "dark" | "light";

/** User-facing theme preference — `system` defers to OS via CSS `prefers-color-scheme`. */
export type ThemeChoice = "system" | ThemeRegister;

export const THEME_STORAGE_KEY = "tm-theme";

/** surface-1 per register — matches tokens.json / tokens.css */
export const themeColorByRegister: Record<ThemeRegister, string> = {
  dark: "oklch(0.1957 0 0)",
  light: "oklch(0.99 0 0)",
};

export function brandAssets(register: ThemeRegister) {
  const base = `/${register}`;

  return {
    register,
    faviconIco: `${base}/favicon/favicon.ico`,
    faviconSvg: `${base}/favicon/favicon.svg`,
    appleTouchIcon: `${base}/apple-touch-icon.png`,
    themeColor: themeColorByRegister[register],
  } as const;
}

/** Default SSR / meta fallbacks (dark register). */
export const brandPublic = brandAssets("dark");
