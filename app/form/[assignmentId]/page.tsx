import FormViewer from "@/features/forms/components/form-viewer";
import { getPublicFormViewerByAssignmentIdQuery } from "@/features/forms/queries";
import type { ViewerFormData, ViewerQuestion } from "@/features/forms/types";
import {
  endAdminTrace,
  startAdminTrace,
  traceAdminStep,
} from "@/lib/observability/admin-trace";
import { getFileUrl } from "@/lib/r2/functions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

export default async function FormViewerAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const trace = startAdminTrace("forms.publicFormViewerPage");
  let status = "ok";
  let assignmentId: string | null = null;
  let formId: string | null = null;
  let language: ViewerFormData["language"] = "it";
  let questionCount = 0;

  try {
    const paramsData = await traceAdminStep(trace, "params", () => params);
    assignmentId = paramsData.assignmentId;

    const assignmentWithForm = await traceAdminStep(
      trace,
      "db.select.form_assignment_with_form",
      () =>
        getPublicFormViewerByAssignmentIdQuery({
          assignmentId: paramsData.assignmentId,
          supabase: supabaseAdmin,
        }),
      { assignmentId: paramsData.assignmentId },
    );

    if (!assignmentWithForm) {
      status = "assignment_not_found";
      notFound();
    }

    if (!assignmentWithForm.active) {
      status = "assignment_inactive";
      notFound();
    }

    const assignment = assignmentWithForm;
    formId = assignment.form_id;
    const form = assignment.form;

    if (!form) {
      status = "form_not_found";
      notFound();
    }

    language = (form.language ?? "it") as ViewerFormData["language"];
    const allMessages = (await traceAdminStep(
      trace,
      "i18n.load_messages",
      () => import(`@/messages/${language}.json`),
      { language },
    )) as {
      default: { viewer?: Record<string, unknown> };
    };
    const messages = {
      viewer: allMessages.default.viewer ?? {},
    };

    const rawQuestions = form.questions;
    questionCount = rawQuestions.length;
    if (rawQuestions.length === 0) {
      status = "no_questions";
      notFound();
    }

    const contactAssignmentId = (process.env.CONTACT_FORM_ID ?? "").trim();
    const isLandingContactForm =
      contactAssignmentId.length > 0 && assignment.id === contactAssignmentId;

    const viewerForm = await traceAdminStep(
      trace,
      "build.viewer_form",
      (): ViewerFormData => ({
        id: form.id,
        assignmentId: assignment.id,
        isLandingContactForm,
        name: form.name,
        userId: assignment.user_id,
        type: (form.type ?? "mixed") as ViewerFormData["type"],
        theme: (form.theme ?? "dark") as ViewerFormData["theme"],
        language,
        questions: rawQuestions.map(
          (q): ViewerQuestion => ({
            id: q.id,
            question: q.question,
            audioUrl: q.file_key ? getFileUrl(q.file_key) : null,
            defaultAnswers: q.default_answers,
          }),
        ),
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
      }),
      {
        questionCount: rawQuestions.length,
        hasBackgroundImage: Boolean(form.background_image_key),
        hasBackgroundMusic: Boolean(form.background_music_key),
        isLandingContactForm,
      },
    );

    return (
      <NextIntlClientProvider locale={language} messages={messages}>
        <FormViewer form={viewerForm} />
      </NextIntlClientProvider>
    );
  } finally {
    endAdminTrace(trace, {
      status,
      assignmentId,
      formId,
      language,
      questionCount,
    });
  }
}
