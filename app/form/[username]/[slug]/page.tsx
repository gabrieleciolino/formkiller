import FormViewer from "@/features/forms/components/form-viewer";
import { getPublishedFormViewerByUsernameAndSlugQuery } from "@/features/forms/queries";
import type { ViewerFormData, ViewerQuestion } from "@/features/forms/types";
import { getFileUrl } from "@/lib/r2/functions";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;

  const form = await getPublishedFormViewerByUsernameAndSlugQuery({
    username,
    slug,
  });

  if (!form) {
    notFound();
  }

  const language = (form.language ?? "it") as ViewerFormData["language"];
  const allMessages = (await import(`@/messages/${language}.json`)) as {
    default: { viewer?: Record<string, unknown> };
  };
  const messages = {
    viewer: allMessages.default.viewer ?? {},
  };

  const viewerForm: ViewerFormData = {
    id: form.id,
    username: form.owner_username,
    slug,
    name: form.name,
    userId: form.user_id,
    type: (form.type ?? "default-only") as ViewerFormData["type"],
    theme: (form.theme ?? "dark") as ViewerFormData["theme"],
    language,
    questions: (form.questions ?? []).map(
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
  };

  return (
    <NextIntlClientProvider locale={language} messages={messages}>
      <FormViewer form={viewerForm} />
    </NextIntlClientProvider>
  );
}

