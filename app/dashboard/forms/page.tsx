import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import { Button } from "@/components/ui/button";
import FormsTable from "@/app/dashboard/forms/table";
import FormsTableControls from "@/features/forms/components/forms-table-controls";
import { getUserFormsTableQuery } from "@/features/forms/queries";
import { formTableSearchParamsParsers } from "@/features/forms/table-search-params";
import { authenticatedQuery } from "@/lib/queries";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { createLoader } from "nuqs/server";

const loadFormTableSearchParams = createLoader(formTableSearchParamsParsers);

export default async function FormsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await loadFormTableSearchParams(searchParams);
  const [formsResult, t] = await Promise.all([
    authenticatedQuery(async ({ supabase, userId }) =>
      getUserFormsTableQuery({
        userId,
        supabase,
        params,
      }),
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
      <FormsTableControls
        page={params.page}
        total={formsResult.total}
        totalPages={formsResult.totalPages}
      />
      <FormsTable data={formsResult.items} />
    </DashboardWrapper>
  );
}
