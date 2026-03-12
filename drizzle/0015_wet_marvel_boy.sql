CREATE TABLE "form_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "form_assignment_form_user_unique" UNIQUE("form_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "form_assignment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_assignment" ADD CONSTRAINT "form_assignment_form_id_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_assignment" ADD CONSTRAINT "form_assignment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_assignment" ADD CONSTRAINT "form_assignment_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_assignment_form_id_idx" ON "form_assignment" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_assignment_user_id_idx" ON "form_assignment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "form_assignment_active_idx" ON "form_assignment" USING btree ("active");--> statement-breakpoint
CREATE POLICY "form_assignment_select_owner_or_admin" ON "form_assignment" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("form_assignment"."user_id" = auth.uid() or 
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "form_assignment_insert_admin" ON "form_assignment" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);--> statement-breakpoint
CREATE POLICY "form_assignment_update_admin" ON "form_assignment" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
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
CREATE POLICY "form_assignment_delete_admin" ON "form_assignment" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);