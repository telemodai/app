<template>
  <div class="max-w-xl">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.settingsLlm.title')"
      :subtitle="t('page.settingsLlm.subtitle')"
    />

    <p class="text-base text-fg-muted mb-4">{{ t("billing.envOverrideHint") }}</p>

    <div v-if="loading" class="text-fg-muted">{{ t("common.loading") }}</div>

    <UiAppCard v-else>
      <form class="space-y-4" @submit.prevent="save">
        <div>
          <label class="block text-base font-medium text-fg mb-1">
            {{ t("billing.settings.apiKey") }}
          </label>
          <UiAppInput
            v-model="apiKey"
            type="password"
            :placeholder="settings?.has_api_key ? t('billing.settings.apiKeyPlaceholder') : ''"
            autocomplete="off"
          />
          <p v-if="settings?.has_api_key && !apiKey" class="text-xs text-fg-muted mt-1">
            {{ t("billing.settings.apiKeyConfigured") }}
          </p>
        </div>

        <div>
          <label class="block text-base font-medium text-fg mb-1">
            {{ t("billing.settings.baseUrl") }}
          </label>
          <UiAppInput
            v-model="baseUrl"
            type="url"
            :placeholder="t('billing.settings.baseUrlPlaceholder')"
          />
        </div>

        <div>
          <label class="block text-base font-medium text-fg mb-1">
            {{ t("billing.settings.model") }}
          </label>
          <UiAppInput
            v-model="model"
            type="text"
            :placeholder="t('billing.settings.modelPlaceholder')"
          />
        </div>

        <UiAppAlert v-if="error" variant="danger">
          {{ error }}
        </UiAppAlert>
        <UiAppAlert v-if="success">
          {{ t("billing.settings.saved") }}
        </UiAppAlert>

        <UiAppButton
          type="submit"
          variant="primary"
          :disabled="saving"
        >
          {{ saving ? t("common.saving") : t("common.save") }}
        </UiAppButton>
      </form>
    </UiAppCard>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const config = useRuntimeConfig();

if (config.public.deploymentMode !== "self-hosted") {
  await navigateTo("/");
}

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("page.settingsLlm.breadcrumb") },
]);

usePageTitle(() => t("page.settingsLlm.documentTitle"));

type SettingsResponse = {
  has_api_key: boolean;
  base_url?: string | null;
  model?: string | null;
};

const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref(false);
const settings = ref<SettingsResponse | null>(null);
const apiKey = ref("");
const baseUrl = ref("");
const model = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const response = await $fetch<{ data: SettingsResponse }>("/api/settings/llm");
    settings.value = response.data;
    baseUrl.value = response.data.base_url ?? "";
    model.value = response.data.model ?? "";
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t("common.unknown");
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  error.value = "";
  success.value = false;
  try {
    const response = await $fetch<{ data: SettingsResponse }>("/api/settings/llm", {
      method: "PUT",
      body: {
        api_key: apiKey.value || undefined,
        base_url: baseUrl.value || null,
        model: model.value || null,
      },
    });
    settings.value = response.data;
    apiKey.value = "";
    success.value = true;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t("common.unknown");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
