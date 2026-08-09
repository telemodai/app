<template>
  <div v-if="isSaas && pending.count > 0" class="relative">
    <button
      type="button"
      class="px-3 py-2 rounded-control text-body bg-action-warning-surface text-action-warning hover:opacity-90 whitespace-nowrap"
      @click="open = true"
    >
      {{ t("referral.navPending", { credits: pending.credits.toLocaleString() }) }}
    </button>

    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="open = false"
    >
      <div
        class="w-full max-w-md rounded-card border border-line bg-surface-2 p-5 shadow-overlay"
      >
        <h2 class="font-display text-heading-sm text-fg mb-2">{{ t("referral.claimTitle") }}</h2>
        <p class="text-body text-fg-muted mb-4">
          {{
            t("referral.claimSubtitle", {
              credits: pending.credits.toLocaleString(),
              count: pending.count,
            })
          }}
        </p>

        <div v-if="ownedBots.length === 0" class="text-body text-action-warning mb-4">
          {{ t("referral.noOwnedBots") }}
        </div>

        <div v-else class="space-y-2 mb-4 max-h-60 overflow-y-auto">
          <button
            v-for="bot in ownedBots"
            :key="bot.id"
            type="button"
            class="w-full text-left border border-line rounded-control px-3 py-2 hover:border-accent disabled:opacity-50"
            :disabled="claiming"
            @click="claimToBot(bot.id)"
          >
            <div class="font-medium text-fg">{{ bot.name }}</div>
            <div class="text-[12px] text-fg-muted">@{{ bot.id }}</div>
          </button>
        </div>

        <p v-if="error" class="text-body text-danger mb-3">{{ error }}</p>
        <p v-if="success" class="text-body text-action-unban mb-3">{{ success }}</p>

        <button
          type="button"
          class="text-body text-fg-muted hover:text-fg hover:underline"
          @click="open = false"
        >
          {{ t("common.close") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type BotListItem = {
  id: string;
  name: string;
  my_role?: string | null;
};

const { t } = useI18n();
const config = useRuntimeConfig();
const isSaas = computed(() => config.public.deploymentMode === "saas");

const open = ref(false);
const claiming = ref(false);
const error = ref("");
const success = ref("");
const pending = ref({ credits: 0, count: 0 });
const ownedBots = ref<BotListItem[]>([]);

async function refreshPending() {
  if (!isSaas.value) {
    return;
  }
  try {
    const response = await $fetch<{
      data: { credits: number; count: number };
    }>("/api/referral/pending");
    pending.value = response.data;
  } catch {
    pending.value = { credits: 0, count: 0 };
  }
}

async function loadOwnedBots() {
  try {
    const response = await $fetch<{ data: BotListItem[] }>("/api/bots");
    ownedBots.value = response.data.filter((bot) => bot.my_role === "owner");
  } catch {
    ownedBots.value = [];
  }
}

async function claimToBot(botId: string) {
  claiming.value = true;
  error.value = "";
  success.value = "";
  try {
    const response = await $fetch<{
      data: { credits: number };
    }>("/api/referral/claim", {
      method: "POST",
      body: { bot_id: botId },
    });
    success.value = t("referral.claimSuccess", {
      credits: response.data.credits.toLocaleString(),
    });
    await refreshPending();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t("common.unknown");
  } finally {
    claiming.value = false;
  }
}

watch(open, async (isOpen) => {
  if (isOpen) {
    await loadOwnedBots();
  }
});

onMounted(async () => {
  await refreshPending();
});
</script>
