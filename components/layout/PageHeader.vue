<template>
  <div class="mb-12">
    <div
      v-if="showBreadcrumbs"
      class="mb-6 flex min-w-0 items-center gap-2"
    >
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
        class="min-w-0 text-sm text-fg-muted"
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

    <!-- Title and actions share one baseline so CTAs sit with the page heading. -->
    <div
      v-if="title || $slots['title-extra'] || $slots.actions"
      class="flex flex-wrap items-center justify-between gap-4"
    >
      <div
        v-if="title || $slots['title-extra']"
        class="flex min-w-0 items-center gap-3.5"
      >
        <h1 v-if="title" class="tm-page-title min-w-0 leading-none">
          {{ title }}
        </h1>
        <slot name="title-extra" />
      </div>
      <div
        v-if="$slots.actions"
        class="flex shrink-0 flex-wrap gap-2"
        :class="title || $slots['title-extra'] ? '' : 'ml-auto'"
      >
        <slot name="actions" />
      </div>
    </div>

    <p v-if="subtitle && !$slots.subtitle" class="mt-2 text-sm text-fg-muted">
      {{ subtitle }}
    </p>
    <div v-else-if="$slots.subtitle" class="mt-2 text-sm">
      <slot name="subtitle" />
    </div>
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
