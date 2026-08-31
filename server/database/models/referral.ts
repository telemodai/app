export type ReferrerStatus = "pending" | "claimed" | "skipped_zero";

export interface Referral {
  id: number;
  referrer_user_id: string;
  referee_user_id: string;
  provider_payment_id: string;
  base_credits: number;
  referee_bonus_credits: number;
  referrer_bonus_credits: number;
  referrer_status: ReferrerStatus;
  referral_code?: string | null;
  created_at: Date;
}
