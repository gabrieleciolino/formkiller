import { TypedSupabaseClient } from "@/lib/supabase/types";

export const getUserFormsQuery = async ({
  userId,
  supabase,
}: {
  userId: string;
  supabase: TypedSupabaseClient;
}) => {
  const { data: assignments, error: assignmentsError } = await supabase
    .from("form_assignment")
    .select("id, form_id")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (assignmentsError) throw assignmentsError;
  if (!assignments || assignments.length === 0) return [];

  const formIds = [...new Set(assignments.map((assignment) => assignment.form_id))];

  const { data, error } = await supabase
    .from("form")
    .select("*, questions:question(*)")
    .in("id", formIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const assignmentByFormId = new Map(
    assignments.map((assignment) => [assignment.form_id, assignment.id]),
  );

  return data
    .map((form) => ({
      ...form,
      assignment_id: assignmentByFormId.get(form.id) ?? null,
    }))
    .filter((form) => form.assignment_id !== null);
};

export const getFormsQuery = getUserFormsQuery;

export const getAdminFormsQuery = async ({
  supabase,
}: {
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("form")
    .select("*, questions:question(*)")
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

export const getUserFormByIdQuery = async ({
  formId,
  userId,
  supabase,
}: {
  formId: string;
  userId: string;
  supabase: TypedSupabaseClient;
}) => {
  const { data: assignment, error: assignmentError } = await supabase
    .from("form_assignment")
    .select("id")
    .eq("form_id", formId)
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (assignmentError) throw assignmentError;
  if (!assignment) return null;

  const { data, error } = await supabase
    .from("form")
    .select("*, questions:question(*)")
    .eq("id", formId)
    .order("created_at", { ascending: false })
    .order("order", { referencedTable: "question", ascending: true })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    assignment_id: assignment.id,
  };
};

export const getFormAssignmentByIdQuery = async ({
  assignmentId,
  supabase,
}: {
  assignmentId: string;
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("form_assignment")
    .select("id, form_id, user_id, active")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const getFormAssignmentsForAdminQuery = async ({
  formId,
  supabase,
}: {
  formId: string;
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("form_assignment")
    .select("id, form_id, user_id, active, created_at")
    .eq("form_id", formId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};
