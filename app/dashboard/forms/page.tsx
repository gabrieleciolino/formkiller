import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import FormsTable from "@/app/dashboard/forms/table";
import { getUserFormsQuery } from "@/features/forms/queries";
import { authenticatedQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";

export default async function FormsPage() {
  const [forms, t] = await Promise.all([
    authenticatedQuery(
      async ({ supabase, userId }) =>
        await getUserFormsQuery({ userId, supabase }),
    ),
    getTranslations(),
  ]);

  return (
    <DashboardWrapper title={t("dashboard.forms.title")}>
      <FormsTable data={forms} />
    </DashboardWrapper>
  );
}
