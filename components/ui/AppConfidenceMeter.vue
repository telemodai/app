<script setup lang="ts">
import { computed } from "vue";
import {
  confidenceFillColor,
  confidencePercent,
} from "@/lib/confidence-meter";

const props = withDefaults(
  defineProps<{
    /** Model confidence in 0..1 */
    value: number;
    /** Prefix before percent on the header row, e.g. "Confidence" */
    label?: string;
    /** Hide header row (bar only) */
    hideLabel?: boolean;
    /** Single-line percent + short bar for dense headers */
    compact?: boolean;
    class?: string;
  }>(),
  {
    label: undefined,
    hideLabel: false,
    compact: false,
  }
);

const { t } = useI18n();

const percent = computed(() => confidencePercent(props.value));

const fillStyle = computed(() => ({
  width: `${percent.value}%`,
  backgroundColor: confidenceFillColor(percent.value),
}));

const ariaLabel = computed(() =>
  t("audit.confidenceValue", { percent: percent.value })
);
</script>

<template>
  <div
    v-if="compact"
    role="meter"
    :aria-valuenow="percent"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="ariaLabel"
    class="inline-flex items-center gap-1.5"
    :class="props.class"
  >
    <span class="text-xs tabular-nums text-fg-muted">{{ percent }}%</span>
    <div
      class="h-1 w-14 shrink-0 overflow-hidden rounded-full border border-line bg-surface-3"
    >
      <div
        class="h-full rounded-full transition-[width] duration-300 ease-out"
        :style="fillStyle"
      />
    </div>
  </div>

  <div v-else class="flex w-full min-w-0 flex-col gap-1" :class="props.class">
    <div v-if="!hideLabel" class="tm-meta tabular-nums">
      <template v-if="label">{{ label }}{{ " " }}{{ percent }}%</template>
      <template v-else>{{ percent }}%</template>
    </div>

    <div
      role="meter"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="ariaLabel"
      class="h-1.5 w-full overflow-hidden rounded-full border border-line bg-surface-3"
    >
      <div
        class="h-full rounded-full transition-[width] duration-300 ease-out"
        :style="fillStyle"
      />
    </div>
  </div>
</template>
