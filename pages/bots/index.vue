<template>
  <div>
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.bots.title')"
    >
      <template #actions>
        <UiAppButton variant="primary" @click="openAddModal('create')">
          {{ t("bot.addBot") }}
        </UiAppButton>
      </template>
    </LayoutPageHeader>

    <UiAppCard
      v-if="isSaas && referralLink"
      class="mb-6 !p-4 flex flex-wrap items-center justify-between gap-3"
    >
      <div class="min-w-0">
        <div class="text-sm font-medium text-fg">{{ t("referral.shareTitle") }}</div>
        <div class="text-sm text-fg-muted truncate">
          {{ referralLink }}
        </div>
      </div>
      <UiAppButton variant="ghost" @click="copyReferralLink">
        {{ copiedReferral ? t("referral.copied") : t("referral.copyLink") }}
      </UiAppButton>
    </UiAppCard>

    <div v-if="loading" class="text-fg-muted">{{ t("common.loading") }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="bot in bots"
        :key="bot.id"
        :to="`/bots/${bot.id}`"
        class="block rounded-card border border-line bg-surface-2 p-4 transition hover:border-line-strong hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div class="flex items-start gap-3 min-w-0">
          <img
            v-if="bot.photo_file_id"
            :src="botPhotoUrl(bot.id)"
            :alt="bot.name"
            class="h-12 w-12 rounded-full object-cover bg-surface-3 shrink-0"
          />
          <div
            v-else
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-medium text-fg-muted"
          >
            {{ botInitials(bot.name) }}
          </div>

          <div class="min-w-0 flex-1">
            <h3 class="truncate tm-section-title text-fg">
              {{ bot.name }}
            </h3>
            <p class="truncate text-xs text-fg-muted">
              @{{ bot.id }}
            </p>

            <div class="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <div class="flex flex-wrap items-center gap-1.5">
                <UiAppBadge :variant="roleBadgeVariant(bot.my_role)">
                  {{ roleLabel(bot.my_role) }}
                </UiAppBadge>
                <UiAppBadge :variant="bot.is_active ? 'success' : 'danger'">
                  {{ bot.is_active ? t("bot.active") : t("bot.inactive") }}
                </UiAppBadge>
              </div>
              <span class="shrink-0 text-xs text-fg-muted">
                {{ t("bot.chatsCount", { count: bot.chats?.length || 0 }) }}
              </span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <UiAppCard
      v-if="!loading && bots.length === 0"
      class="!p-8 text-center"
    >
      <p class="mb-4 text-fg-muted">
        {{ t("bot.emptyState") }}
      </p>
      <UiAppButton variant="primary" @click="openAddModal('create')">
        {{ t("bot.addBot") }}
      </UiAppButton>
    </UiAppCard>

    <UiAppModal :open="showAddModal" size="sm" title-id="add-bot-modal-title" @close="closeAddModal">
      <div>
        <h3
          id="add-bot-modal-title"
          class="tm-section-title text-fg mb-4"
        >
          {{ t("bot.modal.title") }}
        </h3>

        <div class="flex gap-2 mb-4 border-b border-line">
          <button
            type="button"
            class="tm-tab"
            :class="{ 'tm-tab--active': addModalTab === 'create' }"
            @click="addModalTab = 'create'"
          >
            {{ t("bot.modal.createTab") }}
          </button>
          <button
            type="button"
            class="tm-tab"
            :class="{ 'tm-tab--active': addModalTab === 'join' }"
            @click="addModalTab = 'join'"
          >
            {{ t("bot.modal.joinTab") }}
          </button>
        </div>

        <form
          v-if="addModalTab === 'create'"
          class="space-y-4"
          @submit.prevent="createBot"
        >
          <div>
            <label class="block text-sm font-medium text-fg mb-1">
              {{ t("bot.modal.tokenLabel") }}
            </label>
            <UiAppInput
              v-model="newBotToken"
              type="password"
              :placeholder="t('bot.modal.tokenPlaceholder')"
              required
            />
            <p class="text-sm text-fg-muted mt-1 normal-case tracking-normal">
              {{ t("bot.modal.tokenHint") }}
            </p>
          </div>

          <UiAppAlert v-if="createError" variant="danger">
            {{ createError }}
          </UiAppAlert>

          <div class="flex gap-2 pt-2">
            <UiAppButton
              type="submit"
              variant="primary"
              class="flex-1"
              :disabled="creating"
            >
              {{ creating ? t("common.creating") : t("bot.modal.createButton") }}
            </UiAppButton>
            <UiAppButton type="button" variant="ghost" @click="closeAddModal">
              {{ t("common.cancel") }}
            </UiAppButton>
          </div>
        </form>

        <form v-else class="space-y-4" @submit.prevent="joinTeam">
          <p class="text-sm text-fg-muted">
            {{ t("bot.modal.joinDescription") }}
          </p>
          <div>
            <label class="block text-sm font-medium text-fg mb-1">
              {{ t("bot.modal.accessCodeLabel") }}
            </label>
            <UiAppInput
              v-model="joinCode"
              :placeholder="t('bot.modal.accessCodePlaceholder')"
              required
            />
          </div>
          <UiAppAlert v-if="joinError" variant="danger">
            {{ joinError }}
          </UiAppAlert>
          <div class="flex gap-2 pt-2">
            <UiAppButton
              type="submit"
              variant="primary"
              class="flex-1"
              :disabled="joining"
            >
              {{ joining ? t("common.joining") : t("bot.modal.joinButton") }}
            </UiAppButton>
            <UiAppButton type="button" variant="ghost" @click="closeAddModal">
              {{ t("common.cancel") }}
            </UiAppButton>
          </div>
        </form>
      </div>
    </UiAppModal>
  </div>
</template>

<script setup lang="ts">
import { readFetchError } from "@/lib/fetch-error";
import { ref, computed, onMounted } from "vue";
import type { BotListItem, BotMemberRole } from "@/types/bot";

const { t } = useI18n();
const config = useRuntimeConfig();
const isSaas = computed(() => config.public.deploymentMode === "saas");

usePageTitle(() => t("page.bots.documentTitle"));

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("page.bots.title") },
]);

type AddModalTab = "create" | "join";

const route = useRoute();
const router = useRouter();

const bots = ref<BotListItem[]>([]);
const loading = ref(false);
const creating = ref(false);
const joining = ref(false);
const showAddModal = ref(false);
const addModalTab = ref<AddModalTab>("create");
const createError = ref("");
const joinError = ref("");
const joinCode = ref("");
const newBotToken = ref("");
const referralLink = ref("");
const copiedReferral = ref(false);

async function loadReferralLink() {
  if (!isSaas.value) {
    return;
  }
  try {
    const response = await $fetch<{ data: { link: string } }>("/api/referral/link");
    referralLink.value = response.data.link;
  } catch {
    referralLink.value = "";
  }
}

async function copyReferralLink() {
  if (!referralLink.value) {
    return;
  }
  try {
    await navigator.clipboard.writeText(referralLink.value);
    copiedReferral.value = true;
    setTimeout(() => {
      copiedReferral.value = false;
    }, 2000);
  } catch {
    copiedReferral.value = false;
  }
}

function roleLabel(role: BotMemberRole | undefined) {
  if (role === "owner") return t("common.roles.owner");
  return t("common.roles.manager");
}

function roleBadgeVariant(role: BotMemberRole | undefined) {
  if (role === "owner") {
    return "accent" as const;
  }
  return "muted" as const;
}

function botPhotoUrl(id: string) {
  return `/api/bots/${id}/photo`;
}

function botInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || "B").toUpperCase();
}

function openAddModal(tab: AddModalTab) {
  addModalTab.value = tab;
  createError.value = "";
  joinError.value = "";
  showAddModal.value = true;
}

function closeAddModal() {
  showAddModal.value = false;
  createError.value = "";
  joinError.value = "";
}

async function load() {
  loading.value = true;
  try {
    const resp = await $fetch<{ data?: { bots?: BotListItem[] } }>("/api/bots");
    bots.value = resp?.data?.bots || [];
  } catch (error) {
    console.error("Error loading bots:", error);
  } finally {
    loading.value = false;
  }
}

async function createBot() {
  creating.value = true;
  createError.value = "";
  try {
    await $fetch("/api/bots", {
      method: "POST",
      body: { token: newBotToken.value.trim() },
    });

    newBotToken.value = "";
    closeAddModal();
    await load();
  } catch (error) {
    createError.value = readFetchError(error, t("common.errors.createBot"));
    console.error("Error creating bot:", error);
  } finally {
    creating.value = false;
  }
}

async function joinTeam() {
  joining.value = true;
  joinError.value = "";
  try {
    const response = await $fetch<{ data: { bot_id: string } }>("/api/bots/join", {
      method: "POST",
      body: { code: joinCode.value.trim() },
    });
    joinCode.value = "";
    closeAddModal();
    await load();
    await navigateTo(`/bots/${response.data.bot_id}`);
  } catch (error) {
    joinError.value = readFetchError(error, t("common.errors.joinTeam"));
    console.error("Error joining team:", error);
  } finally {
    joining.value = false;
  }
}

function applyAddModalFromQuery() {
  const add = route.query.add;
  const code = route.query.code;

  if (typeof code === "string" && code.trim()) {
    joinCode.value = code.trim();
    openAddModal("join");
  } else if (add === "join") {
    openAddModal("join");
  } else if (add === "create") {
    openAddModal("create");
  }

  if (add || code) {
    router.replace({ path: "/bots" });
  }
}

onMounted(async () => {
  await load();
  await loadReferralLink();
  applyAddModalFromQuery();
});
</script>
