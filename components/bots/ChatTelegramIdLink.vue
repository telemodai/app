<script setup lang="ts">
const props = defineProps<{
  chatId: number;
  class?: string;
}>();
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full border border-line bg-surface-3 px-2 py-0.5 text-2xs font-medium normal-case tracking-normal text-fg-muted"
    :class="props.class"
  >
    <span class="uppercase tracking-wide text-fg-subtle">ID</span>
    <span class="truncate tabular-nums text-fg">{{ chatId }}</span>
  </span>
</template>
