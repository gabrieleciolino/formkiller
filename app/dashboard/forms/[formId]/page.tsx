import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import { Separator } from "@/components/ui/separator";
import EditFormSheet from "@/features/forms/components/edit-form-sheet";
import EditQuestionsForm from "@/features/forms/components/edit-questions-form";
import { getFormByIdQuery } from "@/features/forms/queries";
import { EditQuestionsType } from "@/features/forms/schema";
import { authenticatedQuery } from "@/lib/queries";
import { getFileUrl } from "@/lib/r2/functions";
import { notFound } from "next/navigation";

export default async function FormsDetailPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  const form = await authenticatedQuery(async ({ supabase }) =>
    getFormByIdQuery({ formId, supabase }),
  );

  if (!form) notFound();

  type QuestionRaw = EditQuestionsType["questions"][0] & {
    file_key?: string | null;
  };
  const questionsRaw = form.questions as unknown as QuestionRaw[];
  const initialFileUrls: Record<string, string | null> = Object.fromEntries(
    questionsRaw.map((q) => [q.id, q.file_key ? getFileUrl(q.file_key) : null]),
  );

  return (
    <DashboardWrapper
      title={form.name}
      actions={<EditFormSheet formData={form} />}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Name</p>
          <p className="text-sm text-muted-foreground">{form.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Instructions</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {form.instructions}
          </p>
        </div>
      </div>
      <Separator />
      <EditQuestionsForm
        questionsData={questionsRaw as unknown as EditQuestionsType["questions"]}
        formId={formId}
        initialFileUrls={initialFileUrls}
      />
    </DashboardWrapper>
  );
}
