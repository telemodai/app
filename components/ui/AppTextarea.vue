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
    class="tm-field font-mono"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
