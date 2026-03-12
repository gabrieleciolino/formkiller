import { TypedSupabaseClient } from "@/lib/supabase/types";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const getAdminUsersQuery = async () => {
  const { data, error } = await supabaseAdmin
    .from("account")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

export const getAssignableUsersQuery = async ({
  supabase,
}: {
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("account")
    .select("user_id, role, created_at")
    .eq("role", "user")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};
