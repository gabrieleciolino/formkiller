import AdminFormsTable from "@/app/admin/forms/table";
import { Button } from "@/components/ui/button";
import FormsTableControls from "@/features/forms/components/forms-table-controls";
import { getAdminFormsTableQuery } from "@/features/forms/queries";
import { formTableSearchParamsParsers } from "@/features/forms/table-search-params";
import { adminQuery } from "@/lib/queries";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { createLoader } from "nuqs/server";

const loadFormTableSearchParams = createLoader(formTableSearchParamsParsers);

export default async function AdminFormsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await loadFormTableSearchParams(searchParams);
  const [formsResult, t] = await Promise.all([
    adminQuery(async ({ supabase }) =>
      getAdminFormsTableQuery({
        supabase,
        params,
      }),
    ),
    getTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-foreground">
          {t("dashboard.forms.title")}
        </h2>
        <Button asChild>
          <Link href={urls.admin.forms.create}>{t("forms.create.trigger")}</Link>
        </Button>
      </div>
      <FormsTableControls
        page={params.page}
        total={formsResult.total}
        totalPages={formsResult.totalPages}
      />
      <AdminFormsTable data={formsResult.items} />
    </div>
  );
}
