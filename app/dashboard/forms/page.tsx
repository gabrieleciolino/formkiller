import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import FormsTable from "@/app/dashboard/forms/table";
import CreateFormSheet from "@/features/forms/components/create-form-sheet";
import { getFormsQuery } from "@/features/forms/queries";
import { authenticatedQuery } from "@/lib/queries";

export default async function FormsPage() {
  const forms = await authenticatedQuery(
    async ({ supabase, userId }) => await getFormsQuery({ userId, supabase }),
  );

  return (
    <DashboardWrapper
      title="Forms"
      actions={
        <div>
          <CreateFormSheet />
        </div>
      }
    >
      <FormsTable data={forms} />
    </DashboardWrapper>
  );
}
