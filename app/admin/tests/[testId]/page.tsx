import { Button } from "@/components/ui/button";
import TestEditorForm from "@/features/tests/components/test-editor-form";
import { type EditableTestType } from "@/features/tests/schema";
import { getAdminTestByIdQuery } from "@/features/tests/queries";
import { adminQuery } from "@/lib/queries";
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

  const [test, t] = await Promise.all([
    adminQuery(async ({ supabase }) => getAdminTestByIdQuery({ testId, supabase })),
    getTranslations(),
  ]);

  if (!test) {
    notFound();
  }

  const initialData: EditableTestType = {
    name: test.name,
    language: test.language,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-foreground">{test.name}</h2>

        <div className="flex items-center gap-2">
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
}
