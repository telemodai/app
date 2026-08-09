<script setup lang="ts">
import { Monitor, Moon, Sun } from "lucide-vue-next";

const iconProps = {
  size: 20,
  strokeWidth: 1.5,
  absoluteStrokeWidth: true,
};
</script>

<template>
  <button
    type="button"
    data-theme-cycle
    class="theme-cycle relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-fg-muted transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    aria-label="Theme: System. Click to switch."
  >
    <span class="theme-cycle__stage relative block size-5" aria-hidden="true">
      <Monitor
        v-bind="iconProps"
        data-theme-icon="system"
        class="theme-cycle__icon is-active absolute inset-0 size-5"
      />
      <Sun
        v-bind="iconProps"
        data-theme-icon="light"
        class="theme-cycle__icon absolute inset-0 size-5"
      />
      <Moon
        v-bind="iconProps"
        data-theme-icon="dark"
        class="theme-cycle__icon absolute inset-0 size-5"
      />
    </span>
  </button>
</template>

<style>
html[data-theme-vt="circle-blur"]::view-transition-old(root) {
  animation: none;
  mix-blend-mode: normal;
}

html[data-theme-vt="circle-blur"]::view-transition-new(root) {
  mix-blend-mode: normal;
  animation: theme-circle-blur-reveal 700ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes theme-circle-blur-reveal {
  from {
    clip-path: circle(0% at var(--theme-vt-origin, 50% 50%));
    filter: blur(8px);
  }

  to {
    clip-path: circle(150% at var(--theme-vt-origin, 50% 50%));
    filter: blur(0);
  }
}

.theme-cycle__icon {
  opacity: 0;
  transform: rotate(-42deg) scale(0.5);
  transition:
    opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}

.theme-cycle__icon.is-active {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.theme-cycle__icon.was-active {
  opacity: 0;
  transform: rotate(42deg) scale(0.5);
}

.theme-cycle:active .theme-cycle__stage {
  transform: scale(0.92);
}

@media (prefers-reduced-motion: reduce) {
  .theme-cycle__icon {
    transition: none;
  }

  .theme-cycle:active .theme-cycle__stage {
    transform: none;
  }
}
</style>
