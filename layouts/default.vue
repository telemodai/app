<template>
  <div class="min-h-screen flex flex-col bg-surface-1">
    <header class="border-b border-line bg-surface-1">
      <div
        class="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-4 px-4"
      >
        <div class="flex min-w-0 items-center gap-8">
          <NuxtLink
            to="/"
            class="inline-flex shrink-0 items-center gap-2 tm-section-title text-fg hover:text-fg-strong"
          >
            <BrandMark class="h-[1.1em]" />
            <span class="lowercase">{{ appName }}</span>
          </NuxtLink>
          <nav
            class="flex items-center gap-1 overflow-x-auto text-sm"
            :aria-label="t('nav.main')"
          >
            <NuxtLink
              to="/"
              class="tm-nav-link"
              active-class="tm-nav-link--active"
            >
              {{ t("nav.dashboard") }}
            </NuxtLink>
            <NuxtLink
              to="/bots"
              class="tm-nav-link"
              active-class="tm-nav-link--active"
            >
              {{ t("nav.bots") }}
            </NuxtLink>
            <NuxtLink
              v-if="isSelfHosted"
              to="/settings/llm"
              class="tm-nav-link"
              active-class="tm-nav-link--active"
            >
              {{ t("nav.settings") }}
            </NuxtLink>
          </nav>
        </div>
        <div class="flex shrink-0 items-center gap-4 text-sm">
          <LayoutReferralPendingNav v-if="isSaas" />
          <LayoutThemeToggle />
          <span v-if="session?.user" class="hidden text-fg-muted sm:inline">
            {{ displayName }}
          </span>
          <button
            v-if="session?.user"
            type="button"
            class="tm-nav-link cursor-pointer text-danger hover:bg-danger-surface hover:text-danger"
            @click="signOut"
          >
            {{ t("nav.signOut") }}
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-page flex-1 p-4 md:p-6">
      <slot />
    </main>

    <LayoutAppFooter class="mt-auto" />
  </div>
</template>

<script setup lang="ts">
import { fetchSession } from "@/lib/fetch-session";

const { t, locale } = useI18n();
const appName = useAppName();
const config = useRuntimeConfig();
const isSelfHosted = computed(
  () => config.public.deploymentMode === "self-hosted"
);
const isSaas = computed(() => config.public.deploymentMode === "saas");

useHead({
  titleTemplate: (titleChunk) => {
    const name = appName.value;
    return titleChunk ? `${titleChunk} · ${name}` : name;
  },
  htmlAttrs: {
    lang: () => locale.value,
  },
});

const { data: session, refresh: refreshSession } = await useAsyncData(
  "layout-auth-session",
  () => fetchSession()
);

const displayName = computed(() => {
  const user = session.value?.user;
  if (!user) return "";
  if (user.username) return `@${user.username}`;
  return user.name;
});

async function signOut() {
  await $fetch("/api/auth/sign-out", { method: "POST", body: {} });
  await refreshSession();
  await navigateTo("/login");
}
</script>
