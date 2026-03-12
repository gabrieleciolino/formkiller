CREATE POLICY "account_select_admin" ON "account" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
  exists (
    select 1
    from "account" a
    where a.user_id = auth.uid()
      and a.role = 'admin'
  )
);