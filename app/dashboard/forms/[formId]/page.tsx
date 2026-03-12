import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import { Separator } from "@/components/ui/separator";
import { getUserFormByIdQuery } from "@/features/forms/queries";
import { authenticatedQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function FormsDetailPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  const [form, t] = await Promise.all([
    authenticatedQuery(async ({ supabase, userId }) =>
      getUserFormByIdQuery({ formId, userId, supabase }),
    ),
    getTranslations(),
  ]);

  if (!form) notFound();

  type QuestionRaw = {
    id: string;
    question: string;
    order: number;
    default_answers: { answer: string; order: number }[];
  };
  const questions = [...(form.questions as unknown as QuestionRaw[])].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <DashboardWrapper title={form.name}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {t("dashboard.forms.detail.name")}
          </p>
          <p className="text-sm text-muted-foreground">{form.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {t("dashboard.forms.detail.type")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(`forms.types.${form.type ?? "mixed"}`)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {t("dashboard.forms.detail.language")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(`forms.languages.${form.language ?? "it"}`)}
          </p>
        </div>
        <div className="col-span-2 space-y-1 md:col-span-4">
          <p className="text-sm font-medium">
            {t("dashboard.forms.detail.instructions")}
          </p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {form.instructions}
          </p>
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3 rounded-md border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {t("forms.questions.questionLabel", { index: index + 1 })}
              </p>
              <p className="text-sm text-muted-foreground">
                {question.question}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("forms.questions.defaultAnswers")}
              </p>
              <ul className="space-y-1">
                {[...question.default_answers]
                  .sort((a, b) => a.order - b.order)
                  .map((answer) => (
                    <li key={`${question.id}-${answer.order}`}>
                      <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-sm">
                        {answer.answer}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </DashboardWrapper>
  );
}
