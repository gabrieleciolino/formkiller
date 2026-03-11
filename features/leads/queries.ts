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
    .select("*, form:form_id(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

export const getLeadDetailQuery = async ({
  supabase,
  leadId,
}: {
  supabase: TypedSupabaseClient;
  leadId: string;
}) => {
  const { data: lead, error } = await supabase
    .from("lead")
    .select("*, form:form_id(name)")
    .eq("id", leadId)
    .single();

  if (error) throw error;
  if (!lead) return null;

  const { data: answers, error: answersError } = await supabase
    .from("answer")
    .select("*, question:question_id(question, order)")
    .eq("form_session_id", lead.form_session_id)
    .order("created_at", { ascending: true });

  if (answersError) throw answersError;

  return { lead, answers: answers ?? [] };
};
