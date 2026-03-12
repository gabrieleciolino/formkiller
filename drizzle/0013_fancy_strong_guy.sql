CREATE TYPE "public"."account_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "account" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"role" "account_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;