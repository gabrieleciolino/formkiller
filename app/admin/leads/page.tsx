import AdminLeadsTable from "@/app/admin/leads/table";
import LeadsTableControls from "@/features/leads/components/leads-table-controls";
import { getAdminLeadsTableQuery } from "@/features/leads/queries";
import { leadsTableSearchParamsParsers } from "@/features/leads/table-search-params";
import { adminQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";
import { createLoader } from "nuqs/server";

const loadLeadsTableSearchParams = createLoader(leadsTableSearchParamsParsers);

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await loadLeadsTableSearchParams(searchParams);
  const [leadsResult, t] = await Promise.all([
    adminQuery(async ({ supabase }) =>
      getAdminLeadsTableQuery({
        supabase,
        params,
      }),
    ),
    getTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">
        {t("dashboard.leads.title")}
      </h2>
      <LeadsTableControls
        page={params.page}
        total={leadsResult.total}
        totalPages={leadsResult.totalPages}
      />
      <AdminLeadsTable data={leadsResult.items} />
    </div>
  );
}
