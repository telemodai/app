import {
  THEME_STORAGE_KEY,
  type ThemeChoice,
  type ThemeRegister,
  brandAssets,
} from "@/lib/brand";
import { runThemeTransition } from "@/lib/theme-transition.client";

const CYCLE_ORDER: ThemeChoice[] = ["system", "light", "dark"];

const CHOICE_LABELS: Record<ThemeChoice, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

function getStoredTheme(): ThemeRegister | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

function getStoredChoice(): ThemeChoice {
  return getStoredTheme() ?? "system";
}

function nextChoice(current: ThemeChoice): ThemeChoice {
  const index = CYCLE_ORDER.indexOf(current);
  return CYCLE_ORDER[(index + 1) % CYCLE_ORDER.length];
}

function getSystemTheme(): ThemeRegister {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function getEffectiveTheme(): ThemeRegister {
  return getStoredTheme() ?? getSystemTheme();
}

function applyDataTheme(theme: ThemeRegister | null) {
  if (theme) {
    document.documentElement.dataset.theme = theme;
    return;
  }

  delete document.documentElement.dataset.theme;
}

function updateMetaAssets(register: ThemeRegister) {
  const assets = brandAssets(register);

  const ico = document.getElementById(
    "theme-favicon-ico"
  ) as HTMLLinkElement | null;
  const svg = document.getElementById(
    "theme-favicon-svg"
  ) as HTMLLinkElement | null;
  const apple = document.getElementById(
    "theme-apple-touch"
  ) as HTMLLinkElement | null;
  const meta = document.getElementById(
    "theme-color-meta"
  ) as HTMLMetaElement | null;

  if (ico) ico.href = assets.faviconIco;
  if (svg) svg.href = assets.faviconSvg;
  if (apple) apple.href = assets.appleTouchIcon;
  if (meta) meta.content = assets.themeColor;
}

function updateCycleUi(choice: ThemeChoice, animate = false) {
  const button = document.querySelector<HTMLButtonElement>("[data-theme-cycle]");
  if (!button) return;

  button.setAttribute(
    "aria-label",
    `Theme: ${CHOICE_LABELS[choice]}. Click to switch.`
  );

  document
    .querySelectorAll<SVGElement>("[data-theme-icon]")
    .forEach((icon) => {
      const id = icon.dataset.themeIcon as ThemeChoice | undefined;
      if (!id) return;

      const isTarget = id === choice;

      if (!animate) {
        icon.classList.remove("was-active", "is-active");
        if (isTarget) icon.classList.add("is-active");
        return;
      }

      if (isTarget) {
        icon.classList.add("is-active");
        return;
      }

      if (icon.classList.contains("is-active")) {
        icon.classList.remove("is-active");
        icon.classList.add("was-active");

        const cleanup = () => {
          icon.classList.remove("was-active");
          icon.removeEventListener("transitionend", cleanup);
        };

        icon.addEventListener("transitionend", cleanup);
      }
    });
}

export function setThemeChoice(choice: ThemeChoice, animate = true) {
  try {
    if (choice === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, choice);
    }
  } catch {
    // Private browsing — still apply for this session.
  }

  applyDataTheme(choice === "system" ? null : choice);
  updateMetaAssets(getEffectiveTheme());
  updateCycleUi(choice, animate);

  window.dispatchEvent(new CustomEvent("tm-theme-change"));
}

export function initTheme() {
  const choice = getStoredChoice();
  applyDataTheme(choice === "system" ? null : choice);
  updateMetaAssets(getEffectiveTheme());
  updateCycleUi(choice, false);

  const cycleButton = document.querySelector<HTMLButtonElement>(
    "[data-theme-cycle]"
  );
  cycleButton?.addEventListener("click", (event) => {
    const next = nextChoice(getStoredChoice());
    runThemeTransition(() => setThemeChoice(next, true), {
      x: event.clientX,
      y: event.clientY,
    });
  });

  window
    .matchMedia("(prefers-color-scheme: light)")
    .addEventListener("change", () => {
      if (getStoredTheme()) return;

      updateMetaAssets(getEffectiveTheme());
      window.dispatchEvent(new CustomEvent("tm-theme-change"));
    });
}
