import { TypedSupabaseClient } from "@/lib/supabase/types";

export const getLeadsQuery = async ({
  supabase,
  userId,
}: {
  supabase: TypedSupabaseClient;
  userId: string;
}) => {
  const { data, error } = await supabase
    .from("lead")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};
