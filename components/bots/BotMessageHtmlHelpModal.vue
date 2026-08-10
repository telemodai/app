<template>
  <UiAppModal
    :open="open"
    size="md"
    title-id="bot-message-html-help-title"
    @close="emit('close')"
  >
    <div>
      <div class="flex items-start justify-between gap-4 mb-4">
        <h3 id="bot-message-html-help-title" class="tm-section-title text-fg">
          {{ t("botTemplate.htmlHelp.title") }}
        </h3>
        <UiAppButton
          variant="link"
          class="!min-w-0 !px-1 !py-0 text-xl leading-none"
          :aria-label="t('botTemplate.htmlHelp.closeAria')"
          @click="emit('close')"
        >
          ×
        </UiAppButton>
      </div>

      <div class="space-y-4 text-base text-fg-muted">
        <section v-for="sectionKey in htmlHelpSectionKeys" :key="sectionKey">
          <h4 class="font-medium text-fg mb-1">
            {{ t(`botTemplate.htmlHelp.sections.${sectionKey}.title`) }}
          </h4>
          <p>{{ t(`botTemplate.htmlHelp.sections.${sectionKey}.body`) }}</p>
          <p
            v-if="sectionKey === 'supportedTags'"
            class="mt-2 font-mono text-sm bg-surface-3 border border-line rounded-control px-2 py-1 whitespace-pre-wrap text-fg"
          >
            {{ t("botTemplate.htmlHelp.sections.supportedTags.example") }}
          </p>
        </section>

        <p>
          <a
            :href="TELEGRAM_HTML_DOCS_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent hover:underline"
          >
            {{ t("botTemplate.htmlHelp.docsLink") }}
          </a>
        </p>
      </div>

      <div class="mt-6 flex justify-end">
        <UiAppButton variant="ghost" @click="emit('close')">
          {{ t("botTemplate.htmlHelp.closeButton") }}
        </UiAppButton>
      </div>
    </div>
  </UiAppModal>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { TELEGRAM_HTML_DOCS_URL } from "@/lib/bot-message-template-ui";

const htmlHelpSectionKeys = [
  "format",
  "supportedTags",
  "placeholders",
  "userMention",
  "lineBreaks",
  "escaping",
  "length",
] as const;

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && props.open) {
    emit("close");
  }
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown);
});
</script>
