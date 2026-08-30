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
            :aria-label="appName"
          >
            <BrandMark class="h-[1.1em]" />
            <span class="hidden lowercase sm:inline">{{ appName }}</span>
          </NuxtLink>
          <!-- Desktop nav -->
          <nav
            class="hidden items-center gap-1 text-sm md:flex"
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

        <div class="flex shrink-0 items-center gap-2 text-sm md:gap-4">
          <LayoutThemeToggle />
          <span v-if="session?.user" class="hidden text-fg-muted md:inline">
            <NuxtLink
              v-if="isSaas"
              to="/account/billing"
              class="hover:text-fg-strong transition-colors"
            >
              {{ displayName }}
            </NuxtLink>
            <template v-else>{{ displayName }}</template>
          </span>
          <button
            v-if="session?.user"
            type="button"
            class="tm-nav-link hidden cursor-pointer text-danger hover:bg-danger-surface hover:text-danger md:inline-flex"
            @click="signOut"
          >
            {{ t("nav.signOut") }}
          </button>

          <!-- Mobile: burger furthest right, theme stays to its left -->
          <button
            type="button"
            class="inline-flex size-10 cursor-pointer items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
            :aria-expanded="mobileMenuOpen"
            :aria-controls="mobileMenuId"
            :aria-label="
              mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')
            "
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <X
              v-if="mobileMenuOpen"
              :size="20"
              :stroke-width="1.5"
              absolute-stroke-width
              aria-hidden="true"
            />
            <Menu
              v-else
              :size="20"
              :stroke-width="1.5"
              absolute-stroke-width
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <!-- Mobile slide-down panel: nav + optional saas/user + divider + sign out -->
      <div
        v-if="mobileMenuOpen"
        :id="mobileMenuId"
        class="border-t border-line bg-surface-1 md:hidden"
      >
        <nav
          class="mx-auto flex max-w-page flex-col gap-1 px-4 py-3"
          :aria-label="t('nav.main')"
        >
          <NuxtLink
            to="/"
            class="tm-nav-link"
            active-class="tm-nav-link--active"
            @click="closeMobileMenu"
          >
            {{ t("nav.dashboard") }}
          </NuxtLink>
          <NuxtLink
            to="/bots"
            class="tm-nav-link"
            active-class="tm-nav-link--active"
            @click="closeMobileMenu"
          >
            {{ t("nav.bots") }}
          </NuxtLink>
          <NuxtLink
            v-if="isSelfHosted"
            to="/settings/llm"
            class="tm-nav-link"
            active-class="tm-nav-link--active"
            @click="closeMobileMenu"
          >
            {{ t("nav.settings") }}
          </NuxtLink>

          <NuxtLink
            v-if="isSaas"
            to="/account/billing"
            class="tm-nav-link"
            active-class="tm-nav-link--active"
            @click="closeMobileMenu"
          >
            {{ t("nav.account") }}
          </NuxtLink>

          <div class="my-1 border-t border-line" role="separator" />

          <button
            v-if="session?.user"
            type="button"
            class="tm-nav-link cursor-pointer text-left text-danger hover:bg-danger-surface hover:text-danger"
            @click="signOutFromMobile"
          >
            {{ t("nav.signOut") }}
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-page flex-1 px-4 pb-4 pt-10 md:px-6 md:pb-6 md:pt-14">
      <slot />
    </main>

    <LayoutAppFooter class="mt-auto" />
  </div>
</template>

<script setup lang="ts">
import { Menu, X } from "lucide-vue-next";
import { fetchSession } from "@/lib/fetch-session";

const { t, locale } = useI18n();
const appName = useAppName();
const config = useRuntimeConfig();
const route = useRoute();
const isSelfHosted = computed(
  () => config.public.deploymentMode === "self-hosted"
);
const isSaas = computed(() => config.public.deploymentMode === "saas");

const mobileMenuOpen = ref(false);
const mobileMenuId = "app-mobile-nav";

function closeMobileMenu() {
  mobileMenuOpen.value = false;
}

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

async function signOutFromMobile() {
  closeMobileMenu();
  await signOut();
}

// Close drawer when the route changes (nav link or back).
watch(
  () => route.fullPath,
  () => {
    closeMobileMenu();
  }
);
</script>
