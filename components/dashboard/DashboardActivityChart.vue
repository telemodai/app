<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="lg:col-span-2">
      <UiAppCard :padding="false">
        <div class="p-6">
          <h3 class="tm-section-title text-fg mb-4">
            {{ t("dashboard.chart.activityTitle") }}
          </h3>
          <div v-if="hasTrendData" class="h-64">
            <Line :key="themeVersion" :data="trendChartData" :options="trendChartOptions" />
          </div>
          <div
            v-else
            class="h-64 flex items-center justify-center text-fg-muted text-base"
          >
            {{ t("dashboard.chart.noActivity") }}
          </div>
        </div>
      </UiAppCard>
    </div>

    <UiAppCard :padding="false">
      <div class="p-6">
        <h3 class="tm-section-title text-fg mb-4">
          {{ t("dashboard.chart.actionsTitle") }}
        </h3>
        <div v-if="hasBreakdownData" class="h-64">
          <Doughnut
            :key="themeVersion"
            :data="breakdownChartData"
            :options="breakdownChartOptions"
          />
        </div>
        <div
          v-else
          class="h-64 flex items-center justify-center text-fg-muted text-base"
        >
          {{ t("dashboard.chart.noActions") }}
        </div>
      </div>
    </UiAppCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from "chart.js";
import { Line, Doughnut } from "vue-chartjs";
import { chartColor, chartColorAlpha, chartGridColor, chartMutedColor } from "@/lib/chart-theme";
import type {
  DashboardActionBreakdown,
  DashboardTrendDay,
} from "@/types/dashboard";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement
);

const { t } = useI18n();

const props = defineProps<{
  trend7d: DashboardTrendDay[];
  actionBreakdown: DashboardActionBreakdown;
}>();

const themeVersion = ref(0);

function onThemeChange() {
  themeVersion.value++;
}

onMounted(() => {
  window.addEventListener("tm-theme-change", onThemeChange);
});

onUnmounted(() => {
  window.removeEventListener("tm-theme-change", onThemeChange);
});

function formatDayLabel(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${day}.${month}`;
}

const hasTrendData = computed(() =>
  props.trend7d.some((day) => day.messages > 0 || day.violations > 0)
);

const hasBreakdownData = computed(() => {
  const b = props.actionBreakdown;
  return b.warning + b.delete + b.ban > 0;
});

const trendChartData = computed(() => {
  void themeVersion.value;

  return {
    labels: props.trend7d.map((day) => formatDayLabel(day.date)),
    datasets: [
      {
        label: t("dashboard.chart.messages"),
        data: props.trend7d.map((day) => day.messages),
        borderColor: chartColor("accent"),
        backgroundColor: chartColorAlpha("accent", 0.1),
        tension: 0.3,
      },
      {
        label: t("dashboard.chart.violations"),
        data: props.trend7d.map((day) => day.violations),
        borderColor: chartColor("danger"),
        backgroundColor: chartColorAlpha("danger", 0.1),
        tension: 0.3,
      },
    ],
  };
});

const trendChartOptions = computed(() => {
  void themeVersion.value;

  const muted = chartMutedColor();
  const grid = chartGridColor(0.65);

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: muted },
      },
    },
    scales: {
      x: {
        ticks: { color: muted },
        grid: { color: grid },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: muted },
        grid: { color: grid },
      },
    },
  };
});

const breakdownChartData = computed(() => {
  void themeVersion.value;

  return {
    labels: [
      t("dashboard.chart.warnings"),
      t("dashboard.chart.deletes"),
      t("dashboard.chart.bans"),
    ],
    datasets: [
      {
        data: [
          props.actionBreakdown.warning,
          props.actionBreakdown.delete,
          props.actionBreakdown.ban,
        ],
        backgroundColor: [
          chartColor("action-warning"),
          chartColor("action-delete"),
          chartColor("action-ban"),
        ],
      },
    ],
  };
});

const breakdownChartOptions = computed(() => {
  void themeVersion.value;

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: chartMutedColor() },
      },
    },
  };
});
</script>
