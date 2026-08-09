<template>
  <div>
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="bot?.name ?? t('page.botDetail.titleFallback')"
      :subtitle="bot ? `@${bot.id}` : undefined"
    >
      <template #actions>
        <UiAppButton
          :variant="bot?.is_active ? 'destructive' : 'primary'"
          @click="toggleBotStatus"
        >
          {{ bot?.is_active ? t("common.disable") : t("common.enable") }}
        </UiAppButton>
      </template>
    </LayoutPageHeader>

    <div v-if="loading" class="text-fg-muted">{{ t("common.loading") }}</div>

    <template v-else>
      <UiAppAlert
        v-if="chatActivation.status.value !== 'idle'"
        class="mb-4"
        :variant="activationAlertVariant"
      >
        <p>{{ chatActivation.message.value }}</p>
        <UiAppButton
          v-if="chatActivation.status.value === 'failed' || chatActivation.status.value === 'expired'"
          variant="link"
          class="mt-2 !px-0"
          @click="retryChatActivation"
        >
          {{ t("chat.activation.retry") }}
        </UiAppButton>
      </UiAppAlert>

      <div v-if="bot" class="space-y-6">
        <div class="flex gap-1 border-b border-line">
          <button
            v-for="tab in botTabs"
            :key="tab.id"
            type="button"
            class="px-4 py-2 text-body border-b-2 -mb-px"
            :class="
              activeTab === tab.id
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-fg-muted hover:text-fg'
            "
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <template v-if="activeTab === 'overview'">
          <div class="flex flex-wrap items-center gap-2">
            <UiAppBadge :class="overviewStatusBadgeClass">
              {{ aggregatedStatusText }}
            </UiAppBadge>
            <UiAppBadge v-if="bot.my_role">
              {{ roleLabel(bot.my_role) }}
            </UiAppBadge>
            <UiAppBadge class="normal-case tracking-normal text-fg-muted">
              {{ t("bot.created", { date: formatDate(bot.created_at) }) }}
            </UiAppBadge>
            <template v-if="isSaas">
              <UiAppBadge class="text-accent">
                {{ t("billing.balance") }}: {{ (bot.credit_balance ?? 0).toLocaleString() }}
              </UiAppBadge>
              <UiAppButton
                variant="link"
                class="!px-2.5 !py-1.5 !text-[11px] uppercase tracking-wide"
                :to="`/bots/${botId}/credits`"
              >
                {{ t("billing.manageCredits") }}
              </UiAppButton>
            </template>
            <p
              v-if="deliveryProblemMessage"
              class="w-full text-body text-danger"
            >
              {{ deliveryProblemMessage }}
            </p>
          </div>

          <!-- Chats -->
          <UiAppCard class="!p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-display text-heading-sm tracking-[-0.035em] text-fg">
                {{ t("bot.chats.title", { count: bot.chats?.length || 0 }) }}
              </h3>
              <UiAppButton
                v-if="canManageBot"
                variant="ghost"
                :disabled="chatActivation.status.value === 'waiting'"
                @click="openAddChatActivationModal"
              >
                {{ t("bot.chats.addChat") }}
              </UiAppButton>
            </div>
            <div v-if="bot.chats && bot.chats.length > 0" class="space-y-3">
              <div
                v-for="chat in bot.chats"
                :key="chat.chat_id"
                class="border border-line rounded-card p-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-start gap-3 flex-1 min-w-0">
                    <img
                      v-if="chat.id && chat.photo_file_id"
                      :src="chatPhotoUrl(chat.id)"
                      :alt="chat.name"
                      class="h-10 w-10 rounded-control object-cover bg-surface-3"
                    />
                    <div
                      v-else
                      class="h-10 w-10 rounded-control bg-surface-3 flex items-center justify-center text-caption text-fg-muted normal-case tracking-normal"
                    >
                      {{ t("bot.chats.placeholderInitials") }}
                    </div>
                    <div class="min-w-0">
                      <div class="font-medium text-fg truncate">{{ chat.name }}</div>
                      <div class="text-body text-fg-muted">
                        {{ t("bot.chats.id", { id: chat.chat_id }) }}
                      </div>
                      <div class="text-body text-fg-muted">
                        {{ t("bot.chats.rules", { count: chat.rules_count || 0 }) }}
                      </div>
                      <div class="text-body text-fg-muted">
                        {{ t("bot.chats.silentMode") }}
                        <span :class="getSilentModeClass(chat)">
                          {{ getSilentModeText(chat) }}
                        </span>
                      </div>
                      <div class="mt-1">
                        <UiAppBadge :class="chatHealthBadgeClass(chat)">
                          {{ chatHealthLabel(chat) }}
                        </UiAppBadge>
                        <p
                          v-if="chat.health_message && chat.health_status !== 'ok'"
                          class="text-caption text-danger mt-1 normal-case tracking-normal"
                        >
                          {{ chat.health_message }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <UiAppButton
                      variant="link"
                      :to="`/bots/${botId}/chats/${chat.chat_id}/moderation`"
                    >
                      {{ t("bot.chats.moderation") }}
                    </UiAppButton>
                    <UiAppButton variant="link" @click="editChat(chat)">
                      {{ t("common.edit") }}
                    </UiAppButton>
                    <UiAppButton variant="destructive" @click="removeChat(chat.chat_id)">
                      {{ t("common.remove") }}
                    </UiAppButton>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-fg-muted">{{ t("bot.chats.noChats") }}</div>
          </UiAppCard>

          <!-- Statistics -->
          <UiAppCard class="!p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-display text-heading-sm tracking-[-0.035em] text-fg">
                {{ t("bot.statistics.title") }}
              </h3>
              <UiAppButton variant="ghost" @click="loadStatistics">
                {{ t("common.refresh") }}
              </UiAppButton>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center">
                <div class="text-2xl font-semibold text-accent">
                  {{ statistics?.today?.messages_processed || 0 }}
                </div>
                <div class="text-body text-fg-muted">{{ t("bot.statistics.messagesToday") }}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-semibold text-action-warning">
                  {{ statistics?.today?.warnings_issued || 0 }}
                </div>
                <div class="text-body text-fg-muted">{{ t("bot.statistics.warningsToday") }}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-semibold text-danger">
                  {{ statistics?.users?.banned_count || 0 }}
                </div>
                <div class="text-body text-fg-muted">{{ t("bot.statistics.bannedTotal") }}</div>
              </div>
              <div
                v-if="isSaas && (statistics?.today?.not_moderated || 0) > 0"
                class="text-center md:col-span-3"
              >
                <UiAppAlert class="!p-4">
                  <div class="text-2xl font-semibold text-action-warning">
                    {{ statistics?.today?.not_moderated || 0 }}
                  </div>
                  <div class="text-body font-medium text-fg">
                    {{ t("bot.statistics.notModeratedToday") }}
                  </div>
                  <p class="text-caption text-fg-muted mt-1 normal-case tracking-normal">
                    {{ t("bot.statistics.notModeratedHint") }}
                  </p>
                </UiAppAlert>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-surface-3 rounded-card p-4">
                <h4 class="font-medium text-fg mb-2">{{ t("bot.statistics.thisWeek") }}</h4>
                <div class="space-y-1 text-body">
                  <div class="flex justify-between">
                    <span class="text-fg-muted">{{ t("bot.statistics.totalMessages") }}</span>
                    <span class="font-medium text-fg">
                      {{ statistics?.week?.total_messages_processed || 0 }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-fg-muted">{{ t("bot.statistics.totalWarnings") }}</span>
                    <span class="font-medium text-fg">
                      {{ statistics?.week?.total_warnings_issued || 0 }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-fg-muted">{{ t("bot.statistics.messagesDeleted") }}</span>
                    <span class="font-medium text-fg">
                      {{ statistics?.week?.total_messages_deleted || 0 }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="bg-surface-3 rounded-card p-4">
                <h4 class="font-medium text-fg mb-2">{{ t("bot.statistics.usersSection") }}</h4>
                <div class="space-y-1 text-body">
                  <div class="flex justify-between">
                    <span class="text-fg-muted">{{ t("bot.statistics.active24h") }}</span>
                    <span class="font-medium text-fg">
                      {{ statistics?.users?.active_count || 0 }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-fg-muted">{{ t("bot.statistics.banned") }}</span>
                    <span class="font-medium text-danger">
                      {{ statistics?.users?.banned_count || 0 }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-fg-muted">{{ t("bot.statistics.maxUnique") }}</span>
                    <span class="font-medium text-fg">
                      {{ statistics?.week?.max_unique_users || 0 }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </UiAppCard>

          <!-- Recent Logs -->
          <UiAppCard class="!p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-display text-heading-sm tracking-[-0.035em] text-fg">
                {{ t("bot.recentActivity.title") }}
              </h3>
              <div class="flex gap-2">
                <UiAppButton variant="ghost" :to="`/bots/${botId}/audit`">
                  {{ t("bot.recentActivity.audit") }}
                </UiAppButton>
                <UiAppButton variant="ghost" @click="loadLogs">
                  {{ t("common.refresh") }}
                </UiAppButton>
              </div>
            </div>
            <div v-if="logs.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="log in logs"
                :key="log.id"
                class="border border-line rounded-card p-2 text-body"
              >
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <span :class="logActionClass(log.action_type)">
                      {{ logActionLabel(log.action_type) }}
                    </span>
                    <span class="text-fg-muted"> - {{ log.message }}</span>
                  </div>
                  <div class="text-caption text-fg-muted normal-case tracking-normal shrink-0">
                    {{ formatDate(log.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-fg-muted text-center py-4">
              {{ t("bot.recentActivity.empty") }}
            </div>
          </UiAppCard>

          <UiAppCard
            v-if="isOwner"
            class="!p-6 border-danger"
          >
            <h3 class="font-display text-heading-sm tracking-[-0.035em] text-danger mb-2">
              {{ t("bot.dangerZone.title") }}
            </h3>
            <p class="text-body text-fg-muted mb-4">
              {{ t("bot.dangerZone.description") }}
            </p>

            <div v-if="!showDeleteConfirm" class="flex">
              <UiAppButton variant="destructive" @click="openDeleteConfirm">
                {{ t("bot.dangerZone.deleteButton") }}
              </UiAppButton>
            </div>

            <div v-else class="space-y-3 max-w-md">
              <p class="text-body text-fg">
                {{ t("bot.dangerZone.confirmHint", { botId: bot.id }) }}
              </p>
              <UiAppInput
                v-model="deleteConfirmText"
                :placeholder="t('bot.dangerZone.confirmPlaceholder', { botId: bot.id })"
              />
              <UiAppAlert v-if="deleteError" variant="danger">
                {{ deleteError }}
              </UiAppAlert>
              <div class="flex gap-2">
                <UiAppButton
                  variant="destructive"
                  :disabled="!canConfirmDelete || deletingBot"
                  @click="deleteBot"
                >
                  {{ deletingBot ? t("bot.dangerZone.deleting") : t("bot.dangerZone.confirmButton") }}
                </UiAppButton>
                <UiAppButton
                  variant="ghost"
                  :disabled="deletingBot"
                  @click="cancelDeleteConfirm"
                >
                  {{ t("common.cancel") }}
                </UiAppButton>
              </div>
            </div>
          </UiAppCard>
        </template>

        <UiAppCard v-if="activeTab === 'moderation'" class="!p-6">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
            <h3 class="font-display text-heading-sm tracking-[-0.035em] text-fg">
              {{ t("bot.messageTemplates.title") }}
            </h3>
            <UiAppButton variant="link" @click="showHtmlHelpModal = true">
              {{ t("bot.messageTemplates.helpLink") }}
            </UiAppButton>
          </div>
          <p class="text-body text-fg-muted mb-4">
            {{ t("bot.messageTemplates.description") }}
          </p>

          <div class="flex gap-2 mb-4 border-b border-line">
            <button
              type="button"
              class="px-3 py-2 text-body border-b-2 -mb-px"
              :class="
                messageTemplateTab === 'warning'
                  ? 'border-accent text-accent font-medium'
                  : 'border-transparent text-fg-muted hover:text-fg'
              "
              @click="messageTemplateTab = 'warning'"
            >
              {{ t("bot.messageTemplates.warningTab") }}
            </button>
            <button
              type="button"
              class="px-3 py-2 text-body border-b-2 -mb-px"
              :class="
                messageTemplateTab === 'ban'
                  ? 'border-accent text-accent font-medium'
                  : 'border-transparent text-fg-muted hover:text-fg'
              "
              @click="messageTemplateTab = 'ban'"
            >
              {{ t("bot.messageTemplates.banTab") }}
            </button>
          </div>

          <div class="flex flex-wrap gap-2 mb-3">
            <UiAppButton
              v-for="chip in activeTemplateChips"
              :key="chip.key"
              variant="ghost"
              class="!px-2 !py-1 !text-caption uppercase tracking-wide"
              :title="t(chip.hintKey)"
              @click="insertTemplatePlaceholder(chip.key)"
            >
              {{ t(chip.labelKey) }}
            </UiAppButton>
          </div>

          <UiAppTextarea
            ref="templateTextareaComponentRef"
            v-model="activeTemplateDraft"
            :rows="8"
          />

          <UiAppAlert v-if="templateSaveError" variant="danger" class="mt-2">
            {{ templateSaveError }}
          </UiAppAlert>
          <p v-if="templateSaveSuccess" class="text-body text-fg mt-2">
            {{ t("bot.messageTemplates.saved") }}
          </p>

          <div class="flex gap-2 mt-4">
            <UiAppButton
              variant="primary"
              :disabled="savingTemplates"
              @click="saveMessageTemplates"
            >
              {{ savingTemplates ? t("common.saving") : t("common.save") }}
            </UiAppButton>
            <UiAppButton
              variant="ghost"
              :disabled="savingTemplates"
              @click="resetAndSaveMessageTemplates"
            >
              {{ t("bot.messageTemplates.resetToDefault") }}
            </UiAppButton>
          </div>
        </UiAppCard>

        <UiAppCard v-if="activeTab === 'team'" class="!p-6">
          <h3 class="font-display text-heading-sm tracking-[-0.035em] text-fg mb-4">
            {{ t("bot.team.title") }}
          </h3>
          <div v-if="teamLoading" class="text-fg-muted text-body">
            {{ t("bot.team.loading") }}
          </div>
          <div v-else class="space-y-4">
            <div v-if="isOwner && accessCode" class="flex flex-wrap items-center gap-3">
              <div class="text-body text-fg">
                {{ t("bot.team.accessCode") }}
                <code class="bg-surface-3 px-2 py-1 rounded-control font-mono text-body">
                  {{ accessCode }}
                </code>
              </div>
              <UiAppButton variant="link" @click="copyAccessCode">
                {{ t("common.copy") }}
              </UiAppButton>
              <UiAppButton variant="destructive" @click="revokeAccessCode">
                {{ t("common.revoke") }}
              </UiAppButton>
            </div>
            <p v-else-if="isOwner" class="text-body text-fg-muted">
              {{ t("bot.team.accessCodeForOperators") }}
            </p>
            <p v-else class="text-body text-fg-muted">
              {{ t("bot.team.ownerManagesTeam") }}
            </p>

            <div v-if="teamMembers.length" class="space-y-2">
              <h4 class="text-body font-medium text-fg">{{ t("bot.team.members") }}</h4>
              <div
                v-for="member in teamMembers"
                :key="member.user_id"
                class="flex items-center justify-between text-body border border-line rounded-card px-3 py-2"
              >
                <div>
                  <span class="font-medium text-fg">
                    {{ member.username ? `@${member.username}` : member.name }}
                  </span>
                  <span class="text-fg-muted ml-2">{{ roleLabel(member.role) }}</span>
                </div>
                <UiAppButton
                  v-if="isOwner && member.role === 'manager' && member.user_id !== bot?.my_user_id"
                  variant="destructive"
                  @click="removeMember(member.user_id)"
                >
                  {{ t("common.remove") }}
                </UiAppButton>
                <UiAppButton
                  v-else-if="isOwner && member.role === 'manager' && member.user_id === bot?.my_user_id"
                  variant="destructive"
                  @click="removeMember(member.user_id)"
                >
                  {{ t("common.leaveTeam") }}
                </UiAppButton>
              </div>
            </div>
          </div>
        </UiAppCard>
      </div>

      <div v-else class="text-fg-muted">{{ t("page.botDetail.notFound") }}</div>
    </template>

    <!-- Add Chat activation -->
    <UiAppModal
      :open="showAddChatActivationModal"
      title-id="add-chat-activation-title"
      @close="closeAddChatActivationModal"
    >
      <div class="w-full max-w-md">
        <h3
          id="add-chat-activation-title"
          class="font-display text-heading-sm tracking-[-0.035em] text-fg mb-2"
        >
          {{ t("chatActivation.modal.title") }}
        </h3>
        <p class="text-body text-fg-muted mb-4">
          {{ t("chatActivation.modal.intro") }}
        </p>

        <ul class="text-body text-fg-muted list-disc pl-5 mb-4 space-y-1">
          <li v-for="(item, index) in activationPrerequisites" :key="index">
            {{ item }}
          </li>
        </ul>

        <div class="space-y-3">
          <UiAppButton
            variant="primary"
            class="w-full !text-left"
            @click="startChatActivation('new_group')"
          >
            <span class="font-medium">{{ t("chatActivation.modal.newGroupTitle") }}</span>
            <span class="block text-fg-muted text-caption mt-1 normal-case tracking-normal">
              {{ t("chatActivation.modal.newGroupHint") }}
            </span>
          </UiAppButton>
          <UiAppButton
            variant="ghost"
            class="w-full !text-left"
            @click="startChatActivation('existing_group')"
          >
            <span class="font-medium">{{ t("chatActivation.modal.existingGroupTitle") }}</span>
            <span class="block text-fg-muted text-caption mt-1 normal-case tracking-normal">
              {{ t("chatActivation.modal.existingGroupHint") }}
            </span>
          </UiAppButton>
        </div>

        <UiAppButton
          variant="ghost"
          class="mt-4 w-full"
          @click="closeAddChatActivationModal"
        >
          {{ t("common.cancel") }}
        </UiAppButton>
      </div>
    </UiAppModal>

    <!-- Modal for chat silent mode -->
    <UiAppModal
      :open="showAddChatModal && editingChat"
      title-id="edit-chat-modal-title"
      @close="closeChatModal"
    >
      <div class="w-full max-w-md">
        <h3
          id="edit-chat-modal-title"
          class="font-display text-heading-sm tracking-[-0.035em] text-fg mb-4"
        >
          {{ t("bot.chats.editModal.title") }}
        </h3>

        <form @submit.prevent="saveChat" class="space-y-4">
          <div class="text-body text-fg-muted">
            <div class="font-medium text-fg">{{ editingChat?.name }}</div>
            <div>{{ t("bot.chats.id", { id: editingChat?.chat_id }) }}</div>
          </div>

          <div class="border-t border-line pt-4">
            <h4 class="font-medium text-fg mb-3">
              {{ t("bot.chats.editModal.silentModeTitle") }}
            </h4>

            <div class="space-y-3">
              <label class="flex items-center">
                <input
                  v-model="newChat.silent_mode"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-body font-medium text-fg">
                  {{ t("bot.chats.editModal.enableSilentMode") }}
                </span>
              </label>
            </div>

            <div class="mt-3 text-caption text-fg-muted bg-surface-3 p-2 rounded-card normal-case tracking-normal">
              <p class="font-medium mb-1 text-fg">{{ t("bot.chats.editModal.silentModeHelpTitle") }}</p>
              <p>• {{ t("bot.chats.editModal.silentModeEnabled") }}</p>
              <p>• {{ t("bot.chats.editModal.silentModeDisabled") }}</p>
            </div>
          </div>

          <div class="border-t border-line pt-4">
            <h4 class="font-medium text-fg mb-3">
              {{ t("bot.chats.editModal.serviceMessagesTitle") }}
            </h4>

            <div class="space-y-3">
              <label class="flex items-center">
                <input
                  v-model="newChat.service_message_cleanup.enabled"
                  type="checkbox"
                  class="mr-2"
                  @change="onServiceCleanupEnabledChange"
                />
                <span class="text-body font-medium text-fg">
                  {{ t("bot.chats.editModal.enableServiceMessageCleanup") }}
                </span>
              </label>

              <div
                v-if="newChat.service_message_cleanup.enabled"
                class="ml-6 space-y-2"
              >
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    class="mr-2"
                    :checked="newChat.service_message_cleanup.types.includes('member_joined')"
                    @change="setServiceMessageType('member_joined', ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="text-body text-fg">
                    {{ t("bot.chats.editModal.serviceMessageMemberJoined") }}
                  </span>
                </label>
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    class="mr-2"
                    :checked="newChat.service_message_cleanup.types.includes('member_left')"
                    @change="setServiceMessageType('member_left', ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="text-body text-fg">
                    {{ t("bot.chats.editModal.serviceMessageMemberLeft") }}
                  </span>
                </label>
              </div>
            </div>

            <div class="mt-3 text-caption text-fg-muted bg-surface-3 p-2 rounded-card normal-case tracking-normal">
              <p class="font-medium mb-1 text-fg">{{ t("bot.chats.editModal.serviceMessagesHelpTitle") }}</p>
              <p>{{ t("bot.chats.editModal.serviceMessagesHelp") }}</p>
            </div>
          </div>

          <div class="flex gap-2 pt-4">
            <UiAppButton
              type="submit"
              variant="primary"
              class="flex-1"
              :disabled="saving"
            >
              {{ saving ? t("common.saving") : t("bot.chats.editModal.updateButton") }}
            </UiAppButton>
            <UiAppButton type="button" variant="ghost" @click="closeChatModal">
              {{ t("common.cancel") }}
            </UiAppButton>
          </div>
        </form>
      </div>
    </UiAppModal>
  </div>

  <BotsBotMessageHtmlHelpModal
    :open="showHtmlHelpModal"
    @close="showHtmlHelpModal = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  BAN_TEMPLATE_PLACEHOLDERS,
  DEFAULT_BAN_TEMPLATE_PREVIEW,
  DEFAULT_WARNING_TEMPLATE_PREVIEW,
  WARNING_TEMPLATE_PLACEHOLDERS,
} from "~/lib/bot-message-template-ui";
import type { ChatActivationStartMode } from "~/composables/useChatActivationWait";
import type { BotMemberRole } from "~/types/bot";
import {
  DEFAULT_SERVICE_MESSAGE_CLEANUP,
  type ServiceMessageKindId,
} from "~/lib/service-message-cleanup";

const { t, tm, locale } = useI18n();
const { actionLabel: logActionLabel, actionClass: logActionClass } = useModerationActionDisplay();
const config = useRuntimeConfig();
const isSaas = computed(() => config.public.deploymentMode === "saas");

const route = useRoute();
const router = useRouter();
const botId = route.params.id as string;

const bot = ref<any>(null);

type BotDetailTab = "overview" | "moderation" | "team";
const activeTab = ref<BotDetailTab>("overview");
const botTabs = computed(() => [
  { id: "overview" as const, label: t("bot.tabs.overview") },
  { id: "moderation" as const, label: t("bot.tabs.moderation") },
  { id: "team" as const, label: t("bot.tabs.team") },
]);

const activationPrerequisites = computed(
  () => tm("chatActivation.prerequisites") as string[]
);

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("nav.bots"), to: "/bots" },
  { label: bot.value ? `@${bot.value.id}` : `@${botId}` },
]);

usePageTitle(() => bot.value?.name ?? t("page.botDetail.documentTitleFallback"));

const chatActivation = useChatActivationWait({
  botId,
  botUsername: botId,
  onCompleted: async () => {
    await loadBot();
    chatActivation.reset();
  },
});
const loading = ref(false);
const showAddChatModal = ref(false);
const showAddChatActivationModal = ref(false);
const lastChatActivationMode = ref<ChatActivationStartMode>("new_group");
const editingChat = ref<any>(null);
const saving = ref(false);
const accessCode = ref<string | null>(null);
const teamMembers = ref<any[]>([]);
const teamLoading = ref(false);
const statusError = ref("");
const messageTemplateTab = ref<"warning" | "ban">("warning");
const warningTemplateDraft = ref("");
const banTemplateDraft = ref("");
const templateTextareaComponentRef = ref<{ textareaEl: HTMLTextAreaElement | null } | null>(null);
const templateTextareaEl = computed(
  () => templateTextareaComponentRef.value?.textareaEl ?? null
);
const savingTemplates = ref(false);
const templateSaveError = ref("");
const templateSaveSuccess = ref(false);
const showHtmlHelpModal = ref(false);
const showDeleteConfirm = ref(false);
const deleteConfirmText = ref("");
const deleteError = ref("");
const deletingBot = ref(false);
const logs = ref<any[]>([]);
const statistics = ref<any>({
  today: {
    messages_processed: 0,
    warnings_issued: 0,
    messages_deleted: 0,
    users_banned: 0,
    unique_users: 0,
    not_moderated: 0,
  },
  week: {
    total_messages_processed: 0,
    total_warnings_issued: 0,
    total_messages_deleted: 0,
    total_users_banned: 0,
    max_unique_users: 0,
    days_count: 0,
  },
  users: {
    banned_count: 0,
    active_count: 0,
  },
});

const newChat = ref({
  chat_id: "",
  name: "",
  silent_mode: false,
  service_message_cleanup: { ...DEFAULT_SERVICE_MESSAGE_CLEANUP },
});

const aggregatedStatusText = computed(() => {
  const status = bot.value?.delivery_status;
  if (status === "healthy") return t("bot.deliveryStatus.healthy");
  if (status === "disabled") return t("bot.deliveryStatus.disabled");
  if (status === "degraded" || status === "unavailable") return t("bot.deliveryStatus.problem");
  return t("bot.deliveryStatus.unknown");
});

const overviewStatusBadgeClass = computed(() => {
  const status = bot.value?.delivery_status;
  if (status === "healthy") {
    return "text-fg";
  }
  if (status === "disabled") {
    return "text-fg-muted";
  }
  return "text-danger";
});

const canManageBot = computed(
  () => bot.value?.my_role === "owner" || bot.value?.my_role === "manager"
);

const isOwner = computed(() => bot.value?.my_role === "owner");

const canConfirmDelete = computed(() => {
  const value = deleteConfirmText.value.trim();
  if (!bot.value) return false;
  return value === "DELETE" || value === `@${bot.value.id}` || value === bot.value.id;
});

const activationAlertVariant = computed(() => {
  const value = chatActivation.status.value;
  if (value === "failed" || value === "expired") {
    return "danger" as const;
  }
  return "neutral" as const;
});

const activeTemplateChips = computed(() =>
  messageTemplateTab.value === "warning"
    ? WARNING_TEMPLATE_PLACEHOLDERS
    : BAN_TEMPLATE_PLACEHOLDERS
);

const activeTemplateDraft = computed({
  get() {
    return messageTemplateTab.value === "warning"
      ? warningTemplateDraft.value
      : banTemplateDraft.value;
  },
  set(value: string) {
    if (messageTemplateTab.value === "warning") {
      warningTemplateDraft.value = value;
    } else {
      banTemplateDraft.value = value;
    }
  },
});

const { insertAtCursor: insertTemplatePlaceholder } = useTemplateInsert(
  templateTextareaEl,
  activeTemplateDraft
);

const deliveryProblemMessage = computed(() => {
  const status = bot.value?.delivery_status;
  if (status === "degraded" || status === "unavailable") {
    return bot.value?.delivery_message;
  }
  return "";
});

function formatDate(dateString: string) {
  const loc = locale.value === "ru" ? "ru-RU" : "en-US";
  return new Date(dateString).toLocaleDateString(loc, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(role: BotMemberRole | string | undefined) {
  if (role === "owner") return t("common.roles.owner");
  if (role === "manager") return t("common.roles.manager");
  return t("common.roles.manager");
}

async function loadBot() {
  loading.value = true;
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`);
    bot.value = resp?.data;
    syncMessageTemplateDrafts();
  } catch (error: any) {
    const status = error?.statusCode ?? error?.response?.status;
    if (status !== 404) {
      console.error("Error loading bot:", error);
    }
  } finally {
    loading.value = false;
  }
}

function syncMessageTemplateDrafts() {
  warningTemplateDraft.value =
    bot.value?.warning_message_template ?? DEFAULT_WARNING_TEMPLATE_PREVIEW;
  banTemplateDraft.value =
    bot.value?.ban_message_template ?? DEFAULT_BAN_TEMPLATE_PREVIEW;
}

async function saveMessageTemplates() {
  savingTemplates.value = true;
  templateSaveError.value = "";
  templateSaveSuccess.value = false;

  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: {
        warning_message_template: warningTemplateDraft.value.trim() || null,
        ban_message_template: banTemplateDraft.value.trim() || null,
      },
    });

    if (resp?.data) {
      bot.value = resp.data;
      syncMessageTemplateDrafts();
    }
    templateSaveSuccess.value = true;
  } catch (error: any) {
    templateSaveError.value =
      error?.data?.statusMessage ||
      error?.message ||
      t("common.errors.saveMessageTemplates");
  } finally {
    savingTemplates.value = false;
  }
}

function resetMessageTemplates() {
  warningTemplateDraft.value = DEFAULT_WARNING_TEMPLATE_PREVIEW;
  banTemplateDraft.value = DEFAULT_BAN_TEMPLATE_PREVIEW;
}

async function resetAndSaveMessageTemplates() {
  resetMessageTemplates();
  savingTemplates.value = true;
  templateSaveError.value = "";
  templateSaveSuccess.value = false;

  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: {
        warning_message_template: null,
        ban_message_template: null,
      },
    });

    if (resp?.data) {
      bot.value = resp.data;
      syncMessageTemplateDrafts();
    }
    templateSaveSuccess.value = true;
  } catch (error: any) {
    templateSaveError.value =
      error?.data?.statusMessage ||
      error?.message ||
      t("common.errors.resetMessageTemplates");
  } finally {
    savingTemplates.value = false;
  }
}

async function startChatActivation(mode: ChatActivationStartMode) {
  lastChatActivationMode.value = mode;
  showAddChatActivationModal.value = false;
  try {
    await chatActivation.start(mode);
  } catch (error: any) {
    chatActivation.status.value = "failed";
    chatActivation.message.value =
      error?.data?.statusMessage || error?.message || t("common.errors.startChatActivation");
  }
}

function openAddChatActivationModal() {
  showAddChatActivationModal.value = true;
}

function closeAddChatActivationModal() {
  showAddChatActivationModal.value = false;
}

function retryChatActivation() {
  chatActivation.reset();
  void startChatActivation(lastChatActivationMode.value);
}

function chatPhotoUrl(chatRowId: number) {
  return `/api/bots/${botId}/chats/row/${chatRowId}/photo`;
}

function botPhotoUrl(id: string) {
  return `/api/bots/${id}/photo`;
}

function botInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || "B").toUpperCase();
}

function chatHealthLabel(chat: any) {
  if (chat.health_status === "ok") return t("bot.chats.health.ok");
  if (chat.health_status === "degraded") return t("bot.chats.health.degraded");
  if (chat.health_status === "unhealthy") return t("bot.chats.health.unhealthy");
  return t("bot.chats.health.unknown");
}

function chatHealthBadgeClass(chat: any) {
  if (chat.health_status === "ok") return "text-fg";
  if (chat.health_status === "degraded") return "text-action-warning";
  if (chat.health_status === "unhealthy") return "text-danger";
  return "text-fg-muted";
}

async function toggleBotStatus() {
  if (!bot.value) return;

  statusError.value = "";

  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: { is_active: !bot.value.is_active },
    });

    if (resp?.data) {
      bot.value = resp.data;
    }
  } catch (error: any) {
    statusError.value =
      error?.data?.statusMessage ||
      error?.message ||
      t("common.errors.updateBotStatus");
    console.error("Error updating bot status:", error);
  }
}

async function loadStatistics() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/statistics`);
    if (resp?.data?.statistics) {
      statistics.value = resp.data.statistics;
    }
  } catch (error) {
    console.error("Error loading statistics:", error);
    // При ошибке оставляем дефолтные значения
  }
}

function setServiceMessageType(kind: ServiceMessageKindId, enabled: boolean) {
  const types = new Set(newChat.value.service_message_cleanup.types);
  if (enabled) {
    types.add(kind);
  } else {
    types.delete(kind);
  }
  newChat.value.service_message_cleanup.types = [...types];
}

function onServiceCleanupEnabledChange() {
  if (!newChat.value.service_message_cleanup.enabled) {
    newChat.value.service_message_cleanup.types = [];
  }
}

function editChat(chat: any) {
  editingChat.value = chat;
  newChat.value = {
    chat_id: chat.chat_id,
    name: chat.name,
    silent_mode: chat.silent_mode,
    service_message_cleanup: {
      enabled: chat.service_message_cleanup?.enabled ?? false,
      types: [...(chat.service_message_cleanup?.types ?? [])],
    },
  };
  showAddChatModal.value = true;
}

function closeChatModal() {
  showAddChatModal.value = false;
  editingChat.value = null;
  newChat.value = {
    chat_id: "",
    name: "",
    silent_mode: false,
    service_message_cleanup: { ...DEFAULT_SERVICE_MESSAGE_CLEANUP },
  };
}

async function saveChat() {
  if (!editingChat.value) return;

  saving.value = true;
  try {
    const updatedChats = [...(bot.value.chats || [])];
    const index = updatedChats.findIndex(
      (c) => c.chat_id === editingChat.value.chat_id
    );
    if (index !== -1) {
      updatedChats[index] = {
        ...updatedChats[index],
        silent_mode: newChat.value.silent_mode,
        service_message_cleanup: newChat.value.service_message_cleanup,
      };
    }

    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: { chats: updatedChats },
    });

    if (resp?.data) {
      bot.value = resp.data;
    }

    closeChatModal();
  } catch (error) {
    console.error("Error saving chat:", error);
  } finally {
    saving.value = false;
  }
}

async function removeChat(chatId: number) {
  if (!confirm(t("common.confirm.removeChat"))) return;

  try {
    const updatedChats = bot.value.chats.filter(
      (c: any) => c.chat_id !== chatId
    );

    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: { chats: updatedChats },
    });

    if (resp?.data) {
      bot.value = resp.data;
    }
  } catch (error) {
    console.error("Error removing chat:", error);
  }
}

async function loadLogs() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/logs`);
    logs.value = resp?.data?.logs || [];
  } catch (error) {
    console.error("Error loading logs:", error);
  }
}

function getSilentModeClass(chat: any) {
  if (chat.silent_mode) {
    return "text-fg-muted";
  }
  return "text-fg";
}

function getSilentModeText(chat: any) {
  if (chat.silent_mode) {
    return t("bot.chats.silentModeValues.monitorOnly");
  }
  return t("bot.chats.silentModeValues.fullModeration");
}

async function loadTeam() {
  teamLoading.value = true;
  try {
    const membersResp = await $fetch<any>(`/api/bots/${botId}/team/members`);
    teamMembers.value = membersResp?.data?.members ?? [];

    if (isOwner.value) {
      const codeResp = await $fetch<any>(`/api/bots/${botId}/team/access-code`).catch(
        () => null
      );
      accessCode.value = codeResp?.data?.code ?? null;
    } else {
      accessCode.value = null;
    }
  } catch (error) {
    console.error("Error loading team:", error);
  } finally {
    teamLoading.value = false;
  }
}

async function copyAccessCode() {
  if (!accessCode.value) return;
  await navigator.clipboard.writeText(accessCode.value);
}

async function revokeAccessCode() {
  try {
    const resp = await $fetch<any>(`/api/bots/${botId}/team/access-code/revoke`, {
      method: "POST",
      body: {},
    });
    accessCode.value = resp?.data?.code ?? null;
  } catch (error) {
    console.error("Error revoking access code:", error);
  }
}

async function removeMember(userId: string) {
  try {
    await $fetch(`/api/bots/${botId}/team/members/${userId}`, {
      method: "DELETE",
    });
    await loadTeam();
  } catch (error) {
    console.error("Error removing member:", error);
  }
}

function openDeleteConfirm() {
  deleteError.value = "";
  deleteConfirmText.value = "";
  showDeleteConfirm.value = true;
}

function cancelDeleteConfirm() {
  showDeleteConfirm.value = false;
  deleteConfirmText.value = "";
  deleteError.value = "";
}

async function deleteBot() {
  if (!canConfirmDelete.value) return;

  deletingBot.value = true;
  deleteError.value = "";

  try {
    await $fetch(`/api/bots/${botId}`, { method: "DELETE" });
    await router.push("/bots");
  } catch (error: any) {
    deleteError.value =
      error?.data?.statusMessage ||
      error?.message ||
      t("common.errors.deleteBot");
  } finally {
    deletingBot.value = false;
  }
}

onMounted(async () => {
  await loadBot();
  await Promise.all([loadLogs(), loadStatistics(), loadTeam()]);
});
</script>
