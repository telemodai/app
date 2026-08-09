<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    titleId?: string;
    /** Panel max width — must be set on the shell, not inner content. */
    size?: "sm" | "md" | "lg";
  }>(),
  {
    size: "md",
  }
);

defineEmits<{
  close: [];
}>();

const panelSizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "max-w-md";
    case "lg":
      return "max-w-2xl";
    default:
      return "max-w-lg";
  }
});

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
        class="w-full max-h-[85vh] overflow-y-auto rounded-surface border border-line bg-surface-2 p-6 shadow-overlay"
        :class="panelSizeClass"
        role="dialog"
        :aria-labelledby="titleId"
        @click.stop
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
