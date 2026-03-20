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
  slug: string | null;
  name: string;
  type: string | null;
  theme: string | null;
  language: string | null;
  user_id: string;
  background_image_key: string | null;
  background_music_key: string | null;
  intro_title: string | null;
  intro_message: string | null;
  end_title: string | null;
  end_message: string | null;
  is_published: boolean;
  questions: PublicViewerQuestionRow[] | null;
};

export type PublicViewerForm = PublicViewerFormRow;

export const getUserFormsQuery = async ({
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
  const { data, error } = await supabase
    .from("form")
    .select("*, questions:question(*)")
    .eq("id", formId)
    .eq("user_id", userId)
    .order("order", { referencedTable: "question", ascending: true })
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getPublishedFormViewerBySlugQuery = async ({
  slug,
  supabase,
}: {
  slug: string;
  supabase: TypedSupabaseClient;
}) => {
  const { data, error } = await supabase
    .from("form")
    .select(
      "id, slug, name, type, theme, language, user_id, background_image_key, background_music_key, intro_title, intro_message, end_title, end_message, is_published, questions:question(id, question, order, file_key, default_answers)",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .order("order", { referencedTable: "question", ascending: true })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as PublicViewerFormRow;

  return {
    ...row,
    questions: [...(row.questions ?? [])].sort((left, right) => left.order - right.order),
  } satisfies PublicViewerForm;
};
