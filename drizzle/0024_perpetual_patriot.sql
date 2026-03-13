CREATE TYPE "public"."test_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "test_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "test_profile" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "test_question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"question" text NOT NULL,
	"answers" jsonb NOT NULL,
	"file_key" text,
	"file_generated_at" timestamp,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "test_question" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "test_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"language" "form_language" DEFAULT 'en' NOT NULL,
	"score_totals" jsonb NOT NULL,
	"answer_selections" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "test_result" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "test" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"language" "form_language" DEFAULT 'en' NOT NULL,
	"status" "test_status" DEFAULT 'draft' NOT NULL,
	"intro_title" text,
	"intro_message" text,
	"end_title" text,
	"end_message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "test_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "test" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "test_profile" ADD CONSTRAINT "test_profile_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_question" ADD CONSTRAINT "test_question_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_result" ADD CONSTRAINT "test_result_profile_id_test_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."test_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test" ADD CONSTRAINT "test_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "test_profile_test_id_idx" ON "test_profile" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_profile_test_id_order_idx" ON "test_profile" USING btree ("test_id","order");--> statement-breakpoint
CREATE INDEX "test_question_test_id_idx" ON "test_question" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_question_test_id_order_idx" ON "test_question" USING btree ("test_id","order");--> statement-breakpoint
CREATE INDEX "test_result_test_id_idx" ON "test_result" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_result_profile_id_idx" ON "test_result" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "test_result_created_at_idx" ON "test_result" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "test_user_id_idx" ON "test" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_status_idx" ON "test" USING btree ("status");--> statement-breakpoint
CREATE POLICY "test_profile_select_public_or_admin" ON "test_profile" AS PERMISSIVE FOR SELECT TO public USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
 or 
  exists (
    select 1
    from "test" t
    where t.id = "test_profile"."test_id"
      and t.status = 'published'
  )
);--> statement-breakpoint
CREATE POLICY "test_profile_insert_admin" ON "test_profile" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_profile_update_admin" ON "test_profile" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
) WITH CHECK (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_profile_delete_admin" ON "test_profile" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_question_select_public_or_admin" ON "test_question" AS PERMISSIVE FOR SELECT TO public USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
 or 
  exists (
    select 1
    from "test" t
    where t.id = "test_question"."test_id"
      and t.status = 'published'
  )
);--> statement-breakpoint
CREATE POLICY "test_question_insert_admin" ON "test_question" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_question_update_admin" ON "test_question" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
) WITH CHECK (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_question_delete_admin" ON "test_question" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_result_select_admin" ON "test_result" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_result_insert_public" ON "test_result" AS PERMISSIVE FOR INSERT TO public WITH CHECK (
        
  exists (
    select 1
    from "test" t
    where t.id = "test_result"."test_id"
      and t.status = 'published'
  )

        and exists (
          select 1
          from "test_profile" p
          where p.id = "test_result"."profile_id"
            and p.test_id = "test_result"."test_id"
        )
      );--> statement-breakpoint
CREATE POLICY "test_result_delete_admin" ON "test_result" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_select_public_or_admin" ON "test" AS PERMISSIVE FOR SELECT TO public USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
 or "test"."status" = 'published');--> statement-breakpoint
CREATE POLICY "test_insert_admin" ON "test" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_update_admin" ON "test" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
) WITH CHECK (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_delete_admin" ON "test" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);