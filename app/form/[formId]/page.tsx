import FormViewer, {
  type ViewerFormData,
  type ViewerQuestion,
} from "@/features/forms/components/form-viewer";
import { getFormByIdQuery } from "@/features/forms/queries";
import { publicQuery } from "@/lib/queries";
import { getFileUrl } from "@/lib/r2/functions";
import { notFound } from "next/navigation";

export default async function FormViewerPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  const form = await publicQuery(
    async ({ supabase }) => await getFormByIdQuery({ formId, supabase }),
  );

  if (!form) notFound();

  type RawQuestion = {
    id: string;
    question: string;
    order: number;
    file_key: string | null;
    default_answers: { answer: string; order: number }[];
  };

  const rawQuestions = form.questions as unknown as RawQuestion[];

  const viewerForm: ViewerFormData = {
    id: form.id,
    name: form.name,
    userId: form.user_id,
    type: (form.type ?? "mixed") as ViewerFormData["type"],
    questions: rawQuestions.map((q): ViewerQuestion => ({
      id: q.id,
      question: q.question,
      audioUrl: q.file_key ? getFileUrl(q.file_key) : null,
      defaultAnswers: q.default_answers,
    })),
  };

  return <FormViewer form={viewerForm} />;
}
