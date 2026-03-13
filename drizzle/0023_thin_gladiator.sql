ALTER TABLE "form_session" ADD COLUMN "completion_analysis_status" text DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "form_session" ADD COLUMN "completion_analysis_text" text;--> statement-breakpoint
ALTER TABLE "form_session" ADD COLUMN "completion_analysis_audio_url" text;