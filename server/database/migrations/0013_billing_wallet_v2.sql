-- Billing v2: user wallet, ledger user_id, bot soft delete, provider_payments.user_id
-- Data: users.credit_balance defaults to 0; existing bots.credit_balance unchanged.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credit_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bots" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TYPE "public"."credit_transaction_type" ADD VALUE IF NOT EXISTS 'allocate';--> statement-breakpoint
ALTER TYPE "public"."credit_transaction_type" ADD VALUE IF NOT EXISTS 'reclaim';--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD COLUMN IF NOT EXISTS "user_id" text;--> statement-breakpoint
ALTER TABLE "credit_transactions" ALTER COLUMN "bot_id" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_transactions_user_created" ON "credit_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "provider_payments" ADD COLUMN IF NOT EXISTS "user_id" text;--> statement-breakpoint
UPDATE "provider_payments" SET "user_id" = "purchaser_user_id" WHERE "user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "provider_payments" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_payments" DROP CONSTRAINT IF EXISTS "provider_payments_bot_id_bots_id_fk";--> statement-breakpoint
ALTER TABLE "provider_payments" ALTER COLUMN "bot_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_payments" ADD CONSTRAINT "provider_payments_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "provider_payments" ADD CONSTRAINT "provider_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DROP INDEX IF EXISTS "provider_payments_bot_status_created";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provider_payments_user_status_created" ON "provider_payments" USING btree ("user_id","status","created_at");
