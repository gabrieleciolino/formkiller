import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import SessionsTable from "@/app/dashboard/sessions/table";
import SessionsTableControls from "@/features/sessions/components/sessions-table-controls";
import { getUserSessionsTableQuery } from "@/features/sessions/queries";
import { sessionsTableSearchParamsParsers } from "@/features/sessions/table-search-params";
import { authenticatedQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";
import { createLoader } from "nuqs/server";

const loadSessionsTableSearchParams = createLoader(sessionsTableSearchParamsParsers);

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await loadSessionsTableSearchParams(searchParams);
  const [sessionsResult, t] = await Promise.all([
    authenticatedQuery(async ({ supabase, userId }) =>
      getUserSessionsTableQuery({ supabase, userId, params }),
    ),
    getTranslations(),
  ]);

  return (
    <DashboardWrapper title={t("dashboard.sessions.title")}>
      <SessionsTableControls
        page={params.page}
        total={sessionsResult.total}
        totalPages={sessionsResult.totalPages}
      />
      <SessionsTable data={sessionsResult.items} />
    </DashboardWrapper>
  );
}
