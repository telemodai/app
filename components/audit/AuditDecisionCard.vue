<script setup lang="ts">
import { ChevronDown, ChevronUp, Clock, Gauge, MessageSquare, User } from "lucide-vue-next";
import type { AuditDecisionItem } from "@/types/audit";
import {
  formatChatDisplay,
  formatTelegramUserDisplay,
} from "@/lib/telegram-display";

const props = defineProps<{
  item: AuditDecisionItem;
  formattedTime: string;
}>();

const { t } = useI18n();

const reasoningOpen = ref(false);

const hasReasoning = computed(() => props.item.ai_reasoning.trim().length > 0);

const chatDisplay = computed(() =>
  formatChatDisplay({
    name: props.item.chat_name,
    chat_id: props.item.chat_id,
  })
);

const userDisplay = computed(() =>
  formatTelegramUserDisplay({
    username: props.item.user_username,
    first_name: props.item.user_first_name,
    user_id: props.item.user_id,
  })
);

const iconClass = "shrink-0 text-fg-subtle";
const iconSize = 13;

const cardClass = computed(() =>
  props.item.violation_detected
    ? "border-danger/25 bg-danger-surface/25"
    : "border-line bg-surface-2"
);
</script>

<template>
  <article class="rounded-card border p-4 space-y-3" :class="cardClass">
    <header class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          class="inline-flex shrink-0 items-center gap-1 text-xs text-fg-muted"
          :aria-label="t('audit.time')"
        >
          <Clock :size="iconSize" :stroke-width="2" :class="iconClass" aria-hidden="true" />
          <time :datetime="props.item.timestamp">{{ formattedTime }}</time>
        </span>

        <span
          class="inline-flex min-w-0 items-center gap-1 text-xs text-fg tabular-nums"
          :aria-label="t('audit.chat')"
        >
          <MessageSquare
            :size="iconSize"
            :stroke-width="2"
            :class="iconClass"
            aria-hidden="true"
          />
          <span class="truncate">{{ chatDisplay }}</span>
        </span>

        <span
          class="inline-flex shrink-0 items-center gap-1 text-xs text-fg tabular-nums"
          :aria-label="t('audit.user')"
        >
          <User :size="iconSize" :stroke-width="2" :class="iconClass" aria-hidden="true" />
          {{ userDisplay }}
        </span>
      </div>

      <div
        class="inline-flex min-w-0 shrink-0 items-center gap-1"
        :aria-label="t('audit.confidence')"
      >
        <Gauge :size="iconSize" :stroke-width="2" :class="iconClass" aria-hidden="true" />
        <UiAppConfidenceMeter compact :value="props.item.ai_confidence" />
      </div>
    </header>

    <div
      class="rounded-control border border-line bg-surface-3 p-3 text-sm text-fg whitespace-pre-wrap break-words"
    >
      {{ props.item.message_text }}
    </div>

    <div
      v-if="hasReasoning && reasoningOpen"
      class="rounded-control border border-line bg-surface-3 p-3 text-sm text-fg-muted whitespace-pre-wrap break-words"
    >
      {{ props.item.ai_reasoning }}
    </div>

    <div class="flex items-center justify-between gap-3 border-t border-line pt-2">
      <UiAppBadge :variant="props.item.violation_detected ? 'danger' : 'success'">
        {{ props.item.violation_detected ? t("audit.violation") : t("audit.pass") }}
      </UiAppBadge>

      <UiAppButton
        v-if="hasReasoning"
        variant="link"
        class="!px-0 !py-0 gap-1.5 text-xs text-fg-muted hover:text-fg"
        @click="reasoningOpen = !reasoningOpen"
      >
        <component
          :is="reasoningOpen ? ChevronUp : ChevronDown"
          :size="14"
          :stroke-width="2"
          class="shrink-0"
          aria-hidden="true"
        />
        {{
          reasoningOpen ? t("audit.hideReasoning") : t("audit.showReasoning")
        }}
      </UiAppButton>
    </div>
  </article>
</template>
