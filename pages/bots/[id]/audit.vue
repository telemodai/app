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

    <template v-else>
      <div v-if="decisions.length > 0" class="space-y-4">
        <AuditDecisionCard
          v-for="item in decisions"
          :key="item._id ?? `${item.timestamp}-${item.user_id}-${item.chat_id}`"
          :item="item"
          :formatted-time="formatDate(item.timestamp)"
        />

        <nav
          v-if="pagination.total_pages > 1"
          class="flex items-center justify-between border-t border-line pt-4 text-sm"
          :aria-label="t('audit.paginationNav')"
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
        </nav>
      </div>

      <div v-else class="tm-empty-state">
        {{ t("audit.empty") }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AuditDecisionItem } from "@/types/audit";

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
const decisions = ref<AuditDecisionItem[]>([]);
const pagination = ref({
  page: 1,
  limit: 100,
  total: 0,
  total_pages: 1,
});

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
