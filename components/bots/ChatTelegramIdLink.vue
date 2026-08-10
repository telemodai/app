<script setup lang="ts">
import { computed } from "vue";
import { ExternalLink } from "lucide-vue-next";
import { telegramChatWebUrl } from "@/lib/telegram-chat-url";

const props = defineProps<{
  chatId: number;
  telegramUsername?: string | null;
  class?: string;
}>();

const { t } = useI18n();

const href = computed(() =>
  telegramChatWebUrl({
    chat_id: props.chatId,
    telegram_username: props.telegramUsername,
  })
);
</script>

<template>
  <a
    v-if="href"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-1 rounded-full border border-line bg-surface-3 px-2 py-0.5 text-2xs font-medium normal-case tracking-normal text-fg-muted transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-fg"
    :class="props.class"
    :aria-label="t('bot.chats.openInTelegram', { id: chatId })"
  >
    <span class="uppercase tracking-wide text-fg-subtle">ID</span>
    <span class="truncate tabular-nums text-fg">{{ chatId }}</span>
    <ExternalLink
      :size="11"
      :stroke-width="2"
      class="shrink-0 text-fg-subtle"
      aria-hidden="true"
    />
  </a>
  <span v-else class="text-xs text-fg-muted" :class="props.class">
    {{ t("bot.chats.id", { id: chatId }) }}
  </span>
</template>
