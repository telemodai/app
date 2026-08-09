<template>
  <div class="inline-flex items-center gap-2 text-body">
    <button
      type="button"
      class="uppercase hover:text-fg hover:underline"
      :class="
        locale === 'en'
          ? 'font-medium text-fg underline'
          : 'text-fg-muted'
      "
      @click="switchLocale('en')"
    >
      {{ $t("footer.localeEn") }}
    </button>
    <button
      type="button"
      class="uppercase hover:text-fg hover:underline"
      :class="
        locale === 'ru'
          ? 'font-medium text-fg underline'
          : 'text-fg-muted'
      "
      @click="switchLocale('ru')"
    >
      {{ $t("footer.localeRu") }}
    </button>
  </div>
</template>

<script setup lang="ts">
const { locale, switchLocale } = useAppLocale();
</script>
