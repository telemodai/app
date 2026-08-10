<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-1 p-4">
    <p class="text-base text-fg-muted">{{ t("referral.landing") }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { t } = useI18n();
const route = useRoute();
const code = route.params.code as string;

try {
  await $fetch("/api/referral/attribution", {
    method: "POST",
    body: { code },
  });
} catch {
  // Invalid codes still redirect — checkout simply won't attribute.
}

await navigateTo("/login");
</script>
