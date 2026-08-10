<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    <UiAppCard :padding="false">
      <div class="p-4">
        <div class="text-base text-fg-muted mb-1">{{ t("dashboard.kpi.bots") }}</div>
        <div class="tm-stat text-fg">{{ kpi.bots_total }}</div>
        <div class="text-sm text-fg-muted mt-1">
          <span class="text-action-unban">{{
            t("dashboard.kpi.active", { count: kpi.bots_active })
          }}</span>
          ·
          <span class="text-danger">{{
            t("dashboard.kpi.inactive", { count: kpi.bots_inactive })
          }}</span>
        </div>
      </div>
    </UiAppCard>

    <UiAppCard :padding="false">
      <div class="p-4">
        <div class="text-base text-fg-muted mb-1">{{ t("dashboard.kpi.chats") }}</div>
        <div class="tm-stat text-fg">{{ kpi.chats_total }}</div>
        <div class="text-sm text-fg-muted mt-1">{{ t("dashboard.kpi.acrossAllBots") }}</div>
      </div>
    </UiAppCard>

    <UiAppCard :padding="false">
      <div class="p-4">
        <div class="text-base text-fg-muted mb-1">{{ t("dashboard.kpi.today") }}</div>
        <div class="grid grid-cols-2 gap-2 mt-2 text-base">
          <div>
            <div class="tm-stat-sm text-accent">
              {{ kpi.today_messages }}
            </div>
            <div class="text-sm text-fg-muted">{{ t("dashboard.kpi.messages") }}</div>
          </div>
          <div>
            <div class="tm-stat-sm text-action-warning">
              {{ kpi.today_warnings }}
            </div>
            <div class="text-sm text-fg-muted">{{ t("dashboard.kpi.warnings") }}</div>
          </div>
          <div>
            <div class="tm-stat-sm text-action-delete">
              {{ kpi.today_deletes }}
            </div>
            <div class="text-sm text-fg-muted">{{ t("dashboard.kpi.deletes") }}</div>
          </div>
          <div>
            <div class="tm-stat-sm text-action-ban">
              {{ kpi.today_bans }}
            </div>
            <div class="text-sm text-fg-muted">{{ t("dashboard.kpi.bans") }}</div>
          </div>
        </div>
      </div>
    </UiAppCard>

    <UiAppCard :padding="false">
      <div class="p-4">
        <div class="text-base text-fg-muted mb-1">{{ t("dashboard.kpi.users") }}</div>
        <div class="tm-stat text-action-unban">
          {{ kpi.users_active_24h }}
        </div>
        <div class="text-sm text-fg-muted mt-1">{{ t("dashboard.kpi.active24h") }}</div>
        <div class="tm-stat-sm text-action-ban mt-2">
          {{ kpi.users_banned }}
        </div>
        <div class="text-sm text-fg-muted">{{ t("dashboard.kpi.bannedDistinct") }}</div>
      </div>
    </UiAppCard>
  </div>
</template>

<script setup lang="ts">
import type { DashboardKpi } from "@/types/dashboard";

const { t } = useI18n();

defineProps<{
  kpi: DashboardKpi;
}>();
</script>
