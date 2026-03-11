import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import LeadsTable from "@/app/dashboard/leads/table";
import { getLeadsQuery } from "@/features/leads/queries";
import { authenticatedQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";

export default async function LeadsPage() {
  const [leads, t] = await Promise.all([
    authenticatedQuery(async ({ supabase, userId }) =>
      getLeadsQuery({ supabase, userId }),
    ),
    getTranslations("dashboard.leads"),
  ]);

  return (
    <DashboardWrapper title={t("title")}>
      <LeadsTable data={leads} />
    </DashboardWrapper>
  );
}
