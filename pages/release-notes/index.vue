<template>
  <div class="max-w-3xl mx-auto">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.releaseNotes.title')"
      :subtitle="t('page.releaseNotes.subtitle')"
    />

    <div v-if="loading" class="text-fg-muted">{{ t("releaseNotes.loading") }}</div>

    <UiAppAlert v-else-if="error" variant="danger">
      {{ error }}
    </UiAppAlert>

    <div v-else-if="releases.length === 0" class="text-fg-muted text-center py-12">
      {{ t("releaseNotes.empty") }}
    </div>

    <div v-else class="space-y-10">
      <article
        v-for="release in releases"
        :key="release.tag"
        class="border-b border-line pb-10 last:border-b-0"
      >
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
          <h3 class="font-display text-heading-sm tracking-[-0.035em] text-fg">
            {{ release.tag }}
          </h3>
          <time class="text-body text-fg-muted">{{ formatDate(release.date) }}</time>
        </div>

        <p v-if="isSelfHosted" class="mb-5 text-body">
          <a
            :href="release.githubReleaseUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent hover:underline"
          >
            {{ t("releaseNotes.githubLink") }}
          </a>
        </p>

        <div
          v-for="section in release.sections"
          :key="`${release.tag}-${section.title}`"
          class="mb-5"
        >
          <h4 class="text-body font-semibold uppercase tracking-wide text-fg-muted mb-2">
            {{ section.title }}
          </h4>
          <ul class="space-y-2">
            <li
              v-for="(item, index) in section.items"
              :key="`${release.tag}-${section.title}-${index}`"
              class="text-fg text-body leading-relaxed pl-4 border-l-2 border-line"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </article>
    </div>

    <nav
      v-if="pagination.total_pages > 1"
      class="flex items-center justify-between border-t border-line pt-6 mt-8"
      :aria-label="t('page.releaseNotes.paginationNav')"
    >
      <UiAppButton
        type="button"
        variant="ghost"
        :disabled="pagination.page <= 1"
        @click="goToPage(pagination.page - 1)"
      >
        {{ t("releaseNotes.back") }}
      </UiAppButton>
      <span class="text-body text-fg-muted">
        {{ t("common.pageOf", { page: pagination.page, totalPages: pagination.total_pages }) }}
      </span>
      <UiAppButton
        type="button"
        variant="ghost"
        :disabled="pagination.page >= pagination.total_pages"
        @click="goToPage(pagination.page + 1)"
      >
        {{ t("releaseNotes.forward") }}
      </UiAppButton>
    </nav>
  </div>
</template>

<script setup lang="ts">
type ReleaseSection = {
  title: string;
  items: string[];
};

const { t, locale } = useI18n();
const runtimeConfig = useRuntimeConfig();
const isSelfHosted = computed(
  () => runtimeConfig.public.deploymentMode === "self-hosted"
);

usePageTitle(() => t("page.releaseNotes.documentTitle"));

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("page.releaseNotes.title") },
]);

type ReleaseNote = {
  tag: string;
  version: string;
  date: string;
  sections: ReleaseSection[];
  githubReleaseUrl: string;
};

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref("");
const releases = ref<ReleaseNote[]>([]);
const pagination = ref({
  page: 1,
  limit: 5,
  total: 0,
  total_pages: 1,
});

const page = computed(() => {
  const value = Number.parseInt(String(route.query.page ?? "1"), 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
});

function formatDate(dateString: string) {
  const loc = locale.value === "ru" ? "ru-RU" : "en-US";
  return new Date(dateString).toLocaleDateString(loc, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function loadReleases(targetPage = page.value) {
  loading.value = true;
  error.value = "";

  try {
    const resp = await $fetch<{
      success: boolean;
      data: {
        items: ReleaseNote[];
        pagination: typeof pagination.value;
      };
    }>("/api/releases", {
      query: { page: targetPage, limit: 5 },
    });

    releases.value = resp?.data?.items ?? [];
    pagination.value = resp?.data?.pagination ?? pagination.value;
  } catch (loadError: unknown) {
    console.error(loadError);
    error.value = t("common.errors.loadReleaseNotes");
    releases.value = [];
  } finally {
    loading.value = false;
  }
}

async function goToPage(targetPage: number) {
  await router.push({
    path: "/release-notes",
    query: targetPage > 1 ? { page: targetPage } : {},
  });
}

watch(page, (targetPage) => {
  void loadReleases(targetPage);
});

onMounted(() => {
  void loadReleases(page.value);
});
</script>
