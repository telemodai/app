<template>
  <footer
    class="border-t border-line bg-surface-0 px-4 pt-4 pb-8 text-center text-sm text-fg-muted"
  >
    <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <NuxtLink to="/release-notes" class="hover:text-fg hover:underline">
        {{ t("footer.releaseNotes") }}
      </NuxtLink>
      <template v-if="isSaas">
        <span class="text-fg-subtle">·</span>
        <a
          :href="APP_LINKS.productSite"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-fg hover:underline"
        >
          {{ t("footer.productSite") }}
        </a>
      </template>
      <span class="text-fg-subtle">·</span>
      <a
        :href="APP_LINKS.authorSite"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-fg hover:underline"
      >
        {{ t("footer.author") }}
      </a>
      <span class="text-fg-subtle">·</span>
      <NuxtLink to="/docs" class="hover:text-fg hover:underline">
        {{ t("footer.docs") }}
      </NuxtLink>
      <span class="text-fg-subtle">·</span>
      <NuxtLink to="/terms" class="hover:text-fg hover:underline">
        {{ t("footer.terms") }}
      </NuxtLink>
      <template v-if="isSelfHosted">
        <span class="text-fg-subtle">·</span>
        <a
          :href="APP_LINKS.githubRepo"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-fg hover:underline"
        >
          {{ t("footer.github") }}
        </a>
      </template>
    </div>
    <div
      class="mt-5 flex flex-wrap items-center justify-center gap-x-2 text-xs text-fg-muted"
    >
      <span>
        {{ appName }}
        <NuxtLink to="/release-notes" class="hover:text-fg hover:underline">
          v{{ appVersion }}
        </NuxtLink>
        <span class="hidden sm:inline">
          <span class="text-fg-subtle"> — </span>
          {{ t("footer.tagline") }}
        </span>
      </span>
      <span class="text-fg-subtle">|</span>
      <LayoutLocaleSwitcher class="text-xs" />
    </div>
  </footer>
</template>

<script setup lang="ts">
import { APP_LINKS } from "@/lib/app-config";

const { t } = useI18n();
const appName = useAppName();

const runtimeConfig = useRuntimeConfig();
const appVersion = computed(() => runtimeConfig.public.appVersion as string);
const isSelfHosted = computed(
  () => runtimeConfig.public.deploymentMode === "self-hosted"
);
const isSaas = computed(() => runtimeConfig.public.deploymentMode === "saas");
</script>
