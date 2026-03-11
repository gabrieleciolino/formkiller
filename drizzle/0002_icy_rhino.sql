CREATE TABLE "question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"question" text NOT NULL,
	"default_answers" jsonb NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_form_id_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("id") ON DELETE cascade ON UPDATE no action;