CREATE TYPE "public"."form_theme" AS ENUM('light', 'dark');--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "theme" "form_theme" DEFAULT 'dark' NOT NULL;