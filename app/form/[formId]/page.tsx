import FormViewer from "@/features/forms/components/form-viewer";
import { getFormByIdQuery } from "@/features/forms/queries";
import { publicQuery } from "@/lib/queries";

export default async function FormViewerPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  const form = await publicQuery(
    async ({ supabase }) => await getFormByIdQuery({ formId, supabase }),
  );

  return <FormViewer form={form} />;
}
