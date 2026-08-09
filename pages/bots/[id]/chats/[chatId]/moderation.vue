<template>
  <div class="space-y-6">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.moderation.title')"
      :subtitle="chatName || t('page.moderation.chatSubtitle', { chatId: telegramChatId })"
    >
      <template #actions>
        <UiAppButton variant="ghost" @click="openTemplateLibrary">
          {{ t("moderation.addFromTemplate") }}
        </UiAppButton>
        <UiAppButton variant="primary" @click="openCreateModal">
          {{ t("moderation.addRule") }}
        </UiAppButton>
      </template>
    </LayoutPageHeader>

    <UiAppAlert v-if="templateError" variant="danger">
      {{ templateError }}
    </UiAppAlert>

    <UiAppAlert v-if="ruleActionError" variant="danger">
      {{ ruleActionError }}
    </UiAppAlert>

    <UiAppAlert v-if="userActionError" variant="danger">
      {{ userActionError }}
    </UiAppAlert>

    <div v-if="loading" class="text-fg-muted">{{ t("moderation.loadingRules") }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UiAppCard
        v-for="rule in rules"
        :key="rule.id"
        class="!p-4"
      >
        <div class="flex items-start justify-between mb-2 gap-2">
          <div>
            <h3 class="font-medium text-fg">{{ rule.name }}</h3>
          </div>
          <div class="flex gap-2 shrink-0">
            <UiAppButton variant="link" @click="openEditModal(rule)">
              {{ t("common.edit") }}
            </UiAppButton>
            <UiAppButton variant="destructive" @click="deleteRule(rule)">
              {{ t("common.delete") }}
            </UiAppButton>
          </div>
        </div>

        <p v-if="rule.comment" class="text-body text-fg-muted mb-2">{{ rule.comment }}</p>

        <div class="text-caption text-fg-muted space-y-1 normal-case tracking-normal">
          <div>
            {{ t("moderation.deleteOnViolation") }}
            <span class="font-medium text-fg">
              {{ rule.delete_on_violation ? t("common.yes") : t("common.no") }}
            </span>
          </div>
          <div>
            {{ t("moderation.banOnViolation") }}
            <span class="font-medium text-fg">
              <template v-if="rule.ban_on_violation">
                {{ t("common.yes") }} {{ t("moderation.afterWarnings", { count: rule.warnings_before_ban ?? 3 }) }}
              </template>
              <template v-else>
                {{ t("common.no") }}
              </template>
            </span>
          </div>
        </div>
      </UiAppCard>
    </div>

    <div v-if="!loading && rules.length === 0" class="tm-empty-state">
      {{ t("moderation.emptyRules") }}
    </div>

    <UiAppCard class="!p-4">
      <div class="flex items-center justify-between gap-3 mb-3">
        <h3 class="font-display text-heading-sm tracking-[-0.035em] text-fg">
          {{ t("moderation.chatUsers.title") }}
        </h3>
        <UiAppButton
          variant="link"
          :disabled="usersLoading"
          @click="loadUsers()"
        >
          {{ usersLoading ? t("common.loading") : t("common.refresh") }}
        </UiAppButton>
      </div>

      <p class="text-body text-fg-muted mb-3">
        {{ t("moderation.chatUsers.description") }}
      </p>

      <div v-if="usersLoading && !chatUsers.length" class="text-fg-muted text-body">
        {{ t("moderation.chatUsers.loading") }}
      </div>
      <div v-else-if="!chatUsers.length" class="text-fg-muted text-body">
        {{ t("moderation.chatUsers.empty") }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-body">
          <thead class="text-left text-fg-muted border-b border-line">
            <tr>
              <th class="py-2 pr-4 font-medium">{{ t("moderation.chatUsers.user") }}</th>
              <th class="py-2 pr-4 font-medium">{{ t("moderation.chatUsers.warnings") }}</th>
              <th class="py-2 pr-4 font-medium">{{ t("moderation.chatUsers.ban") }}</th>
              <th class="py-2 font-medium">{{ t("moderation.chatUsers.actions") }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-for="row in chatUsers" :key="row.user_id">
              <td class="py-2 pr-4 align-top">
                <div class="font-medium text-fg">
                  {{
                    row.username
                      ? `@${row.username}`
                      : row.first_name || t("moderation.chatUsers.userFallback", { userId: row.user_id })
                  }}
                </div>
                <div class="text-caption text-fg-muted normal-case tracking-normal">
                  {{ row.user_id }}
                </div>
              </td>
              <td class="py-2 pr-4 align-top text-fg">{{ row.warnings_count }}</td>
              <td class="py-2 pr-4 align-top">
                <UiAppBadge v-if="row.is_banned" variant="danger">
                  {{ t("moderation.chatUsers.banned") }}
                </UiAppBadge>
                <span v-else class="text-fg-muted">{{ t("common.dash") }}</span>
              </td>
              <td class="py-2 align-top">
                <div class="flex flex-wrap gap-2">
                  <UiAppButton
                    variant="ghost"
                    class="!px-2 !py-1 !text-caption uppercase tracking-wide"
                    :disabled="userActionBusy === row.user_id || row.warnings_count === 0"
                    @click="runUserAction(row.user_id, 'reset-warnings')"
                  >
                    {{ t("moderation.chatUsers.resetWarn") }}
                  </UiAppButton>
                  <UiAppButton
                    variant="ghost"
                    class="!px-2 !py-1 !text-caption uppercase tracking-wide"
                    :disabled="userActionBusy === row.user_id || !row.is_banned"
                    @click="runUserAction(row.user_id, 'unban')"
                  >
                    {{ t("moderation.chatUsers.unban") }}
                  </UiAppButton>
                  <UiAppButton
                    variant="primary"
                    class="!px-2 !py-1 !text-caption uppercase tracking-wide"
                    :disabled="
                      userActionBusy === row.user_id ||
                      (row.warnings_count === 0 && !row.is_banned)
                    "
                    @click="runUserAction(row.user_id, 'pardon')"
                  >
                    {{ t("moderation.chatUsers.pardon") }}
                  </UiAppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="usersPagination.total_pages > 1"
          class="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-line text-body"
        >
          <span class="text-fg-muted">
            {{
              t("common.pageOfWithTotal", {
                page: usersPagination.page,
                totalPages: usersPagination.total_pages,
                total: usersPagination.total,
              })
            }}
          </span>
          <div class="flex gap-2">
            <UiAppButton
              variant="ghost"
              class="!px-3 !py-1"
              :disabled="usersLoading || usersPagination.page <= 1"
              @click="goToUsersPage(usersPagination.page - 1)"
            >
              {{ t("common.previous") }}
            </UiAppButton>
            <UiAppButton
              variant="ghost"
              class="!px-3 !py-1"
              :disabled="
                usersLoading || usersPagination.page >= usersPagination.total_pages
              "
              @click="goToUsersPage(usersPagination.page + 1)"
            >
              {{ t("common.next") }}
            </UiAppButton>
          </div>
        </div>
      </div>
    </UiAppCard>

    <UiAppModal
      :open="showTemplateLibrary"
      size="lg"
      title-id="template-library-title"
      @close="closeTemplateLibrary"
    >
      <div>
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3
              id="template-library-title"
              class="font-display text-heading-sm tracking-[-0.035em] text-fg"
            >
              {{ t("moderation.templateLibrary.title") }}
            </h3>
            <p class="text-body text-fg-muted mt-1">
              {{ t("moderation.templateLibrary.description") }}
            </p>
          </div>
          <UiAppButton variant="link" @click="closeTemplateLibrary">
            {{ t("common.close") }}
          </UiAppButton>
        </div>

        <div v-if="templatesLoading" class="text-fg-muted text-body">
          {{ t("moderation.templateLibrary.loading") }}
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="template in templateCatalog"
            :key="template.id"
            class="border border-line rounded-card p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h4 class="font-medium text-fg">{{ template.name }}</h4>
                <p class="text-body text-fg-muted mt-1">
                  {{ template.comment }}
                </p>
              </div>
              <UiAppButton
                variant="primary"
                class="shrink-0"
                :disabled="template.added || addingTemplateId === template.id"
                @click="addTemplate(template.id)"
              >
                {{
                  template.added
                    ? t("common.added")
                    : addingTemplateId === template.id
                      ? t("common.adding")
                      : t("common.add")
                }}
              </UiAppButton>
            </div>
          </div>
        </div>
      </div>
    </UiAppModal>

    <UiAppModal :open="showModal" size="md" title-id="rule-modal-title" @close="closeModal">
      <div>
        <h3
          id="rule-modal-title"
          class="font-display text-heading-sm tracking-[-0.035em] text-fg mb-4"
        >
          {{ editingRule ? t("moderation.ruleModal.editTitle") : t("moderation.ruleModal.addTitle") }}
        </h3>

        <form class="space-y-4" @submit.prevent="saveRule">
          <UiAppAlert v-if="saveError" variant="danger">
            {{ saveError }}
          </UiAppAlert>

          <div>
            <label class="block text-body font-medium text-fg mb-1">
              {{ t("moderation.ruleModal.nameLabel") }}
            </label>
            <UiAppInput v-model="form.name" required />
          </div>

          <div>
            <label class="block text-body font-medium text-fg mb-1">
              {{ t("moderation.ruleModal.commentLabel") }}
            </label>
            <p class="text-caption text-fg-muted mb-1 normal-case tracking-normal">
              {{ t("moderation.ruleModal.commentHint") }}
            </p>
            <UiAppInput v-model="form.comment" />
          </div>

          <div>
            <label class="block text-body font-medium text-fg mb-1">
              {{ t("moderation.ruleModal.ruleTextLabel") }}
            </label>
            <p class="text-caption text-fg-muted mb-1 normal-case tracking-normal">
              {{ t("moderation.ruleModal.ruleTextHint") }}
            </p>
            <UiAppTextarea
              v-model="form.ai_prompt"
              :rows="4"
              required
              :placeholder="t('moderation.ruleModal.ruleTextPlaceholder')"
            />

            <div class="mt-2">
              <UiAppButton
                type="button"
                variant="ai"
                :aria-expanded="showAiAssist"
                :class="
                  showAiAssist
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-2'
                    : ''
                "
                @click="showAiAssist = !showAiAssist"
              >
                <Wand2
                  :size="16"
                  :stroke-width="1.5"
                  :absolute-stroke-width="true"
                  class="text-accent"
                  aria-hidden="true"
                />
                {{ t("moderation.ruleModal.aiAssistToggle") }}
              </UiAppButton>

              <div v-if="showAiAssist" class="mt-2 space-y-2">
                <p class="text-caption text-fg-muted normal-case tracking-normal">
                  {{
                    aiAssistIsDraftMode
                      ? t("moderation.ruleModal.aiAssistHintCreate")
                      : t("moderation.ruleModal.aiAssistHint")
                  }}
                </p>
                <div class="flex gap-2 items-center">
                  <UiAppInput
                    v-model="aiInstruction"
                    class="flex-1 min-w-0"
                    :placeholder="
                      aiAssistIsDraftMode
                        ? t('moderation.ruleModal.aiAssistInstructionPlaceholderCreate')
                        : t('moderation.ruleModal.aiAssistInstructionPlaceholder')
                    "
                    :disabled="aiAssistLoading"
                    @keydown.enter.prevent="submitRuleAssist"
                  />
                  <UiAppButton
                    type="button"
                    variant="ghost"
                    class="!size-10 shrink-0 !p-0"
                    :disabled="aiAssistLoading || !aiInstruction.trim()"
                    :aria-label="t('moderation.ruleModal.aiAssistSubmitAria')"
                    :aria-busy="aiAssistLoading"
                    @click="submitRuleAssist"
                  >
                    <svg
                      v-if="aiAssistLoading"
                      class="animate-spin h-5 w-5 text-fg-muted"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span v-else class="text-lg leading-none" aria-hidden="true">✨</span>
                  </UiAppButton>
                </div>
                <p v-if="aiAssistError" class="text-caption text-danger normal-case tracking-normal">
                  {{ aiAssistError }}
                </p>
                <div
                  v-if="ruleVersions.length > 0"
                  class="flex items-center gap-2 text-caption text-fg-muted normal-case tracking-normal"
                >
                  <UiAppButton
                    type="button"
                    variant="ghost"
                    class="!px-2 !py-1"
                    :disabled="ruleVersionIndex <= 0"
                    :aria-label="t('common.previous')"
                    @click="goToRuleVersion(ruleVersionIndex - 1)"
                  >
                    ◀
                  </UiAppButton>
                  <span>{{
                    t("moderation.ruleModal.aiAssistVersion", {
                      current: ruleVersionIndex + 1,
                      total: ruleVersions.length,
                    })
                  }}</span>
                  <UiAppButton
                    type="button"
                    variant="ghost"
                    class="!px-2 !py-1"
                    :disabled="ruleVersionIndex >= ruleVersions.length - 1"
                    :aria-label="t('common.next')"
                    @click="goToRuleVersion(ruleVersionIndex + 1)"
                  >
                    ▶
                  </UiAppButton>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-line pt-4 space-y-3">
            <h4 class="font-medium text-fg">{{ t("moderation.ruleModal.actionsTitle") }}</h4>

            <label class="flex items-center">
              <input
                v-model="form.delete_on_violation"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-body text-fg">{{ t("moderation.ruleModal.deleteOnViolation") }}</span>
            </label>

            <label class="flex items-center">
              <input
                v-model="form.ban_on_violation"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-body text-fg">{{ t("moderation.ruleModal.banAfterWarnings") }}</span>
            </label>

            <div v-if="form.ban_on_violation">
              <label class="block text-body font-medium text-fg mb-1">
                {{ t("moderation.ruleModal.warningsBeforeBanLabel") }}
              </label>
              <UiAppInput
                :model-value="String(form.warnings_before_ban)"
                type="number"
                min="1"
                max="20"
                @update:model-value="
                  form.warnings_before_ban = Math.min(
                    20,
                    Math.max(1, Number($event) || 3)
                  )
                "
              />
            </div>
          </div>

          <div class="flex gap-2 pt-4">
            <UiAppButton
              type="submit"
              variant="primary"
              class="flex-1"
              :disabled="saving"
            >
              {{
                saving
                  ? t("common.saving")
                  : editingRule
                    ? t("common.update")
                    : t("common.create")
              }}
            </UiAppButton>
            <UiAppButton type="button" variant="ghost" @click="closeModal">
              {{ t("common.cancel") }}
            </UiAppButton>
          </div>
        </form>
      </div>
    </UiAppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Wand2 } from "lucide-vue-next";
import { readFetchError } from "@/lib/fetch-error";

const { t } = useI18n();

const route = useRoute();
const botId = route.params.id as string;
const telegramChatId = route.params.chatId as string;

interface RuleForm {
  name: string;
  comment: string;
  ai_prompt: string;
  delete_on_violation: boolean;
  ban_on_violation: boolean;
  warnings_before_ban: number;
}

interface TemplateCatalogItem {
  id: string;
  name: string;
  comment: string;
  delete_on_violation: boolean;
  ban_on_violation: boolean;
  warnings_before_ban: number | null;
  added: boolean;
}

interface RuleAssistResponse {
  name: string;
  comment: string;
  ai_prompt: string;
}

interface RuleTextVersion {
  comment: string;
  ai_prompt: string;
}

const rulesApiBase = `/api/bots/${botId}/chats/${telegramChatId}/rules`;
const templatesApiBase = `/api/bots/${botId}/chats/${telegramChatId}`;
const usersApiBase = `/api/bots/${botId}/chats/${telegramChatId}/users`;

interface ChatUserRow {
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  warnings_count: number;
  is_banned: boolean;
  banned_at: string | null;
  last_activity: string;
}

const rules = ref<any[]>([]);
const chatUsers = ref<ChatUserRow[]>([]);
const chatName = ref("");
const loading = ref(false);
const usersLoading = ref(false);
const userActionError = ref<string | null>(null);
const userActionBusy = ref<number | null>(null);
const usersPagination = ref({
  page: 1,
  limit: 25,
  total: 0,
  total_pages: 1,
});

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("nav.bots"), to: "/bots" },
  { label: `@${botId}`, to: `/bots/${botId}` },
  { label: chatName.value || t("page.moderation.chatSubtitle", { chatId: telegramChatId }) },
  { label: t("page.moderation.title") },
]);

usePageTitle(() =>
  chatName.value
    ? t("page.moderation.documentTitleWithChat", { chatName: chatName.value })
    : t("page.moderation.documentTitle")
);

const saving = ref(false);
const templateError = ref<string | null>(null);
const ruleActionError = ref<string | null>(null);
const saveError = ref<string | null>(null);
const showModal = ref(false);
const showTemplateLibrary = ref(false);
const templatesLoading = ref(false);
const addingTemplateId = ref<string | null>(null);
const templateCatalog = ref<TemplateCatalogItem[]>([]);
const editingRule = ref<any | null>(null);

const showAiAssist = ref(false);
const aiInstruction = ref("");
const aiAssistLoading = ref(false);
const aiAssistError = ref<string | null>(null);
const ruleVersions = ref<RuleTextVersion[]>([]);
const ruleVersionIndex = ref(-1);

const aiAssistIsDraftMode = computed(() => ruleVersions.value.length === 0);

const emptyForm = (): RuleForm => ({
  name: "",
  comment: "",
  ai_prompt: "",
  delete_on_violation: false,
  ban_on_violation: false,
  warnings_before_ban: 3,
});

const form = ref<RuleForm>(emptyForm());

function resetRuleAssistState() {
  showAiAssist.value = false;
  aiInstruction.value = "";
  aiAssistLoading.value = false;
  aiAssistError.value = null;
  ruleVersions.value = [];
  ruleVersionIndex.value = -1;
}

function initRuleVersionsFromForm() {
  ruleVersions.value = [];
  ruleVersionIndex.value = -1;
  const hasText =
    form.value.comment.trim().length > 0 ||
    form.value.ai_prompt.trim().length > 0;
  if (hasText) {
    ruleVersions.value = [
      {
        comment: form.value.comment,
        ai_prompt: form.value.ai_prompt,
      },
    ];
    ruleVersionIndex.value = 0;
  }
}

function applyRuleVersion(index: number) {
  const version = ruleVersions.value[index];
  if (!version) {
    return;
  }
  form.value.comment = version.comment;
  form.value.ai_prompt = version.ai_prompt;
  ruleVersionIndex.value = index;
}

function goToRuleVersion(index: number) {
  if (index < 0 || index >= ruleVersions.value.length) {
    return;
  }
  applyRuleVersion(index);
}

async function submitRuleAssist() {
  const instruction = aiInstruction.value.trim();
  if (!instruction || aiAssistLoading.value) {
    return;
  }

  aiAssistLoading.value = true;
  aiAssistError.value = null;
  try {
    const response = await $fetch<{
      data: RuleAssistResponse;
    }>(`${rulesApiBase}/assist`, {
      method: "POST",
      body: {
        name: form.value.name,
        comment: form.value.comment,
        ai_prompt: form.value.ai_prompt,
        instruction,
      },
    });

    const next = response.data;
    ruleVersions.value.push({
      comment: next.comment,
      ai_prompt: next.ai_prompt,
    });
    ruleVersionIndex.value = ruleVersions.value.length - 1;
    if (!form.value.name.trim()) {
      form.value.name = next.name;
    }
    form.value.comment = next.comment;
    form.value.ai_prompt = next.ai_prompt;
    aiInstruction.value = "";
  } catch (error) {
    aiAssistError.value = readFetchError(error, t("common.errors.ruleAssist"));
    console.error("Rule assist failed:", error);
  } finally {
    aiAssistLoading.value = false;
  }
}

async function loadChatName() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`);
    const chat = resp?.data?.chats?.find(
      (item: { chat_id: number }) => String(item.chat_id) === telegramChatId
    );
    chatName.value = chat?.name ?? "";
  } catch {
    chatName.value = "";
  }
}

async function loadUsers(page = usersPagination.value.page) {
  usersLoading.value = true;
  userActionError.value = null;
  try {
    const resp = await $fetch<{
      data?: {
        users?: ChatUserRow[];
        pagination?: typeof usersPagination.value;
      };
    }>(usersApiBase, {
      query: { page, limit: usersPagination.value.limit },
    });
    chatUsers.value = resp?.data?.users ?? [];
    if (resp?.data?.pagination) {
      usersPagination.value = resp.data.pagination;
    }
  } catch (error) {
    userActionError.value = readFetchError(error, t("common.errors.loadChatUsers"));
    console.error("Error loading chat users:", error);
  } finally {
    usersLoading.value = false;
  }
}

async function goToUsersPage(page: number) {
  if (page < 1 || page > usersPagination.value.total_pages) {
    return;
  }
  await loadUsers(page);
}

type UserModerationAction = "pardon" | "reset-warnings" | "unban";

async function runUserAction(userId: number, action: UserModerationAction) {
  userActionBusy.value = userId;
  userActionError.value = null;
  try {
    await $fetch(`${usersApiBase}/${userId}/${action}`, {
      method: "POST",
      body: {},
    });
    await loadUsers();
  } catch (error) {
    userActionError.value = readFetchError(error, t("common.errors.updateUser"));
    console.error("Error updating chat user:", error);
  } finally {
    userActionBusy.value = null;
  }
}

async function load() {
  loading.value = true;
  try {
    const resp = await $fetch<any>(rulesApiBase);
    rules.value = resp?.data?.rules || [];
  } catch (error) {
    console.error("Error loading rules:", error);
  } finally {
    loading.value = false;
  }
}

async function loadTemplateCatalog() {
  templatesLoading.value = true;
  try {
    const resp = await $fetch<{
      data?: { templates?: TemplateCatalogItem[] };
    }>(`${templatesApiBase}/rule-templates`);
    templateCatalog.value = resp?.data?.templates ?? [];
  } catch (error) {
    templateError.value = readFetchError(error, t("common.errors.loadRuleTemplates"));
    console.error("Error loading rule templates:", error);
  } finally {
    templatesLoading.value = false;
  }
}

async function openTemplateLibrary() {
  templateError.value = null;
  showTemplateLibrary.value = true;
  await loadTemplateCatalog();
}

function closeTemplateLibrary() {
  showTemplateLibrary.value = false;
}

async function addTemplate(templateId: string) {
  addingTemplateId.value = templateId;
  templateError.value = null;
  try {
    await $fetch(`${templatesApiBase}/rule-templates`, {
      method: "POST",
      body: { template_id: templateId },
    });
    await load();
    await loadTemplateCatalog();
  } catch (error) {
    templateError.value = readFetchError(error, t("common.errors.addRuleTemplate"));
    console.error("Error adding template:", error);
  } finally {
    addingTemplateId.value = null;
  }
}

function openCreateModal() {
  editingRule.value = null;
  form.value = emptyForm();
  saveError.value = null;
  resetRuleAssistState();
  showModal.value = true;
}

function openEditModal(rule: any) {
  saveError.value = null;
  editingRule.value = rule;
  form.value = {
    name: rule.name,
    comment: rule.comment ?? "",
    ai_prompt: rule.ai_prompt,
    delete_on_violation: Boolean(rule.delete_on_violation),
    ban_on_violation: Boolean(rule.ban_on_violation),
    warnings_before_ban: rule.warnings_before_ban ?? 3,
  };
  resetRuleAssistState();
  initRuleVersionsFromForm();
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingRule.value = null;
  form.value = emptyForm();
  saveError.value = null;
  resetRuleAssistState();
}

async function saveRule() {
  saving.value = true;
  saveError.value = null;
  ruleActionError.value = null;
  try {
    const payload = {
      name: form.value.name,
      comment: form.value.comment,
      ai_prompt: form.value.ai_prompt,
      delete_on_violation: form.value.delete_on_violation,
      ban_on_violation: form.value.ban_on_violation,
      warnings_before_ban: form.value.ban_on_violation
        ? form.value.warnings_before_ban
        : null,
    };

    if (editingRule.value) {
      await $fetch(`${rulesApiBase}/${editingRule.value.id}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      await $fetch(rulesApiBase, {
        method: "POST",
        body: payload,
      });
    }

    closeModal();
    await load();
  } catch (error) {
    saveError.value = readFetchError(error, t("common.errors.saveRule"));
    console.error("Error saving rule:", error);
  } finally {
    saving.value = false;
  }
}

async function deleteRule(rule: any) {
  if (!confirm(t("common.confirm.deleteRule", { name: rule.name }))) {
    return;
  }

  ruleActionError.value = null;
  try {
    await $fetch(`${rulesApiBase}/${rule.id}`, { method: "DELETE" });
    await load();
  } catch (error) {
    ruleActionError.value = readFetchError(error, t("common.errors.deleteRule"));
    console.error("Error deleting rule:", error);
  }
}

onMounted(async () => {
  await Promise.all([loadChatName(), load(), loadUsers()]);
});
</script>
