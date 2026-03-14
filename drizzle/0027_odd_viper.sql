ALTER TABLE "test" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "test" SET "is_published" = true WHERE "status" = 'published';--> statement-breakpoint
CREATE INDEX "test_is_published_idx" ON "test" USING btree ("is_published");--> statement-breakpoint
ALTER POLICY "test_profile_select_public_or_admin" ON "test_profile" TO public USING (
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
      and t.is_published = true
  )
);--> statement-breakpoint
ALTER POLICY "test_question_select_public_or_admin" ON "test_question" TO public USING (
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
      and t.is_published = true
  )
);--> statement-breakpoint
ALTER POLICY "test_result_insert_public" ON "test_result" TO public WITH CHECK (
        
  exists (
    select 1
    from "test" t
    where t.id = "test_result"."test_id"
      and t.status = 'published'
      and t.is_published = true
  )

        and exists (
          select 1
          from "test_profile" p
          where p.id = "test_result"."profile_id"
            and p.test_id = "test_result"."test_id"
        )
      );--> statement-breakpoint
ALTER POLICY "test_select_public_or_admin" ON "test" TO public USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
 or ("test"."status" = 'published' and "test"."is_published" = true));
