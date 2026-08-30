export type CreditTransactionType =
  | "grant_signup"
  | "purchase"
  | "debit_moderation"
  | "admin_adjust"
  | "reconcile_fix"
  | "referral_bonus"
  | "allocate"
  | "reclaim";

export interface CreditTransaction {
  id: number;
  user_id?: string | null;
  bot_id?: string | null;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  chat_id?: number | null;
  reference?: string | null;
  actor_user_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
}

export interface CreateCreditTransactionInput {
  user_id?: string | null;
  bot_id?: string | null;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  chat_id?: number | null;
  reference?: string | null;
  actor_user_id?: string | null;
  metadata?: Record<string, unknown> | null;
}
