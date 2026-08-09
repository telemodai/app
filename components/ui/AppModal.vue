<script setup lang="ts">
defineProps<{
  open: boolean;
  titleId?: string;
}>();

defineEmits<{
  close: [];
}>();

function onBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    event.preventDefault();
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click="onBackdropClick"
      @keydown.escape="$emit('close')"
    >
      <div
        class="w-full max-h-[85vh] overflow-y-auto rounded-card border border-line bg-surface-2 p-6 shadow-overlay"
        role="dialog"
        :aria-labelledby="titleId"
        @click.stop
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
