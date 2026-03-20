import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import LeadsTable from "@/app/dashboard/leads/table";
import LeadsTableControls from "@/features/leads/components/leads-table-controls";
import { getUserLeadsTableQuery } from "@/features/leads/queries";
import { leadsTableSearchParamsParsers } from "@/features/leads/table-search-params";
import { authenticatedQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";
import { createLoader } from "nuqs/server";

const loadLeadsTableSearchParams = createLoader(leadsTableSearchParamsParsers);

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await loadLeadsTableSearchParams(searchParams);
  const [leadsResult, t] = await Promise.all([
    authenticatedQuery(async ({ supabase, userId }) =>
      getUserLeadsTableQuery({
        supabase,
        userId,
        params,
      }),
    ),
    getTranslations(),
  ]);

  return (
    <DashboardWrapper title={t("dashboard.leads.title")}>
      <LeadsTableControls
        page={params.page}
        total={leadsResult.total}
        totalPages={leadsResult.totalPages}
      />
      <LeadsTable data={leadsResult.items} />
    </DashboardWrapper>
  );
}
