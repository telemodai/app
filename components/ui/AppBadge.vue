<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    variant?: "neutral" | "success" | "danger" | "warning" | "accent" | "muted";
  }>(),
  {
    variant: "neutral",
  }
);

const variantClass = computed(() => {
  switch (props.variant) {
    case "success":
      return "border-line bg-action-unban-surface text-action-unban";
    case "danger":
      return "border-line bg-danger-surface text-danger";
    case "warning":
      return "border-line bg-action-warning-surface text-action-warning";
    case "accent":
      return "border-line bg-accent-surface text-accent";
    case "muted":
      return "border-line bg-surface-3 text-fg-muted";
    default:
      return "border-line bg-surface-3 text-fg";
  }
});
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide leading-tight"
    :class="variantClass"
  >
    <slot />
  </span>
</template>
