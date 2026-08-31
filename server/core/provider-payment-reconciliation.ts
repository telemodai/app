import type { BillingWebhookEvent } from "./billing-provider";
import type { ProviderPayment } from "@/server/database/models/provider-payment";
import type { ProviderPaymentStatus } from "@/server/database/models/provider-payment";
import { ProviderPaymentRepository } from "@/server/database/repositories/provider-payment-repository";
import { PromoRedemptionRepository } from "@/server/database/repositories/promo-code-repository";
import { ReferralService } from "./referral-service";
import { applyCreditPurchaseFromBillingEvent } from "./apply-credit-purchase";
import type { PaymentSyncStatus } from "./payment-sync";
import { logger } from "./logger";

export function mapBillingEventToProviderStatus(
  event: BillingWebhookEvent
): ProviderPaymentStatus {
  if (event.status === "paid") {
    return "succeeded";
  }
  if (event.status === "pending") {
    return "pending";
  }
  if (event.status === "refunded" || event.status === "failed") {
    return "canceled";
  }
  return "pending";
}

export type ReconcileProviderPaymentDeps = {
  providerPayments?: ProviderPaymentRepository;
  promoRedemptions?: PromoRedemptionRepository;
} & Parameters<typeof applyCreditPurchaseFromBillingEvent>[1];

async function applyReferralRewardsForPaymentRow(
  row: ProviderPayment
): Promise<void> {
  if (!row.referral_code?.trim()) {
    return;
  }

  const referralResult = await new ReferralService().processPaidPurchase({
    providerPaymentId: row.provider_payment_id,
    refereeUserId: row.purchaser_user_id,
    baseCredits: row.credits,
    referralCodeFromCheckout: row.referral_code,
  });

  if (referralResult.status === "applied") {
    logger.info(
      {
        paymentId: row.provider_payment_id,
        referralId: referralResult.referral_id,
      },
      "Referral rewards applied for first purchase"
    );
    return;
  }

  if (referralResult.status === "skipped") {
    logger.info(
      {
        paymentId: row.provider_payment_id,
        reason: referralResult.reason,
      },
      "Referral rewards skipped"
    );
  }
}

/** Idempotent backfill for credited payments that failed referral insert (wallet v2). */
export async function backfillMissingReferralRewardsForUser(
  userId: string,
  deps: ReconcileProviderPaymentDeps = {}
): Promise<number> {
  const repo = deps.providerPayments ?? new ProviderPaymentRepository();
  const rows = await repo.findCreditedMissingReferralByUserId(userId);
  for (const row of rows) {
    await applyReferralRewardsForPaymentRow(row);
  }
  return rows.length;
}

/**
 * Update provider_payments row from YooKassa state and grant credits when succeeded.
 * Idempotent: credited row or ledger duplicate → duplicate.
 */
export async function reconcileProviderPayment(
  event: BillingWebhookEvent,
  deps: ReconcileProviderPaymentDeps = {}
): Promise<PaymentSyncStatus> {
  const repo = deps.providerPayments ?? new ProviderPaymentRepository();
  const row = await repo.findByProviderPaymentId(event.providerPaymentId);

  if (!row) {
    return "not_found";
  }

  if (row.user_id !== event.purchaserUserId) {
    return "forbidden";
  }

  if (row.status === "credited") {
    await applyReferralRewardsForPaymentRow(row);
    return "duplicate";
  }

  const nextStatus = mapBillingEventToProviderStatus(event);
  if (row.status !== nextStatus) {
    await repo.updateStatus(event.providerPaymentId, nextStatus);
  }

  if (nextStatus === "canceled") {
    return "pending";
  }

  if (nextStatus !== "succeeded") {
    return "pending";
  }

  const applyResult = await applyCreditPurchaseFromBillingEvent(event, {
    ...deps,
    providerPayments: repo,
  });
  if (applyResult.status === "applied") {
    await repo.markCredited(event.providerPaymentId);
    if (row.promo_code_id) {
      const promoRedemptions =
        deps.promoRedemptions ?? new PromoRedemptionRepository();
      try {
        await promoRedemptions.createIdempotent({
          promo_code_id: row.promo_code_id,
          user_id: row.purchaser_user_id,
          provider_payment_id: event.providerPaymentId,
        });
      } catch (error) {
        logger.error(
          {
            paymentId: event.providerPaymentId,
            promoCodeId: row.promo_code_id,
            error,
          },
          "Failed to record promo redemption after successful payment"
        );
        throw error;
      }
    }

    await applyReferralRewardsForPaymentRow(row);

    return "applied";
  }
  if (applyResult.status === "duplicate") {
    await repo.markCredited(event.providerPaymentId);
    await applyReferralRewardsForPaymentRow(row);
    return "duplicate";
  }

  return "pending";
}
