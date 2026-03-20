import AdminSessionsTable from "@/app/admin/sessions/table";
import SessionsTableControls from "@/features/sessions/components/sessions-table-controls";
import { getAdminSessionsTableQuery } from "@/features/sessions/queries";
import { sessionsTableSearchParamsParsers } from "@/features/sessions/table-search-params";
import { adminQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";
import { createLoader } from "nuqs/server";

const loadSessionsTableSearchParams = createLoader(sessionsTableSearchParamsParsers);

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await loadSessionsTableSearchParams(searchParams);
  const [sessionsResult, t] = await Promise.all([
    adminQuery(async ({ supabase }) =>
      getAdminSessionsTableQuery({ supabase, params }),
    ),
    getTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">
        {t("dashboard.sessions.title")}
      </h2>
      <SessionsTableControls
        page={params.page}
        total={sessionsResult.total}
        totalPages={sessionsResult.totalPages}
      />
      <AdminSessionsTable data={sessionsResult.items} />
    </div>
  );
}
