<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  rows?: number;
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();

const textareaEl = ref<HTMLTextAreaElement | null>(null);

defineExpose({
  textareaEl,
});
</script>

<template>
  <textarea
    ref="textareaEl"
    :id="id"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows ?? 4"
    class="w-full rounded-control border border-surface-4 bg-surface-2 p-3 font-mono text-body text-fg placeholder:text-fg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
