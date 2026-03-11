CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"form_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_form_id_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("id") ON DELETE cascade ON UPDATE no action;