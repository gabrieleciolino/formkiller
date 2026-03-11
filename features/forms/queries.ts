import { TypedSupabaseClient } from "@/lib/supabase/types";

export const getFormsQuery = async ({
  userId,
  supabase,
}: {
  userId: string;
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("form")
    .select("*, questions:question(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

export const getFormByIdQuery = async ({
  formId,
  supabase,
}: {
  formId: string;
  supabase: TypedSupabaseClient;
}) => {
  const { data } = await supabase
    .from("form")
    .select("*, questions:question(*)")
    .eq("id", formId)
    .order("created_at", { ascending: false })
    .order("order", { referencedTable: "question", ascending: true })
    .single()
    .throwOnError();

  return data;
};
