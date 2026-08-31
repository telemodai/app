-- Wallet v2 referrals: drop per-bot purchase / claim columns (bonuses go to user wallet).

ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "referrals_referee_bot_id_bots_id_fk";--> statement-breakpoint
ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "referrals_referrer_claimed_bot_id_bots_id_fk";--> statement-breakpoint
ALTER TABLE "referrals" DROP COLUMN IF EXISTS "referee_bot_id";--> statement-breakpoint
ALTER TABLE "referrals" DROP COLUMN IF EXISTS "referrer_claimed_bot_id";--> statement-breakpoint
ALTER TABLE "referrals" DROP COLUMN IF EXISTS "claimed_at";
