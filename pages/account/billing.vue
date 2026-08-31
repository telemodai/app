<template>
  <div class="max-w-2xl">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('account.billing.title')"
      :subtitle="t('account.billing.subtitle')"
    />

    <UiAppAlert
      v-if="paymentNotice"
      class="mb-4"
      :variant="paymentNoticeAlertVariant"
    >
      {{ paymentNotice }}
    </UiAppAlert>

    <UiAppCard class="!p-6 mb-6">
      <div class="text-sm text-fg-muted">{{ t("account.billing.walletBalance") }}</div>
      <div class="tm-page-title text-accent mt-1">
        {{ balance.toLocaleString() }}
      </div>
      <p class="mt-2 text-sm text-fg-muted">
        {{ t("account.billing.walletHint") }}
      </p>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <UiAppButton
          variant="link"
          class="!px-0"
          :disabled="refreshing"
          @click="refreshWallet"
        >
          {{ refreshing ? t("common.loading") : t("common.refresh") }}
        </UiAppButton>
        <UiAppButton
          v-if="balance === 0"
          variant="primary"
          @click="scrollToPurchase"
        >
          {{ t("account.billing.buyCredits") }}
        </UiAppButton>
      </div>
    </UiAppCard>

    <section id="purchase" class="mb-8 scroll-mt-6">
      <h2 class="tm-section-title text-fg mb-4">
        {{ t("account.billing.purchaseTitle") }}
      </h2>

      <UiAppCard class="!p-4 mb-6">
        <label class="block text-sm font-medium text-fg mb-2" for="promo-code">
          {{ t("billing.promo.label") }}
        </label>
        <div class="flex flex-wrap gap-2">
          <UiAppInput
            id="promo-code"
            v-model="promoInput"
            class="flex-1 min-w-[10rem]"
            :placeholder="t('billing.promo.placeholder')"
            :disabled="applyingPromo"
            @keyup.enter="applyPromo"
          />
          <UiAppButton
            variant="ghost"
            :disabled="isPromoApplyDisabled"
            @click="applyPromo"
          >
            {{ applyingPromo ? t("common.loading") : t("billing.promo.apply") }}
          </UiAppButton>
        </div>
        <p v-if="appliedPromo?.valid" class="mt-2 text-sm text-fg">
          {{
            t("billing.promo.applied", {
              code: appliedPromo.code,
              percent: appliedPromo.discount_percent,
            })
          }}
        </p>
        <p v-if="promoError" class="mt-2 text-sm text-danger">{{ promoError }}</p>
      </UiAppCard>

      <div class="space-y-3">
        <UiAppCard
          v-for="pkg in packages"
          :key="pkg.id"
          class="!p-4 flex items-center justify-between gap-4"
        >
          <div>
            <div class="font-medium text-fg">{{ t(pkg.labelKey) }}</div>
            <div class="text-sm text-fg-muted">
              <template v-if="discountedPrice(pkg.id) !== pkg.amountRub">
                <span class="line-through text-fg-subtle mr-2">
                  {{ pkg.amountRub.toLocaleString() }} ₽
                </span>
                <span class="font-medium text-fg">
                  {{ discountedPrice(pkg.id).toLocaleString() }} ₽
                </span>
              </template>
              <template v-else>
                {{ pkg.amountRub.toLocaleString() }} ₽
              </template>
            </div>
          </div>
          <UiAppButton
            variant="primary"
            :disabled="checkoutPackageId === pkg.id"
            @click="startCheckout(pkg.id)"
          >
            {{
              checkoutPackageId === pkg.id
                ? t("billing.purchasing")
                : t("billing.purchase")
            }}
          </UiAppButton>
        </UiAppCard>
      </div>
    </section>

    <section>
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="tm-section-title text-fg">
          {{ t("account.billing.historyTitle") }}
        </h2>
        <UiAppButton
          variant="ghost"
          class="!text-xs"
          :disabled="loadingHistory"
          @click="loadTransactions"
        >
          {{ loadingHistory ? t("common.loading") : t("common.refresh") }}
        </UiAppButton>
      </div>

      <div v-if="loadingHistory" class="text-fg-muted text-sm">
        {{ t("common.loading") }}
      </div>
      <p v-else-if="transactions.length === 0" class="text-sm text-fg-muted">
        {{ t("account.billing.historyEmpty") }}
      </p>
      <div v-else class="space-y-2">
        <UiAppCard
          v-for="row in transactions"
          :key="row.id"
          class="!p-4 flex flex-wrap items-start justify-between gap-3"
        >
          <div class="min-w-0">
            <div class="font-medium text-fg">
              {{ transactionLabel(row) }}
            </div>
            <div class="text-sm text-fg-muted">
              {{ formatDate(row.created_at) }}
            </div>
          </div>
          <div class="text-right">
            <div
              class="font-medium tabular-nums"
              :class="row.amount >= 0 ? 'text-accent' : 'text-fg'"
            >
              {{ formatSignedAmount(row.amount) }}
            </div>
            <div class="text-xs text-fg-muted tabular-nums">
              {{ t("account.billing.balanceAfter", { balance: row.balance_after.toLocaleString() }) }}
            </div>
          </div>
        </UiAppCard>
      </div>
    </section>

    <UiAppAlert v-if="error" variant="danger" class="mt-4">
      {{ error }}
    </UiAppAlert>
  </div>
</template>

<script setup lang="ts">
import { CREDIT_PACKAGES, type CreditPackageId } from "@/lib/credit-packages";
import { readFetchError } from "@/lib/fetch-error";
import { resolvePromoApplyFetchError } from "@/lib/promo-validation-ui";
import type { CreditTransaction } from "@/server/database/models/credit-transaction";

const { t, locale } = useI18n();
const config = useRuntimeConfig();
const route = useRoute();

if (config.public.deploymentMode !== "saas") {
  await navigateTo("/");
}

const packages = Object.values(CREDIT_PACKAGES);

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("nav.dashboard"), to: "/" },
  { label: t("account.billing.breadcrumb") },
]);

usePageTitle(() => t("account.billing.documentTitle"));

type PaymentSyncStatus =
  | "applied"
  | "duplicate"
  | "pending"
  | "not_found"
  | "forbidden";

type PromoPackagePreview = {
  package_id: CreditPackageId;
  original_amount_rub: number;
  discounted_amount_rub: number;
  credits: number;
};

type AppliedPromo = {
  code: string;
  valid: true;
  discount_percent: number;
  packages: PromoPackagePreview[];
} | null;

const balance = ref(0);
const transactions = ref<CreditTransaction[]>([]);
const error = ref("");
const promoError = ref("");
const refreshing = ref(false);
const loadingHistory = ref(false);
const applyingPromo = ref(false);
const checkoutPackageId = ref<CreditPackageId | null>(null);
const paymentNotice = ref("");
const paymentNoticeTone = ref<"info" | "success" | "warning">("info");

type CurrentPromoPayload = {
  code: string;
  discount_percent: number;
  packages: PromoPackagePreview[];
};

const { data: currentPromoPayload } = await useAsyncData(
  "account-billing-current-promo",
  async () => {
    try {
      const response = await $fetch<{ data: CurrentPromoPayload | null }>(
        "/api/promo/current"
      );
      return response.data;
    } catch {
      return null;
    }
  }
);

const promoInput = ref(currentPromoPayload.value?.code ?? "");
const appliedPromo = ref<AppliedPromo>(
  currentPromoPayload.value
    ? {
        code: currentPromoPayload.value.code,
        valid: true,
        discount_percent: currentPromoPayload.value.discount_percent,
        packages: currentPromoPayload.value.packages,
      }
    : null
);

const isPromoApplyDisabled = computed(
  () => applyingPromo.value || promoInput.value.trim().length === 0
);

const discountedByPackage = computed(() => {
  const map = new Map<CreditPackageId, number>();
  if (appliedPromo.value?.valid) {
    for (const row of appliedPromo.value.packages) {
      map.set(row.package_id, row.discounted_amount_rub);
    }
  }
  return map;
});

function discountedPrice(packageId: CreditPackageId): number {
  return discountedByPackage.value.get(packageId) ?? CREDIT_PACKAGES[packageId].amountRub;
}

const paymentNoticeAlertVariant = computed(() => {
  if (paymentNoticeTone.value === "warning") {
    return "danger" as const;
  }
  return "neutral" as const;
});

function setPaymentNotice(message: string, tone: "info" | "success" | "warning") {
  paymentNotice.value = message;
  paymentNoticeTone.value = tone;
}

function noticeForSyncStatus(status: PaymentSyncStatus | null | undefined) {
  if (!status) {
    return;
  }
  if (status === "applied") {
    setPaymentNotice(t("billing.paymentApplied"), "success");
    return;
  }
  if (status === "duplicate") {
    setPaymentNotice(t("billing.paymentAlreadyApplied"), "success");
    return;
  }
  if (status === "pending") {
    setPaymentNotice(t("billing.paymentReturnPending"), "info");
    return;
  }
  if (status === "not_found" || status === "forbidden") {
    setPaymentNotice(t("billing.paymentSyncFailed"), "warning");
  }
}

function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString(locale.value === "ru" ? "ru-RU" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSignedAmount(amount: number) {
  const prefix = amount > 0 ? "+" : "";
  return `${prefix}${amount.toLocaleString()}`;
}

function botIdFromMetadata(row: CreditTransaction): string | undefined {
  const botId = row.metadata?.bot_id;
  return typeof botId === "string" && botId.length > 0 ? botId : row.bot_id ?? undefined;
}

function transactionLabel(row: CreditTransaction): string {
  const botId = botIdFromMetadata(row);
  switch (row.type) {
    case "purchase":
      return t("account.billing.transactionTypes.purchase");
    case "grant_signup":
      return t("account.billing.transactionTypes.grantSignup");
    case "referral_bonus":
      return t("account.billing.transactionTypes.referralBonus");
    case "allocate":
      return botId
        ? t("account.billing.transactionTypes.allocate", { bot: `@${botId}` })
        : t("account.billing.transactionTypes.allocateGeneric");
    case "reclaim":
      return botId
        ? t("account.billing.transactionTypes.reclaim", { bot: `@${botId}` })
        : t("account.billing.transactionTypes.reclaimGeneric");
    case "admin_adjust":
      return t("account.billing.transactionTypes.adminAdjust");
    default:
      return row.type;
  }
}

function scrollToPurchase() {
  document.getElementById("purchase")?.scrollIntoView({ behavior: "smooth" });
}

async function applyPromo() {
  const code = promoInput.value.trim();
  if (!code) {
    return;
  }

  applyingPromo.value = true;
  promoError.value = "";
  try {
    const response = await $fetch<{
      data: CurrentPromoPayload;
    }>("/api/promo/apply", {
      method: "POST",
      body: { code },
    });

    currentPromoPayload.value = response.data;
    appliedPromo.value = {
      code: response.data.code,
      valid: true,
      discount_percent: response.data.discount_percent,
      packages: response.data.packages,
    };
    promoInput.value = response.data.code;
  } catch (e: unknown) {
    appliedPromo.value = null;
    currentPromoPayload.value = null;
    promoError.value = resolvePromoApplyFetchError(e, t);
  } finally {
    applyingPromo.value = false;
  }
}

async function refreshPromoState() {
  await refreshNuxtData("account-billing-current-promo");
  const payload = currentPromoPayload.value;
  if (payload) {
    appliedPromo.value = {
      code: payload.code,
      valid: true,
      discount_percent: payload.discount_percent,
      packages: payload.packages,
    };
    promoInput.value = payload.code;
  } else {
    appliedPromo.value = null;
    promoInput.value = "";
  }
}

async function syncOpenPayments(
  paymentId?: string
): Promise<PaymentSyncStatus | undefined> {
  const response = await $fetch<{
    data: { sync_status?: PaymentSyncStatus; balance: number };
  }>("/api/account/credits/sync", {
    method: "POST",
    body: paymentId ? { payment_id: paymentId } : {},
  });

  balance.value = response.data.balance;
  return response.data.sync_status;
}

async function loadWalletBalance() {
  const response = await $fetch<{ data: { balance: number } }>(
    "/api/account/wallet"
  );
  balance.value = response.data.balance;
}

async function loadTransactions() {
  loadingHistory.value = true;
  try {
    const response = await $fetch<{
      data: { transactions: CreditTransaction[] };
    }>("/api/account/credits/transactions");
    transactions.value = response.data.transactions;
  } catch (e: unknown) {
    error.value = readFetchError(e, t("common.unknown"));
  } finally {
    loadingHistory.value = false;
  }
}

async function refreshWallet() {
  refreshing.value = true;
  error.value = "";
  try {
    const syncStatus = await syncOpenPayments();
    noticeForSyncStatus(syncStatus);
    await loadTransactions();
    await refreshPromoState();
  } catch (e: unknown) {
    error.value = readFetchError(e, t("common.unknown"));
  } finally {
    refreshing.value = false;
  }
}

async function startCheckout(packageId: CreditPackageId) {
  checkoutPackageId.value = packageId;
  error.value = "";
  try {
    const response = await $fetch<{
      data: { checkout_url: string; provider_payment_id: string };
    }>("/api/account/credits/checkout", {
      method: "POST",
      body: { package_id: packageId },
    });
    window.location.href = response.data.checkout_url;
  } catch (e: unknown) {
    error.value = readFetchError(e, t("common.unknown"));
    checkoutPackageId.value = null;
  }
}

let pollTimer: ReturnType<typeof setInterval> | undefined;

onMounted(async () => {
  await loadTransactions();

  const queryPaymentId = route.query.payment_id;
  const recoveryPaymentId =
    typeof queryPaymentId === "string" ? queryPaymentId.trim() : "";

  try {
    const syncStatus = recoveryPaymentId
      ? await syncOpenPayments(recoveryPaymentId)
      : await syncOpenPayments();
    noticeForSyncStatus(syncStatus);
    if (syncStatus === "applied" || syncStatus === "duplicate") {
      await loadTransactions();
      await refreshPromoState();
    }
  } catch (e: unknown) {
    try {
      await loadWalletBalance();
    } catch {
      error.value = readFetchError(e, t("common.unknown"));
    }
  }

  const shouldPoll = route.query.payment === "return";
  if (!shouldPoll) {
    return;
  }

  if (!paymentNotice.value) {
    setPaymentNotice(t("billing.paymentReturnPending"), "info");
  }

  pollTimer = setInterval(async () => {
    try {
      const syncStatus = await syncOpenPayments();
      if (syncStatus === "applied" || syncStatus === "duplicate") {
        noticeForSyncStatus(syncStatus);
        await loadTransactions();
        await refreshPromoState();
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = undefined;
        }
        return;
      }
      if (syncStatus === "pending") {
        setPaymentNotice(t("billing.paymentReturnPending"), "info");
      }
    } catch {
      // Keep polling; user can hit Refresh for explicit error.
    }
  }, 3000);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
});
</script>
