import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import { Separator } from "@/components/ui/separator";
import EditFormSheet from "@/features/forms/components/edit-form-sheet";
import EditQuestionsForm from "@/features/forms/components/edit-questions-form";
import { getFormByIdQuery } from "@/features/forms/queries";
import {
  EditQuestionsType,
  FORM_LANGUAGE_LABELS,
  FORM_TYPE_LABELS,
} from "@/features/forms/schema";
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Name</p>
          <p className="text-sm text-muted-foreground">{form.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Type</p>
          <p className="text-sm text-muted-foreground">
            {
              FORM_TYPE_LABELS[
                (form.type ?? "mixed") as keyof typeof FORM_TYPE_LABELS
              ]
            }
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Language</p>
          <p className="text-sm text-muted-foreground">
            {
              FORM_LANGUAGE_LABELS[
                (form.language ?? "it") as keyof typeof FORM_LANGUAGE_LABELS
              ]
            }
          </p>
        </div>
        <div className="col-span-2 space-y-1 md:col-span-4">
          <p className="text-sm font-medium">Instructions</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {form.instructions}
          </p>
        </div>
      </div>
      <Separator />
      <EditQuestionsForm
        questionsData={
          questionsRaw as unknown as EditQuestionsType["questions"]
        }
        formId={formId}
        language={form.language}
        initialFileUrls={initialFileUrls}
      />
    </DashboardWrapper>
  );
}
