CREATE TYPE "public"."test_result_type" AS ENUM('profile', 'analysis');--> statement-breakpoint
CREATE TYPE "public"."test_tone" AS ENUM('fun', 'educational', 'serious', 'professional');--> statement-breakpoint
ALTER TABLE "test" ADD COLUMN "tone" "test_tone" DEFAULT 'fun' NOT NULL;--> statement-breakpoint
ALTER TABLE "test" ADD COLUMN "result_type" "test_result_type" DEFAULT 'profile' NOT NULL;