import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import { getFormByIdQuery } from "@/features/forms/queries";
import { authenticatedQuery } from "@/lib/queries";

export default async function FormsDetailPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  const form = await authenticatedQuery(async ({ supabase }) =>
    getFormByIdQuery({ formId, supabase }),
  );

  return <DashboardWrapper title={form.name}>.</DashboardWrapper>;
}
