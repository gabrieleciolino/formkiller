import { TypedSupabaseClient } from "@/lib/supabase/types";

export const getSessionsQuery = async ({
  supabase,
  userId,
}: {
  supabase: TypedSupabaseClient;
  userId: string;
}) => {
  const { data, error } = await supabase
    .from("form_session")
    .select("*, form:form_id(name, questions:question(id))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};
