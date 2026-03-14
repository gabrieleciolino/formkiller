CREATE TYPE "public"."test_slide_generation_status" AS ENUM('idle', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."test_slide_kind" AS ENUM('intro', 'question_1', 'question_2', 'cta');--> statement-breakpoint
CREATE TABLE "test_slide" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"kind" "test_slide_kind" NOT NULL,
	"copy" text NOT NULL,
	"image_prompt" text NOT NULL,
	"image_file_key" text,
	"generation_status" "test_slide_generation_status" DEFAULT 'idle' NOT NULL,
	"generation_error" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "test_slide_test_order_unique" UNIQUE("test_id","order")
);
--> statement-breakpoint
ALTER TABLE "test_slide" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "test_slide" ADD CONSTRAINT "test_slide_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "test_slide_test_id_idx" ON "test_slide" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_slide_test_id_order_idx" ON "test_slide" USING btree ("test_id","order");--> statement-breakpoint
CREATE POLICY "test_slide_select_admin" ON "test_slide" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_slide_insert_admin" ON "test_slide" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "test_slide_update_admin" ON "test_slide" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
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
CREATE POLICY "test_slide_delete_admin" ON "test_slide" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);