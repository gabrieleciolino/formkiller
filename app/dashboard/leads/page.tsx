import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import LeadsTable from "@/app/dashboard/leads/table";
import { getUserLeadsQuery } from "@/features/leads/queries";
import { authenticatedQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";

export default async function LeadsPage() {
  const [leads, t] = await Promise.all([
    authenticatedQuery(async ({ supabase, userId }) =>
      getUserLeadsQuery({ supabase, userId }),
    ),
    getTranslations(),
  ]);

  return (
    <DashboardWrapper title={t("dashboard.leads.title")}>
      <LeadsTable data={leads} />
    </DashboardWrapper>
  );
}
