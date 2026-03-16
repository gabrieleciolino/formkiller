import { TypedSupabaseClient } from "@/lib/supabase/types";
import {
  endAdminTrace,
  startAdminTrace,
  traceAdminStep,
} from "@/lib/observability/admin-trace";

type PublicViewerQuestionRow = {
  id: string;
  question: string;
  order: number;
  file_key: string | null;
  default_answers: { answer: string; order: number }[];
};

type PublicViewerFormRow = {
  id: string;
  name: string;
  type: string | null;
  theme: string | null;
  language: string | null;
  background_image_key: string | null;
  background_music_key: string | null;
  intro_title: string | null;
  intro_message: string | null;
  end_title: string | null;
  end_message: string | null;
  questions: PublicViewerQuestionRow[] | null;
};

export type PublicViewerAssignmentWithForm = {
  id: string;
  form_id: string;
  user_id: string;
  active: boolean;
  form: PublicViewerFormRow | null;
};

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
  const trace = startAdminTrace("forms.getAdminFormsQuery");
  let rowCount = 0;
  let status = "ok";

  try {
    const { data, error } = await traceAdminStep(trace, "db.select.form", () =>
      supabase
        .from("form")
        .select("*, questions:question(*)")
        .order("created_at", { ascending: false }),
    );

    if (error) {
      status = "error";
      throw error;
    }

    rowCount = data?.length ?? 0;
    return data;
  } finally {
    endAdminTrace(trace, { status, rowCount });
  }
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
    .order("order", { referencedTable: "question", ascending: true })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    assignment_id: assignment.id,
  };
};

export const getPublicFormViewerByAssignmentIdQuery = async ({
  assignmentId,
  supabase,
}: {
  assignmentId: string;
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("form_assignment")
    .select(
      "id, form_id, user_id, active, form:form_id(id, name, type, theme, language, background_image_key, background_music_key, intro_title, intro_message, end_title, end_message, questions:question(id, question, order, file_key, default_answers))",
    )
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    form_id: string;
    user_id: string;
    active: boolean;
    form: PublicViewerFormRow | PublicViewerFormRow[] | null;
  };

  const rawForm = Array.isArray(row.form) ? row.form[0] : row.form;

  return {
    id: row.id,
    form_id: row.form_id,
    user_id: row.user_id,
    active: row.active,
    form: rawForm
      ? {
          ...rawForm,
          questions: [...(rawForm.questions ?? [])].sort(
            (left, right) => left.order - right.order,
          ),
        }
      : null,
  } satisfies PublicViewerAssignmentWithForm;
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
