import { TypedSupabaseClient } from "@/lib/supabase/types";

export const getUserLeadsQuery = async ({
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

export const getLeadsQuery = getUserLeadsQuery;

export const getAdminLeadsQuery = async ({
  supabase,
}: {
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("lead")
    .select("*, form:form_id(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

const getLeadDetailBaseQuery = async ({
  supabase,
  leadId,
  userId,
}: {
  supabase: TypedSupabaseClient;
  leadId: string;
  userId?: string;
}) => {
  let leadQuery = supabase
    .from("lead")
    .select("*, form:form_id(name)")
    .eq("id", leadId);

  if (userId) {
    leadQuery = leadQuery.eq("user_id", userId);
  }

  const { data: lead, error } = await leadQuery.maybeSingle();

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

export const getUserLeadDetailQuery = async ({
  supabase,
  leadId,
  userId,
}: {
  supabase: TypedSupabaseClient;
  leadId: string;
  userId: string;
}) => {
  return getLeadDetailBaseQuery({ supabase, leadId, userId });
};

export const getAdminLeadDetailQuery = async ({
  supabase,
  leadId,
}: {
  supabase: TypedSupabaseClient;
  leadId: string;
}) => {
  return getLeadDetailBaseQuery({ supabase, leadId });
};

export const getLeadDetailQuery = getUserLeadDetailQuery;
