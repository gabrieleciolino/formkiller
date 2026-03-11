CREATE TYPE "public"."form_type" AS ENUM('mixed', 'default-only', 'voice-only');--> statement-breakpoint
ALTER TABLE "answer" ADD COLUMN "default_answer" text;--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "type" "form_type" DEFAULT 'mixed' NOT NULL;