/**
 * Full-page theme reveal — circle-blur port (View Transition API).
 * CSS for `data-theme-vt` lives in ThemeToggle.vue.
 */

const ORIGIN_VAR = "--theme-vt-origin";

export type ThemeTransitionOrigin = {
  x: number;
  y: number;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function supportsViewTransition(): boolean {
  return "startViewTransition" in document;
}

/** Run theme DOM updates inside a circle-blur view transition, or apply immediately. */
export function runThemeTransition(
  apply: () => void,
  origin?: ThemeTransitionOrigin
): void {
  if (prefersReducedMotion() || !supportsViewTransition()) {
    apply();
    return;
  }

  const root = document.documentElement;

  if (origin) {
    root.style.setProperty(ORIGIN_VAR, `${origin.x}px ${origin.y}px`);
  } else {
    root.style.removeProperty(ORIGIN_VAR);
  }

  root.dataset.themeVt = "circle-blur";

  const transition = (
    document as Document & {
      startViewTransition: (callback: () => void) => { finished: Promise<void> };
    }
  ).startViewTransition(() => {
    apply();
  });

  transition.finished.finally(() => {
    delete root.dataset.themeVt;
  });
}
