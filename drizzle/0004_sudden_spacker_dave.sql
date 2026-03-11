ALTER TABLE "question" RENAME COLUMN "tts_url" TO "file_key";--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "file_generated_at" timestamp;