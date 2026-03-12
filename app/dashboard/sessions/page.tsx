import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import SessionsTable from "@/app/dashboard/sessions/table";
import { getUserSessionsQuery } from "@/features/sessions/queries";
import { authenticatedQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";

export default async function SessionsPage() {
  const [sessions, t] = await Promise.all([
    authenticatedQuery(async ({ supabase, userId }) =>
      getUserSessionsQuery({ supabase, userId }),
    ),
    getTranslations(),
  ]);

  return (
    <DashboardWrapper title={t("dashboard.sessions.title")}>
      <SessionsTable data={sessions} />
    </DashboardWrapper>
  );
}
