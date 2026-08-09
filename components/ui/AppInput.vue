<script setup lang="ts">
defineProps<{
  modelValue?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  autocomplete?: string;
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <input
    :id="id"
    :type="type ?? 'text'"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :autocomplete="autocomplete"
    class="w-full rounded-control border border-surface-4 bg-surface-2 p-3 text-body text-fg placeholder:text-fg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>
