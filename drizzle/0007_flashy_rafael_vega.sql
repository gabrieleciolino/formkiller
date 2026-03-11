CREATE TYPE "public"."form_language" AS ENUM('en', 'it', 'es');--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "language" "form_language" DEFAULT 'en' NOT NULL;