<template>
  <component
    :is="tag"
    class="rounded-card border border-line bg-surface-2"
    :class="padding ? 'p-4' : ''"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: boolean;
    tag?: "div" | "section" | "article";
  }>(),
  {
    padding: true,
    tag: "div",
  }
);
</script>
