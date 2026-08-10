<script setup lang="ts">
import { computed } from "vue";

/** ghost = default · primary = accent CTA · destructive = danger · link = text-only · ai = accent pill */
type ButtonVariant = "ghost" | "primary" | "destructive" | "link" | "ai";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    to?: string;
    href?: string;
  }>(),
  {
    variant: "ghost",
    type: "button",
    disabled: false,
  }
);

defineEmits<{
  click: [event: MouseEvent];
}>();

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-control text-sm font-medium transition-[color,background-color,border-color,filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  ghost:
    "border border-line bg-transparent px-4 py-2 text-fg hover:border-line-strong hover:bg-surface-3 disabled:border-line disabled:text-fg-subtle",
  primary:
    "border-0 bg-accent px-4 py-2 text-accent-on hover:brightness-110",
  destructive:
    "border border-danger bg-transparent px-4 py-2 text-danger hover:bg-danger-surface",
  link: "border-0 bg-transparent px-2 py-2 text-accent hover:text-fg min-w-0",
  ai: "!rounded-full border-0 bg-accent-surface px-4 py-2 text-fg normal-case tracking-normal hover:brightness-110",
};

const classes = computed(() => [base, variants[props.variant]]);
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :class="classes"
  >
    <slot />
  </NuxtLink>
  <a
    v-else-if="href"
    :href="href"
    :class="classes"
  >
    <slot />
  </a>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    :class="classes"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
