<template>
  <div>
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.audit.title')"
      :subtitle="bot ? t('page.audit.subtitle', { botId: bot.id }) : undefined"
    >
      <template #actions>
        <UiAppButton variant="ghost" @click="loadDecisions">
          {{ t("common.refresh") }}
        </UiAppButton>
      </template>
    </LayoutPageHeader>

    <div v-if="loading" class="text-fg-muted">{{ t("audit.loading") }}</div>

    <UiAppCard v-else :padding="false" class="overflow-hidden">
      <div v-if="decisions.length > 0" class="hidden md:block overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-surface-3 text-left text-fg-muted">
            <tr>
              <th class="px-4 py-3 font-medium">{{ t("audit.time") }}</th>
              <th class="px-4 py-3 font-medium">{{ t("audit.chat") }}</th>
              <th class="px-4 py-3 font-medium">{{ t("audit.user") }}</th>
              <th class="px-4 py-3 font-medium">{{ t("audit.message") }}</th>
              <th class="px-4 py-3 font-medium">{{ t("audit.result") }}</th>
              <th class="px-4 py-3 font-medium">{{ t("audit.rule") }}</th>
              <th class="px-4 py-3 font-medium">{{ t("audit.confidence") }}</th>
              <th class="px-4 py-3 font-medium">{{ t("audit.reasoning") }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-for="item in decisions" :key="item._id" class="align-top">
              <td class="px-4 py-3 whitespace-nowrap text-fg-muted">
                {{ formatDate(item.timestamp) }}
              </td>
              <td class="px-4 py-3">
                <div class="text-fg">{{ chatName(item.chat_id) }}</div>
                <div class="text-sm text-fg-muted">
                  {{ item.chat_id }}
                </div>
              </td>
              <td class="px-4 py-3 text-fg">
                {{ item.user_id }}
              </td>
              <td class="px-4 py-3 max-w-xs">
                <UiAppButton
                  v-if="isLong(item.message_text)"
                  variant="link"
                  class="!px-0 !py-0 !text-left !font-normal"
                  @click="toggleExpanded(`msg-${item._id}`)"
                >
                  {{ displayText(item.message_text, `msg-${item._id}`) }}
                </UiAppButton>
                <span v-else class="text-fg">{{ item.message_text }}</span>
              </td>
              <td class="px-4 py-3">
                <UiAppBadge :variant="item.violation_detected ? 'danger' : 'success'">
                  {{ item.violation_detected ? t("audit.violation") : t("audit.pass") }}
                </UiAppBadge>
              </td>
              <td class="px-4 py-3 text-fg">
                {{ formatRuleLabel(item) }}
              </td>
              <td class="px-4 py-3 text-fg">
                {{ Math.round(item.ai_confidence * 100) }}%
              </td>
              <td class="px-4 py-3 max-w-sm">
                <UiAppButton
                  v-if="isLong(item.ai_reasoning)"
                  variant="link"
                  class="!px-0 !py-0 !text-left !font-normal"
                  @click="toggleExpanded(`reason-${item._id}`)"
                >
                  {{ displayText(item.ai_reasoning, `reason-${item._id}`) }}
                </UiAppButton>
                <span v-else class="text-fg">{{ item.ai_reasoning }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="decisions.length > 0" class="md:hidden divide-y divide-line">
        <div v-for="item in decisions" :key="`card-${item._id}`" class="p-4 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <UiAppBadge :variant="item.violation_detected ? 'danger' : 'success'">
              {{ item.violation_detected ? t("audit.violation") : t("audit.pass") }}
            </UiAppBadge>
            <span class="text-sm text-fg-muted">
              {{ formatDate(item.timestamp) }}
            </span>
          </div>
          <div class="text-sm text-fg-muted">
            {{
              t("audit.mobileMeta", {
                chatName: chatName(item.chat_id),
                userId: item.user_id,
              })
            }}
          </div>
          <div class="text-sm text-fg">
            {{ displayText(item.message_text, `msg-${item._id}`) }}
          </div>
          <div v-if="item.rule_violated || item.rule_name" class="text-sm text-fg">
            {{ t("audit.mobileRule") }}
            <span class="font-medium">{{ formatRuleLabel(item) }}</span>
            · {{ Math.round(item.ai_confidence * 100) }}%
          </div>
          <div class="text-sm text-fg-muted">
            {{ displayText(item.ai_reasoning, `reason-${item._id}`) }}
          </div>
        </div>
      </div>

      <div v-else class="text-fg-muted text-center py-10 px-4">
        {{ t("audit.empty") }}
      </div>

      <div
        v-if="pagination.total_pages > 1"
        class="flex items-center justify-between border-t border-line px-4 py-3 text-sm"
      >
        <UiAppButton
          variant="ghost"
          class="!px-3 !py-1"
          :disabled="pagination.page <= 1"
          @click="goToPage(pagination.page - 1)"
        >
          {{ t("common.previous") }}
        </UiAppButton>
        <span class="text-fg-muted">
          {{ t("common.pageOf", { page: pagination.page, totalPages: pagination.total_pages }) }}
        </span>
        <UiAppButton
          variant="ghost"
          class="!px-3 !py-1"
          :disabled="pagination.page >= pagination.total_pages"
          @click="goToPage(pagination.page + 1)"
        >
          {{ t("common.next") }}
        </UiAppButton>
      </div>
    </UiAppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

type DecisionItem = {
  _id?: string;
  chat_id: number;
  user_id: number;
  message_text: string;
  violation_detected: boolean;
  rule_violated?: string;
  rule_name?: string | null;
  ai_confidence: number;
  ai_reasoning: string;
  timestamp: string;
};

const { t, locale } = useI18n();

const route = useRoute();
const botId = route.params.id as string;

usePageTitle(() => t("page.audit.documentTitle"));

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("nav.bots"), to: "/bots" },
  { label: bot.value ? `@${bot.value.id}` : `@${botId}`, to: `/bots/${botId}` },
  { label: t("audit.breadcrumb") },
]);

const bot = ref<any>(null);
const loading = ref(false);
const decisions = ref<DecisionItem[]>([]);
const pagination = ref({
  page: 1,
  limit: 100,
  total: 0,
  total_pages: 1,
});
const expanded = ref<Record<string, boolean>>({});

const TRUNCATE_LEN = 120;

function formatDate(dateString: string) {
  const loc = locale.value === "ru" ? "ru-RU" : "en-US";
  return new Date(dateString).toLocaleDateString(loc, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isLong(text: string) {
  return text.length > TRUNCATE_LEN;
}

function displayText(text: string, key: string) {
  if (!isLong(text) || expanded.value[key]) {
    return text;
  }
  return `${text.slice(0, TRUNCATE_LEN)}…`;
}

function toggleExpanded(key: string) {
  expanded.value[key] = !expanded.value[key];
}

function chatName(chatId: number) {
  const chat = bot.value?.chats?.find((c: any) => c.chat_id === chatId);
  return chat?.name || t("audit.chatFallback", { chatId });
}

function formatRuleLabel(item: DecisionItem) {
  if (item.rule_name) {
    return item.rule_name;
  }
  if (item.rule_violated) {
    return t("audit.unknownRule");
  }
  return t("common.dash");
}

async function loadBot() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`);
    bot.value = resp?.data;
  } catch (error: any) {
    const status = error?.statusCode ?? error?.response?.status;
    if (status !== 404) {
      console.error("Error loading bot:", error);
    }
  }
}

async function loadDecisions(page = pagination.value.page) {
  loading.value = true;
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/decisions`, {
      query: { page, limit: 100 },
    });
    decisions.value = resp?.data?.items || [];
    pagination.value = resp?.data?.pagination || pagination.value;
  } catch (error) {
    console.error("Error loading decisions:", error);
    decisions.value = [];
  } finally {
    loading.value = false;
  }
}

async function goToPage(page: number) {
  pagination.value.page = page;
  await loadDecisions(page);
}

onMounted(async () => {
  await loadBot();
  await loadDecisions();
});
</script>
