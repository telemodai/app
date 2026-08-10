<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-1 p-4">
    <UiAppCard class="w-full max-w-md !p-6 space-y-6 text-center">
      <h1 class="tm-page-title">
        {{ appName }}
      </h1>
      <p class="text-sm text-fg-muted">
        {{ t("login.subtitle") }}
      </p>
      <UiAppButton
        variant="primary"
        :href="telegramAuthHref"
        class="w-full"
      >
        {{ t("login.signInButton") }}
      </UiAppButton>
      <p v-if="botLoginDeepLink" class="text-sm text-fg-muted">
        {{ t("login.trouble") }}
        <a
          :href="botLoginDeepLink"
          class="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t("login.getLinkFromBot") }}
        </a>
      </p>
      <div class="pt-2 flex flex-wrap items-center justify-center gap-x-2 text-sm text-fg-muted">
        <span>
          {{ appName }}
          <NuxtLink to="/release-notes" class="hover:text-fg hover:underline">
            v{{ appVersion }}
          </NuxtLink>
        </span>
        <span class="text-fg-subtle">|</span>
        <LayoutLocaleSwitcher />
      </div>
    </UiAppCard>
  </div>
</template>

<script setup lang="ts">
import { buildTelegramAuthHref } from "@/lib/auth-return-to";

definePageMeta({
  layout: false,
});

const { t } = useI18n();
const appName = useAppName();

usePageTitle(() => t("page.login.documentTitle"));

const config = useRuntimeConfig();
const appVersion = computed(() => config.public.appVersion as string);

const route = useRoute();

const botLoginDeepLink = computed(() => {
  const username = config.public.telegramLoginBotUsername?.trim();
  if (!username) return "";
  return `https://t.me/${username}?start=login`;
});

const telegramAuthHref = computed(() => {
  const returnTo = route.query.returnTo;
  return buildTelegramAuthHref(
    typeof returnTo === "string" ? returnTo : null
  );
});
</script>
