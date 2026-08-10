<template>
  <div class="max-w-2xl">
    <LayoutPageHeader
      :breadcrumbs="breadcrumbs"
      :back-to="backTo"
      :title="t('page.botCredits.title')"
      :subtitle="t('page.botCredits.subtitle')"
    />

    <UiAppAlert
      v-if="paymentNotice"
      class="mb-4"
      :variant="paymentNoticeAlertVariant"
    >
      {{ paymentNotice }}
    </UiAppAlert>

    <UiAppCard class="!p-6 mb-6">
      <div class="text-base text-fg-muted">{{ t("billing.balance") }}</div>
      <div class="tm-page-title text-accent mt-1">
        {{ balance.toLocaleString() }}
      </div>
      <UiAppButton
        variant="link"
        class="mt-3 !px-0"
        :disabled="refreshing"
        @click="refreshBalance"
      >
        {{ refreshing ? t("common.loading") : t("common.refresh") }}
      </UiAppButton>
    </UiAppCard>

    <UiAppCard class="!p-4 mb-6">
      <label class="block text-base font-medium text-fg mb-2" for="promo-code">
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
          :disabled="applyingPromo || !promoInput.trim()"
          @click="applyPromo"
        >
          {{ applyingPromo ? t("common.loading") : t("billing.promo.apply") }}
        </UiAppButton>
      </div>
      <p v-if="appliedPromo?.valid" class="mt-2 text-base text-fg">
        {{
          t("billing.promo.applied", {
            code: appliedPromo.code,
            percent: appliedPromo.discount_percent,
          })
        }}
      </p>
      <p v-if="promoError" class="mt-2 text-base text-danger">{{ promoError }}</p>
    </UiAppCard>

    <div class="space-y-3">
      <UiAppCard
        v-for="pkg in packages"
        :key="pkg.id"
        class="!p-4 flex items-center justify-between gap-4"
      >
        <div>
          <div class="font-medium text-fg">{{ t(pkg.labelKey) }}</div>
          <div class="text-base text-fg-muted">
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

    <UiAppAlert v-if="error" variant="danger" class="mt-4">
      {{ error }}
    </UiAppAlert>
  </div>
</template>

<script setup lang="ts">
import { CREDIT_PACKAGES, type CreditPackageId } from "@/lib/credit-packages";
import { readFetchError } from "@/lib/fetch-error";
import {
  resolvePromoApplyFetchError,
} from "@/lib/promo-validation-ui";

const { t } = useI18n();
const config = useRuntimeConfig();
const route = useRoute();
const botId = route.params.id as string;

if (config.public.deploymentMode !== "saas") {
  await navigateTo(`/bots/${botId}`);
}

const packages = Object.values(CREDIT_PACKAGES);

const { breadcrumbs, backTo } = usePageBreadcrumbs(() => [
  { label: t("nav.bots"), to: "/bots" },
  { label: `@${botId}`, to: `/bots/${botId}` },
  { label: t("page.botCredits.breadcrumb") },
]);

usePageTitle(() => t("page.botCredits.documentTitle"));

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
const error = ref("");
const promoError = ref("");
const refreshing = ref(false);
const applyingPromo = ref(false);
const checkoutPackageId = ref<CreditPackageId | null>(null);
const paymentNotice = ref("");
const paymentNoticeTone = ref<"info" | "success" | "warning">("info");
const promoInput = ref("");
const appliedPromo = ref<AppliedPromo>(null);

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

async function loadCurrentPromo() {
  try {
    const response = await $fetch<{
      data: {
        code: string;
        discount_percent: number;
        packages: PromoPackagePreview[];
      } | null;
    }>("/api/promo/current");

    if (!response.data) {
      appliedPromo.value = null;
      return;
    }

    appliedPromo.value = {
      code: response.data.code,
      valid: true,
      discount_percent: response.data.discount_percent,
      packages: response.data.packages,
    };
    promoInput.value = response.data.code;
  } catch {
    // Non-blocking — user can still purchase at list price.
  }
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
      data: {
        code: string;
        discount_percent: number;
        packages: PromoPackagePreview[];
      };
    }>("/api/promo/apply", {
      method: "POST",
      body: { code },
    });

    appliedPromo.value = {
      code: response.data.code,
      valid: true,
      discount_percent: response.data.discount_percent,
      packages: response.data.packages,
    };
  } catch (e: unknown) {
    appliedPromo.value = null;
    promoError.value = resolvePromoApplyFetchError(e, t);
  } finally {
    applyingPromo.value = false;
  }
}

async function syncOpenPayments(
  paymentId?: string
): Promise<PaymentSyncStatus | undefined> {
  const response = await $fetch<{
    data: { sync_status?: PaymentSyncStatus; balance: number };
  }>(`/api/bots/${botId}/credits/sync`, {
    method: "POST",
    body: paymentId ? { payment_id: paymentId } : {},
  });

  balance.value = response.data.balance;
  return response.data.sync_status;
}

async function refreshBalance() {
  refreshing.value = true;
  error.value = "";
  try {
    const syncStatus = await syncOpenPayments();
    noticeForSyncStatus(syncStatus);
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
    }>(`/api/bots/${botId}/credits/checkout`, {
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
  await loadCurrentPromo();

  const queryPaymentId = route.query.payment_id;
  const recoveryPaymentId =
    typeof queryPaymentId === "string" ? queryPaymentId.trim() : "";

  try {
    const syncStatus = recoveryPaymentId
      ? await syncOpenPayments(recoveryPaymentId)
      : await syncOpenPayments();
    noticeForSyncStatus(syncStatus);
  } catch (e: unknown) {
    error.value = readFetchError(e, t("common.unknown"));
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
