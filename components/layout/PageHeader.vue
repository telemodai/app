<template>
  <div class="mb-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div v-if="showBreadcrumbs" class="flex min-w-0 items-center gap-2">
        <UiAppButton
          v-if="backTo"
          variant="ghost"
          class="!min-w-0 !px-2 !py-1"
          :aria-label="t('common.back')"
          @click="navigateTo(backTo)"
        >
          ←
        </UiAppButton>
        <nav
          class="min-w-0 text-body text-fg-muted"
          :aria-label="t('common.breadcrumb')"
        >
          <ol class="flex flex-wrap items-center gap-1">
            <li
              v-for="(item, index) in breadcrumbs"
              :key="`${item.label}-${index}`"
              class="inline-flex items-center gap-1"
            >
              <NuxtLink
                v-if="item.to"
                :to="item.to"
                class="max-w-[12rem] truncate hover:text-fg hover:underline sm:max-w-none"
              >
                {{ item.label }}
              </NuxtLink>
              <span
                v-else
                class="max-w-[12rem] truncate font-medium text-fg sm:max-w-none"
              >
                {{ item.label }}
              </span>
              <span v-if="index < breadcrumbs.length - 1" class="text-fg-subtle"
                >›</span
              >
            </li>
          </ol>
        </nav>
      </div>
      <div v-if="$slots.actions" class="ml-auto flex shrink-0 flex-wrap gap-2">
        <slot name="actions" />
      </div>
    </div>
    <h1
      v-if="title"
      class="font-display text-heading-sm tracking-[-0.035em] text-fg"
      :class="showBreadcrumbs ? 'mt-3' : ''"
    >
      {{ title }}
    </h1>
    <p v-if="subtitle" class="mt-1 text-body text-fg-muted">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from "@/composables/usePageBreadcrumbs";

const { t } = useI18n();

const props = defineProps<{
  breadcrumbs: BreadcrumbItem[];
  backTo?: string;
  title?: string;
  subtitle?: string;
}>();

const showBreadcrumbs = computed(() => props.breadcrumbs.length > 1);
</script>
