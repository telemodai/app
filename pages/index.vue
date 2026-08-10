<template>
  <div>
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.dashboard.title')"
    >
      <template #actions>
        <UiAppButton
          variant="primary"
          type="button"
          :disabled="loading"
          @click="load"
        >
          {{ loading ? t("common.loading") : t("common.refresh") }}
        </UiAppButton>
      </template>
    </LayoutPageHeader>

    <div v-if="loading" class="text-fg-muted">{{ t("page.dashboard.loading") }}</div>

    <UiAppAlert v-else-if="error" variant="danger">
      {{ error }}
    </UiAppAlert>

    <UiAppCard
      v-else-if="dashboard && !dashboard.has_bots"
      class="!p-8 text-center"
    >
      <p class="text-fg-muted mb-4">
        {{ t("page.dashboard.emptyState") }}
      </p>
      <UiAppButton variant="primary" to="/bots">
        {{ t("page.dashboard.manageBots") }}
      </UiAppButton>
    </UiAppCard>

    <div v-else-if="dashboard" class="space-y-6">
      <DashboardKpiCards :kpi="dashboard.kpi" />

      <ClientOnly>
        <DashboardActivityChart
          :trend7d="dashboard.trend_7d"
          :action-breakdown="dashboard.action_breakdown"
        />
        <template #fallback>
          <UiAppCard class="text-fg-muted text-base">
            {{ t("common.loadingCharts") }}
          </UiAppCard>
        </template>
      </ClientOnly>

      <DashboardRecentActivity :activities="dashboard.recent_activity" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { DashboardData } from "@/types/dashboard";

const { t } = useI18n();

usePageTitle(() => t("page.dashboard.documentTitle"));

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("page.dashboard.title") },
]);

const dashboard = ref<DashboardData | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;

  try {
    const resp = await $fetch<{ success: boolean; data: DashboardData }>(
      "/api/dashboard"
    );
    dashboard.value = resp?.data ?? null;
  } catch (err) {
    console.error("Error loading dashboard:", err);
    error.value = t("common.errors.loadDashboard");
    dashboard.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
