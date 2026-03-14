import { Button } from "@/components/ui/button";
import EditTestSheet from "@/features/tests/components/edit-test-sheet";
import TestEditorForm from "@/features/tests/components/test-editor-form";
import { type EditableTestType } from "@/features/tests/schema";
import { getAdminTestByIdQuery } from "@/features/tests/queries";
import {
  endAdminTrace,
  startAdminTrace,
  traceAdminStep,
} from "@/lib/observability/admin-trace";
import { adminQuery } from "@/lib/queries";
import { getFileUrl } from "@/lib/r2/functions";
import { urls } from "@/lib/urls";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminTestDetailPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  const trace = startAdminTrace("tests.adminTestDetailPage", { testId });
  let status = "ok";

  try {
    const [test, t] = await traceAdminStep(trace, "load.data", () =>
      Promise.all([
        adminQuery(async ({ supabase }) => getAdminTestByIdQuery({ testId, supabase })),
        getTranslations(),
      ]),
    );

    if (!test) {
      status = "not_found";
      notFound();
    }

    const { backgroundImageUrl, backgroundMusicUrl, initialData } =
      await traceAdminStep(trace, "build.initialData", () => {
        const mappedInitialData: EditableTestType = {
          name: test.name,
          language: test.language,
          isPublished: test.is_published,
          introTitle: test.intro_title ?? "",
          introMessage: test.intro_message ?? "",
          endTitle: test.end_title ?? "",
          endMessage: test.end_message ?? "",
          profiles: test.profiles.map((profile, index) => ({
            id: profile.id,
            order: index,
            title: profile.title,
            description: profile.description,
          })),
          questions: test.questions.map((question, questionIndex) => ({
            id: question.id,
            order: questionIndex,
            question: question.question,
            answers: question.answers.map((answer, answerIndex) => ({
              answer: answer.answer,
              order: answerIndex,
              scores: answer.scores,
            })),
          })),
        };

        return {
          backgroundImageUrl: test.background_image_key
            ? getFileUrl(test.background_image_key)
            : null,
          backgroundMusicUrl: test.background_music_key
            ? getFileUrl(test.background_music_key)
            : null,
          initialData: mappedInitialData,
        };
      });

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-foreground">{test.name}</h2>

          <div className="flex items-center gap-2">
            <EditTestSheet
              testId={test.id}
              backgroundImageKey={test.background_image_key}
              backgroundMusicKey={test.background_music_key}
              backgroundImageUrl={backgroundImageUrl}
              backgroundMusicUrl={backgroundMusicUrl}
            />

            <Button asChild variant="outline" size="sm">
              <Link href={urls.admin.tests.index}>
                {t("dashboard.tests.detail.back")}
              </Link>
            </Button>

            <Button asChild variant="outline" size="sm">
              <Link href={urls.test(test.slug)} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                {t("dashboard.tests.columns.open")}
              </Link>
            </Button>
          </div>
        </div>

        <TestEditorForm mode="edit" testId={test.id} initialData={initialData} />
      </div>
    );
  } catch (error) {
    if (status === "ok") {
      status = "error";
    }
    throw error;
  } finally {
    endAdminTrace(trace, { status });
  }
}
