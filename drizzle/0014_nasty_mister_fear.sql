ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "answer" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "asset" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "question" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "account_select_own" ON "account" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("account"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "account_insert_own_user" ON "account" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("account"."user_id" = auth.uid() and "account"."role" = 'user');--> statement-breakpoint
CREATE POLICY "answer_select_owner_or_admin" ON "answer" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("answer"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "answer_delete_owner_or_admin" ON "answer" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("answer"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "asset_select_owner_or_admin" ON "asset" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("asset"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "asset_insert_owner_or_admin" ON "asset" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("asset"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "asset_update_owner_or_admin" ON "asset" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("asset"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
) WITH CHECK ("asset"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "asset_delete_owner_or_admin" ON "asset" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("asset"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "form_session_select_owner_or_admin" ON "form_session" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("form_session"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "form_session_delete_owner_or_admin" ON "form_session" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("form_session"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "form_select_public" ON "form" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "form_insert_owner_or_admin" ON "form" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("form"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "form_update_owner_or_admin" ON "form" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("form"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
) WITH CHECK ("form"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "form_delete_owner_or_admin" ON "form" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("form"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "lead_select_owner_or_admin" ON "lead" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("lead"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "lead_delete_owner_or_admin" ON "lead" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("lead"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "question_select_public" ON "question" AS PERMISSIVE FOR SELECT TO public USING (exists (select 1 from "form" f where f.id = "question"."form_id"));--> statement-breakpoint
CREATE POLICY "question_insert_owner_or_admin" ON "question" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
        
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
CREATE POLICY "question_update_owner_or_admin" ON "question" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("question"."user_id" = auth.uid() or 
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
CREATE POLICY "question_delete_owner_or_admin" ON "question" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("question"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);