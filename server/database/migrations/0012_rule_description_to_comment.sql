ALTER TABLE "rules" RENAME COLUMN "description" TO "comment";--> statement-breakpoint
ALTER TABLE "rules" ALTER COLUMN "comment" DROP NOT NULL;
