CREATE TYPE "public"."account_tier" AS ENUM('free', 'pro');--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "tier" "account_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "form" ADD CONSTRAINT "form_slug_unique" UNIQUE("slug");--> statement-breakpoint
CREATE POLICY "form_select_owner_or_admin" ON "form" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("form"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "question_select_owner_or_admin" ON "question" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )

        or (
          "question"."user_id" = auth.uid()
          and 
  exists (
    select 1
    from "form" f
    where f.id = "question"."form_id"
      and f.user_id = auth.uid()
  )

        )
      );--> statement-breakpoint
ALTER POLICY "account_insert_own_user" ON "account" TO authenticated WITH CHECK ("account"."user_id" = auth.uid() and "account"."role" = 'user' and "account"."tier" = 'free');--> statement-breakpoint
ALTER POLICY "form_select_public" ON "form" TO public USING ("form"."is_published" = true);--> statement-breakpoint
ALTER POLICY "question_select_public" ON "question" TO public USING (
  exists (
    select 1
    from "form" f
    where f.id = "question"."form_id"
      and f.is_published = true
  )
);