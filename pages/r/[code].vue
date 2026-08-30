<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-1 p-4">
    <p class="text-sm text-fg-muted">{{ t("referral.landing") }}</p>
  </div>
</template>

<script setup lang="ts">
import { fetchSession } from "@/lib/fetch-session";
import { DEFAULT_POST_LOGIN_PATH } from "@/lib/auth-return-to";

definePageMeta({
  layout: false,
});

const { t } = useI18n();
const route = useRoute();

// Client-only: SSR $fetch would set cookies on an internal sub-request, not in the browser.
onMounted(async () => {
  const code = String(route.params.code ?? "").trim();
  if (code) {
    try {
      await $fetch("/api/referral/attribution", {
        method: "POST",
        body: { code },
      });
    } catch {
      // Invalid codes still redirect — checkout simply won't attribute.
    }
  }

  const session = await fetchSession();
  if (session?.user) {
    await navigateTo(DEFAULT_POST_LOGIN_PATH);
    return;
  }

  await navigateTo({
    path: "/login",
    query: { returnTo: DEFAULT_POST_LOGIN_PATH },
  });
});
</script>
