<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 11"
    fill="currentColor"
    class="block h-[1em] w-auto"
    :role="title ? 'img' : undefined"
    :aria-hidden="title ? undefined : true"
  >
    <title v-if="title">{{ title }}</title>
    <path d="M0 0h12v2H0zm4.5 3h3v8h-3z" />
  </svg>
</template>
