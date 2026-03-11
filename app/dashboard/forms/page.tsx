import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import FormsTable from "@/app/dashboard/forms/table";
import CreateFormSheet from "@/features/forms/components/create-form-sheet";
import { getFormsQuery } from "@/features/forms/queries";
import { authenticatedQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";

export default async function FormsPage() {
  const [forms, t] = await Promise.all([
    authenticatedQuery(
      async ({ supabase, userId }) => await getFormsQuery({ userId, supabase }),
    ),
    getTranslations("dashboard.forms"),
  ]);

  return (
    <DashboardWrapper
      title={t("title")}
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
