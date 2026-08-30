export interface AppUser {
  id: string;
  telegram_id: number;
  username?: string | null;
  name: string;
  photo_url?: string | null;
  referral_code?: string | null;
  credit_balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface SessionUser {
  id: string;
  telegram_id: number;
  username?: string | null;
  name: string;
  photo_url?: string | null;
}
