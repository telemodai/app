<script setup lang="ts">
defineProps<{
  variant?: "neutral" | "danger";
}>();
</script>

<template>
  <div
    class="rounded-card border p-3 text-sm"
    :class="
      variant === 'danger'
        ? 'border-danger bg-danger-surface text-danger'
        : 'border-line bg-surface-2 text-fg'
    "
  >
    <slot />
  </div>
</template>
