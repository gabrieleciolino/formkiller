import FormViewer from "@/features/forms/components/form-viewer";
import { getFormAssignmentByIdQuery, getFormByIdQuery } from "@/features/forms/queries";
import type { ViewerFormData, ViewerQuestion } from "@/features/forms/types";
import { getFileUrl } from "@/lib/r2/functions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

export default async function FormViewerAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;

  const assignment = await getFormAssignmentByIdQuery({
    assignmentId,
    supabase: supabaseAdmin,
  });

  if (!assignment || !assignment.active) notFound();

  const form = await getFormByIdQuery({
    formId: assignment.form_id,
    supabase: supabaseAdmin,
  });

  if (!form) notFound();

  const language = form.language ?? "it";
  const messages = (await import(`@/messages/${language}.json`)).default;

  type RawQuestion = {
    id: string;
    question: string;
    order: number;
    file_key: string | null;
    default_answers: { answer: string; order: number }[];
  };

  const rawQuestions = form.questions as unknown as RawQuestion[];
  if (rawQuestions.length === 0) {
    notFound();
  }

  const viewerForm: ViewerFormData = {
    id: form.id,
    assignmentId: assignment.id,
    name: form.name,
    userId: assignment.user_id,
    type: (form.type ?? "mixed") as ViewerFormData["type"],
    theme: (form.theme ?? "dark") as ViewerFormData["theme"],
    language,
    questions: rawQuestions.map((q): ViewerQuestion => ({
      id: q.id,
      question: q.question,
      audioUrl: q.file_key ? getFileUrl(q.file_key) : null,
      defaultAnswers: q.default_answers,
    })),
    backgroundImageUrl: form.background_image_key
      ? getFileUrl(form.background_image_key)
      : null,
    backgroundMusicUrl: form.background_music_key
      ? getFileUrl(form.background_music_key)
      : null,
    introTitle: form.intro_title ?? null,
    introMessage: form.intro_message ?? null,
    endTitle: form.end_title ?? null,
    endMessage: form.end_message ?? null,
  };

  return (
    <NextIntlClientProvider locale={language} messages={messages}>
      <FormViewer form={viewerForm} />
    </NextIntlClientProvider>
  );
}
