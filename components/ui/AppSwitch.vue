<script setup lang="ts">
/**
 * Accessible on/off control (shadcn Switch shape) using app design tokens.
 * Off state stays clearly interactive — only a paired LED should look “dead”.
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    disabled?: boolean;
    id?: string;
  }>(),
  {
    disabled: false,
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

function onToggle() {
  if (props.disabled) return;
  emit("update:modelValue", !props.modelValue);
}
</script>

<template>
  <button
    :id="id"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
    :class="
      modelValue
        ? 'border-transparent bg-accent hover:brightness-110'
        : 'border-line-strong bg-surface-4 hover:border-fg-muted'
    "
    @click="onToggle"
  >
    <!-- Bright thumb off; accent-on when checked (contrast on accent track) -->
    <span
      class="pointer-events-none block size-4 rounded-full shadow-sm transition-[transform,background-color]"
      :class="
        modelValue
          ? 'translate-x-4.5 bg-accent-on'
          : 'translate-x-0.5 bg-fg'
      "
    />
  </button>
</template>
