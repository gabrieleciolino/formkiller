import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import { Button } from "@/components/ui/button";
import FormsTable from "@/app/dashboard/forms/table";
import { getUserFormsQuery } from "@/features/forms/queries";
import { authenticatedQuery } from "@/lib/queries";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function FormsPage() {
  const [forms, t] = await Promise.all([
    authenticatedQuery(
      async ({ supabase, userId }) =>
        await getUserFormsQuery({ userId, supabase }),
    ),
    getTranslations(),
  ]);

  return (
    <DashboardWrapper
      title={t("dashboard.forms.title")}
      actions={
        <Button asChild>
          <Link href={urls.dashboard.forms.create}>{t("forms.create.trigger")}</Link>
        </Button>
      }
    >
      <FormsTable data={forms} />
    </DashboardWrapper>
  );
}
