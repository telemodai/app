<template>
  <div>
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="bot?.name ?? t('page.botDetail.titleFallback')"
    >
      <template #title-extra>
        <!-- Live LED after bot name: pulse green when active, dim grey when off -->
        <span
          v-if="bot"
          class="size-2.5 shrink-0 self-center rounded-full"
          :class="
            bot.is_active
              ? 'bg-action-unban shadow-[0_0_0_3px] shadow-action-unban/25 animate-pulse'
              : 'bg-fg-subtle/40'
          "
          :aria-label="bot.is_active ? t('bot.active') : t('bot.inactive')"
          role="status"
        />
      </template>
      <template v-if="bot" #subtitle>
        <a
          :href="telegramBotWebUrl(bot.id)"
          target="_blank"
          rel="noopener noreferrer"
          class="text-accent hover:underline"
          :aria-label="t('bot.openInTelegram', { id: bot.id })"
        >
          @{{ bot.id }}
        </a>
      </template>
      <template #actions>
        <UiAppSwitch
          :model-value="Boolean(bot?.is_active)"
          :disabled="!bot || statusToggling"
          :aria-label="
            bot?.is_active ? t('common.disable') : t('common.enable')
          "
          @update:model-value="onBotActiveChange"
        />
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
            class="tm-tab"
            :class="{ 'tm-tab--active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <template v-if="activeTab === 'overview'">
          <div class="flex flex-wrap items-center gap-2">
            <UiAppBadge :variant="overviewStatusBadgeVariant">
              {{ aggregatedStatusText }}
            </UiAppBadge>
            <UiAppBadge v-if="bot.my_role">
              {{ roleLabel(bot.my_role) }}
            </UiAppBadge>
            <UiAppBadge variant="muted" class="normal-case tracking-normal">
              {{ t("bot.created", { date: formatDate(bot.created_at) }) }}
            </UiAppBadge>
            <template v-if="isSaas">
              <UiAppBadge variant="accent">
                {{ t("billing.balance") }}: {{ formatLocaleNumber(bot.credit_balance ?? 0, locale) }}
              </UiAppBadge>
              <UiAppButton
                v-if="isOwner"
                variant="link"
                class="!px-2.5 !py-1.5 !text-xs uppercase tracking-wide"
                @click="openAllocateModal"
              >
                {{ t("bot.credits.topUp") }}
              </UiAppButton>
            </template>
            <p
              v-if="deliveryProblemMessage"
              class="w-full text-sm text-danger"
            >
              {{ deliveryProblemMessage }}
            </p>
          </div>

          <!-- Chats -->
          <UiAppCard class="!p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="tm-section-title text-fg">
                {{ t("bot.chats.title") }}
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
                class="rounded-card border border-line p-4"
              >
                <!--
                  Mobile: stack identity → meta → actions.
                  Desktop: identity+meta left, actions right on one row.
                -->
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div class="flex min-w-0 flex-1 gap-3">
                    <img
                      v-if="chat.id && chat.photo_file_id"
                      :src="chatPhotoUrl(chat.id)"
                      :alt="chat.name"
                      class="size-10 shrink-0 rounded-full object-cover bg-surface-3"
                    />
                    <div
                      v-else
                      class="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm text-fg-muted"
                    >
                      {{ t("bot.chats.placeholderInitials") }}
                    </div>

                    <div class="min-w-0 flex-1 space-y-1.5">
                      <div class="min-w-0 text-base font-medium leading-snug text-fg break-words">
                        {{ chat.name }}
                      </div>
                      <BotsChatTelegramIdLink
                        class="max-w-full"
                        :chat-id="chat.chat_id"
                      />
                      <p class="text-xs leading-relaxed text-fg-muted">
                        <span class="whitespace-nowrap">
                          {{ t("bot.chats.rules", { count: chat.rules_count || 0 }) }}
                        </span>
                        <span class="text-fg-subtle"> · </span>
                        <span>
                          {{ t("bot.chats.silentMode") }}
                          <span :class="getSilentModeClass(chat)">
                            {{ getSilentModeText(chat) }}
                          </span>
                        </span>
                      </p>
                      <div class="flex flex-wrap items-center gap-2">
                        <UiAppBadge :variant="chatHealthBadgeVariant(chat)">
                          {{ chatHealthLabel(chat) }}
                        </UiAppBadge>
                        <p
                          v-if="chat.health_message && chat.health_status !== 'ok'"
                          class="text-sm normal-case tracking-normal text-danger"
                        >
                          {{ chat.health_message }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    class="flex shrink-0 items-center justify-between gap-2 border-t border-line pt-3 sm:justify-start sm:gap-0.5 sm:border-0 sm:pt-0"
                  >
                    <UiAppButton
                      variant="link"
                      class="min-w-0"
                      :to="`/bots/${botId}/chats/${chat.chat_id}/moderation`"
                    >
                      <Shield :size="16" :stroke-width="2" aria-hidden="true" />
                      {{ t("bot.chats.moderation") }}
                    </UiAppButton>
                    <div class="flex items-center gap-0.5">
                      <UiAppButton
                        variant="link"
                        class="!px-2"
                        :aria-label="t('common.edit')"
                        @click="editChat(chat)"
                      >
                        <Pencil :size="16" :stroke-width="2" aria-hidden="true" />
                      </UiAppButton>
                      <UiAppButton
                        variant="link"
                        class="!px-2 !text-danger hover:!text-fg"
                        :aria-label="t('common.remove')"
                        @click="removeChat(chat.chat_id)"
                      >
                        <Trash2 :size="16" :stroke-width="2" aria-hidden="true" />
                      </UiAppButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="tm-empty-state">{{ t("bot.chats.noChats") }}</div>
          </UiAppCard>

          <!-- Statistics -->
          <UiAppCard class="!p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="tm-section-title text-fg">
                {{ t("bot.statistics.title") }}
              </h3>
              <UiAppButton variant="ghost" @click="loadStatistics">
                {{ t("common.refresh") }}
              </UiAppButton>
            </div>
            <div class="grid grid-cols-1 gap-6 py-5 md:grid-cols-3">
              <div class="text-center">
                <div class="mb-1 tm-stat text-accent">
                  {{ statistics?.today?.messages_processed || 0 }}
                </div>
                <div class="text-xs text-fg-muted">{{ t("bot.statistics.messagesToday") }}</div>
              </div>
              <div class="text-center">
                <div class="mb-1 tm-stat text-action-warning">
                  {{ statistics?.today?.warnings_issued || 0 }}
                </div>
                <div class="text-xs text-fg-muted">{{ t("bot.statistics.warningsToday") }}</div>
              </div>
              <div class="text-center">
                <div class="mb-1 tm-stat text-danger">
                  {{ statistics?.users?.banned_count || 0 }}
                </div>
                <div class="text-xs text-fg-muted">{{ t("bot.statistics.bannedTotal") }}</div>
              </div>
              <div
                v-if="isSaas && (statistics?.today?.not_moderated || 0) > 0"
                class="text-center md:col-span-3"
              >
                <UiAppAlert class="!p-4">
                  <div class="tm-stat text-action-warning">
                    {{ statistics?.today?.not_moderated || 0 }}
                  </div>
                  <div class="text-sm font-medium text-fg">
                    {{ t("bot.statistics.notModeratedToday") }}
                  </div>
                  <p class="text-xs text-fg-muted mt-1">
                    {{ t("bot.statistics.notModeratedHint") }}
                  </p>
                </UiAppAlert>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-surface-3 rounded-card p-4">
                <h4 class="text-sm font-medium text-fg mb-2">{{ t("bot.statistics.thisWeek") }}</h4>
                <div class="tm-detail-rows">
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
                <h4 class="text-sm font-medium text-fg mb-2">{{ t("bot.statistics.usersSection") }}</h4>
                <div class="tm-detail-rows">
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
              <h3 class="tm-section-title text-fg">
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
                class="border border-line rounded-card p-2 text-sm"
              >
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <span :class="logActionClass(log.action_type)">
                      {{ logActionLabel(log.action_type) }}
                    </span>
                    <span class="text-fg-muted"> - {{ log.message }}</span>
                  </div>
                  <div class="text-sm text-fg-muted shrink-0">
                    {{ formatDate(log.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="tm-empty-state">
              {{ t("bot.recentActivity.empty") }}
            </div>
          </UiAppCard>

          <UiAppCard
            v-if="isOwner"
            class="!p-6 border-danger"
          >
            <h3 class="tm-section-title text-danger mb-2">
              {{ t("bot.dangerZone.title") }}
            </h3>
            <p class="text-sm text-fg-muted mb-4">
              {{ t("bot.dangerZone.description") }}
            </p>

            <div v-if="!showDeleteConfirm" class="flex">
              <UiAppButton variant="destructive" @click="openDeleteConfirm">
                {{ t("bot.dangerZone.deleteButton") }}
              </UiAppButton>
            </div>

            <div v-else class="space-y-3 max-w-md">
              <p class="text-sm text-fg">
                {{ t("bot.dangerZone.confirmHint", { botId: bot.id }) }}
              </p>
              <p
                v-if="isSaas && (bot.credit_balance ?? 0) > 0"
                class="text-sm text-fg-muted"
              >
                {{
                  t("bot.dangerZone.creditReclaimHint", {
                    credits: formatLocaleNumber(bot.credit_balance ?? 0, locale),
                  })
                }}
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
            <h3 class="tm-section-title text-fg">
              {{ t("bot.messageTemplates.title") }}
            </h3>
            <UiAppButton variant="link" @click="showHtmlHelpModal = true">
              {{ t("bot.messageTemplates.helpLink") }}
            </UiAppButton>
          </div>
          <p class="text-sm text-fg-muted mb-4">
            {{ t("bot.messageTemplates.description") }}
          </p>

          <div class="flex gap-2 mb-4 border-b border-line">
            <button
              type="button"
              class="tm-tab"
              :class="{ 'tm-tab--active': messageTemplateTab === 'warning' }"
              @click="messageTemplateTab = 'warning'"
            >
              {{ t("bot.messageTemplates.warningTab") }}
            </button>
            <button
              type="button"
              class="tm-tab"
              :class="{ 'tm-tab--active': messageTemplateTab === 'ban' }"
              @click="messageTemplateTab = 'ban'"
            >
              {{ t("bot.messageTemplates.banTab") }}
            </button>
          </div>

          <div class="mb-3 flex flex-wrap gap-1.5">
            <button
              v-for="chip in activeTemplateChips"
              :key="chip.key"
              type="button"
              class="tm-chip"
              :title="t(chip.hintKey)"
              @click="insertTemplatePlaceholder(chip.key)"
            >
              {{ t(chip.labelKey) }}
            </button>
          </div>

          <UiAppTextarea
            ref="templateTextareaComponentRef"
            v-model="activeTemplateDraft"
            :rows="8"
          />

          <UiAppAlert v-if="templateSaveError" variant="danger" class="mt-2">
            {{ templateSaveError }}
          </UiAppAlert>
          <p v-if="templateSaveSuccess" class="text-sm text-fg mt-2">
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
          <h3 class="tm-section-title text-fg mb-4">
            {{ t("bot.team.title") }}
          </h3>
          <div v-if="teamLoading" class="text-fg-muted text-sm">
            {{ t("bot.team.loading") }}
          </div>
          <div v-else class="space-y-4">
            <div v-if="isOwner && accessCode" class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <div class="text-sm text-fg">
                  {{ t("bot.team.accessCode") }}
                  <code class="rounded-control bg-surface-3 px-2 py-1 font-mono text-sm">
                    {{ accessCode }}
                  </code>
                </div>
                <div class="flex shrink-0 items-center gap-0.5">
                  <UiAppButton
                    variant="link"
                    class="!px-2"
                    :aria-label="t('common.copy')"
                    @click="copyAccessCode"
                  >
                    <Copy :size="16" :stroke-width="2" aria-hidden="true" />
                  </UiAppButton>
                  <UiAppButton
                    variant="link"
                    class="!px-2 !text-danger hover:!text-fg"
                    :aria-label="t('common.revoke')"
                    @click="revokeAccessCode"
                  >
                    <RefreshCw :size="16" :stroke-width="2" aria-hidden="true" />
                  </UiAppButton>
                </div>
              </div>
              <p
                v-if="accessCodeCopied"
                class="text-xs text-action-unban"
                role="status"
              >
                {{ t("bot.team.accessCodeCopied") }}
              </p>
            </div>
            <p v-else-if="isOwner" class="text-sm text-fg-muted">
              {{ t("bot.team.accessCodeForOperators") }}
            </p>
            <p v-else class="text-sm text-fg-muted">
              {{ t("bot.team.ownerManagesTeam") }}
            </p>

            <div v-if="teamMembers.length" class="space-y-2">
              <h4 class="text-sm font-medium text-fg">{{ t("bot.team.members") }}</h4>
              <div
                v-for="member in teamMembers"
                :key="member.user_id"
                class="flex items-center justify-between text-sm border border-line rounded-card px-3 py-2"
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
      size="sm"
      title-id="add-chat-activation-title"
      @close="closeAddChatActivationModal"
    >
      <div>
        <h3
          id="add-chat-activation-title"
          class="tm-modal-title mb-2"
        >
          {{ t("chatActivation.modal.title") }}
        </h3>
        <p class="mb-5 text-sm leading-snug text-fg-muted">
          {{ t("chatActivation.modal.intro") }}
        </p>

        <ul class="tm-bullet-list">
          <li v-for="(item, index) in activationPrerequisites" :key="index">
            {{ rt(item) }}
          </li>
        </ul>

        <div class="space-y-2.5">
          <UiAppButton
            variant="primary"
            class="w-full !h-auto !justify-start px-4 py-3.5"
            @click="startChatActivation('new_group')"
          >
            <span class="min-w-0 flex-1 text-left">
              <span class="block font-medium leading-snug">
                {{ t("chatActivation.modal.newGroupTitle") }}
              </span>
              <span
                class="mt-1 block text-xs font-normal leading-snug text-accent-on/75 normal-case tracking-normal"
              >
                {{ t("chatActivation.modal.newGroupHint") }}
              </span>
            </span>
          </UiAppButton>
          <UiAppButton
            variant="ghost"
            class="w-full !h-auto !justify-start !border-0 !bg-surface-3 px-4 py-3.5 hover:!border-0 hover:!bg-surface-3/90"
            @click="startChatActivation('existing_group')"
          >
            <span class="min-w-0 flex-1 text-left">
              <span class="block font-medium leading-snug">
                {{ t("chatActivation.modal.existingGroupTitle") }}
              </span>
              <span
                class="mt-1 block text-xs font-normal leading-snug text-fg-muted normal-case tracking-normal"
              >
                {{ t("chatActivation.modal.existingGroupHint") }}
              </span>
            </span>
          </UiAppButton>
        </div>

        <UiAppButton
          variant="link"
          class="mt-4 w-full justify-center !py-1 font-normal text-fg-muted"
          @click="closeAddChatActivationModal"
        >
          {{ t("common.cancel") }}
        </UiAppButton>
      </div>
    </UiAppModal>

    <UiAppModal
      :open="showAllocateModal"
      size="sm"
      title-id="allocate-credits-title"
      @close="closeAllocateModal"
    >
      <div>
        <h3 id="allocate-credits-title" class="tm-modal-title mb-2">
          {{ t("bot.credits.allocateTitle") }}
        </h3>
        <p class="mb-4 text-sm text-fg-muted">
          {{ t("bot.credits.allocateHelper") }}
        </p>
        <p v-if="walletBalance !== null" class="mb-4 text-sm text-fg">
          {{ t("bot.credits.walletBalance", { balance: formatLocaleNumber(walletBalance, locale) }) }}
        </p>
        <UiAppAlert
          v-if="walletBalance === 0"
          variant="neutral"
          class="mb-4"
        >
          <p>{{ t("bot.credits.emptyWallet") }}</p>
          <UiAppButton
            variant="link"
            class="mt-2 !px-0"
            to="/account/billing"
            @click="closeAllocateModal"
          >
            {{ t("bot.credits.buyCredits") }}
          </UiAppButton>
        </UiAppAlert>
        <form class="space-y-4" @submit.prevent="submitAllocate">
          <div>
            <label class="block text-sm font-medium text-fg mb-2" for="allocate-amount">
              {{ t("bot.credits.allocateAmount") }}
            </label>
            <UiAppInput
              id="allocate-amount"
              v-model="allocateAmountInput"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              :placeholder="t('bot.credits.allocatePlaceholder')"
              :disabled="allocating"
            />
          </div>
          <UiAppAlert v-if="allocateError" variant="danger">
            {{ allocateError }}
          </UiAppAlert>
          <UiAppAlert v-if="allocateSuccess" variant="neutral">
            {{ allocateSuccess }}
          </UiAppAlert>
          <div class="flex gap-2">
            <UiAppButton
              type="submit"
              variant="primary"
              :disabled="allocating || !canSubmitAllocate"
            >
              {{
                allocating
                  ? t("bot.credits.allocating")
                  : t("bot.credits.allocateSubmit")
              }}
            </UiAppButton>
            <UiAppButton
              type="button"
              variant="ghost"
              :disabled="allocating"
              @click="closeAllocateModal"
            >
              {{ t("common.cancel") }}
            </UiAppButton>
          </div>
        </form>
      </div>
    </UiAppModal>

    <!-- Modal for chat silent mode -->
    <UiAppModal
      :open="showAddChatModal && editingChat"
      size="sm"
      title-id="edit-chat-modal-title"
      @close="closeChatModal"
    >
      <div>
        <h3
          id="edit-chat-modal-title"
          class="tm-modal-title mb-4"
        >
          {{ t("bot.chats.editModal.title") }}
        </h3>

        <form @submit.prevent="saveChat" class="space-y-4">
          <div class="text-sm text-fg-muted">
            <div class="font-medium text-fg">{{ editingChat?.name }}</div>
            <div class="mt-1">
              <BotsChatTelegramIdLink
                v-if="editingChat"
                :chat-id="editingChat.chat_id"
              />
            </div>
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
                <span class="text-sm font-medium text-fg">
                  {{ t("bot.chats.editModal.enableSilentMode") }}
                </span>
              </label>
            </div>

            <div class="tm-hint-block">
              <p class="tm-hint-block__title">{{ t("bot.chats.editModal.silentModeHelpTitle") }}</p>
              <p class="tm-hint-block__body">• {{ t("bot.chats.editModal.silentModeEnabled") }}</p>
              <p class="tm-hint-block__body">• {{ t("bot.chats.editModal.silentModeDisabled") }}</p>
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
                <span class="text-sm font-medium text-fg">
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
                  <span class="text-sm text-fg">
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
                  <span class="text-sm text-fg">
                    {{ t("bot.chats.editModal.serviceMessageMemberLeft") }}
                  </span>
                </label>
              </div>
            </div>

            <div class="tm-hint-block">
              <p class="tm-hint-block__title">{{ t("bot.chats.editModal.serviceMessagesHelpTitle") }}</p>
              <p class="tm-hint-block__body">{{ t("bot.chats.editModal.serviceMessagesHelp") }}</p>
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
import { Copy, Pencil, RefreshCw, Shield, Trash2 } from "lucide-vue-next";
import {
  BAN_TEMPLATE_PLACEHOLDERS,
  DEFAULT_BAN_TEMPLATE_PREVIEW,
  DEFAULT_WARNING_TEMPLATE_PREVIEW,
  WARNING_TEMPLATE_PLACEHOLDERS,
} from "@/lib/bot-message-template-ui";
import { telegramBotWebUrl } from "@/lib/telegram-bot-url";
import { readFetchError } from "@/lib/fetch-error";
import { formatLocaleNumber } from "@/lib/locale-format";
import type { ChatActivationStartMode } from "@/composables/useChatActivationWait";
import type { BotMemberRole } from "@/types/bot";
import {
  DEFAULT_SERVICE_MESSAGE_CLEANUP,
  type ServiceMessageKindId,
} from "@/lib/service-message-cleanup";

const { t, tm, rt, locale } = useI18n();
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
const accessCodeCopied = ref(false);
const teamMembers = ref<any[]>([]);
const teamLoading = ref(false);
const statusError = ref("");
const statusToggling = ref(false);
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
const showAllocateModal = ref(false);
const allocateAmountInput = ref("");
const allocateError = ref("");
const allocateSuccess = ref("");
const allocating = ref(false);
const walletBalance = ref<number | null>(null);
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

const overviewStatusBadgeVariant = computed(() => {
  const status = bot.value?.delivery_status;
  if (status === "healthy") {
    return "success" as const;
  }
  if (status === "disabled") {
    return "muted" as const;
  }
  return "danger" as const;
});

const canManageBot = computed(
  () => bot.value?.my_role === "owner" || bot.value?.my_role === "manager"
);

const isOwner = computed(() => bot.value?.my_role === "owner");

const canSubmitAllocate = computed(() => {
  const amount = Number(allocateAmountInput.value);
  return Number.isInteger(amount) && amount > 0;
});

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
    if (isSaas.value && bot.value) {
      await refreshBotCreditBalance();
    }
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

async function refreshBotCreditBalance() {
  try {
    const response = await $fetch<{ data: { balance: number } }>(
      `/api/bots/${botId}/credits/balance`
    );
    if (bot.value) {
      bot.value.credit_balance = response.data.balance;
    }
  } catch {
    // Non-blocking — overview still shows last known balance from bot payload.
  }
}

async function loadWalletBalance() {
  try {
    const response = await $fetch<{ data: { balance: number } }>(
      "/api/account/wallet"
    );
    walletBalance.value = response.data.balance;
  } catch {
    walletBalance.value = null;
  }
}

function openAllocateModal() {
  allocateAmountInput.value = "";
  allocateError.value = "";
  allocateSuccess.value = "";
  showAllocateModal.value = true;
  void loadWalletBalance();
}

function closeAllocateModal() {
  showAllocateModal.value = false;
  allocateAmountInput.value = "";
  allocateError.value = "";
  allocateSuccess.value = "";
}

async function submitAllocate() {
  const amount = Number(allocateAmountInput.value);
  if (!Number.isInteger(amount) || amount <= 0) {
    return;
  }

  allocating.value = true;
  allocateError.value = "";
  allocateSuccess.value = "";

  try {
    const response = await $fetch<{
      data: { bot_balance: number; wallet_balance: number };
    }>(`/api/bots/${botId}/credits/allocate`, {
      method: "POST",
      body: { amount },
    });

    if (bot.value) {
      bot.value.credit_balance = response.data.bot_balance;
    }
    walletBalance.value = response.data.wallet_balance;
    allocateSuccess.value = t("bot.credits.allocateSuccess", {
      amount: formatLocaleNumber(amount, locale.value),
    });
    allocateAmountInput.value = "";
  } catch (error: unknown) {
    const message = readFetchError(error, t("common.unknown"));
    allocateError.value = message;
    if (message.toLowerCase().includes("insufficient")) {
      allocateError.value = t("bot.credits.insufficientWallet");
    }
  } finally {
    allocating.value = false;
  }
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

function chatHealthBadgeVariant(chat: any) {
  if (chat.health_status === "ok") return "success" as const;
  if (chat.health_status === "degraded") return "warning" as const;
  if (chat.health_status === "unhealthy") return "danger" as const;
  return "muted" as const;
}

async function onBotActiveChange(nextActive: boolean) {
  if (!bot.value || statusToggling.value) return;
  if (nextActive === bot.value.is_active) return;

  statusError.value = "";
  statusToggling.value = true;

  try {
    const resp = await $fetch<any>(`/api/bots/${botId}`, {
      method: "PUT",
      body: { is_active: nextActive },
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
  } finally {
    statusToggling.value = false;
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
  try {
    await navigator.clipboard.writeText(accessCode.value);
    accessCodeCopied.value = true;
    setTimeout(() => {
      accessCodeCopied.value = false;
    }, 2000);
  } catch {
    accessCodeCopied.value = false;
  }
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
