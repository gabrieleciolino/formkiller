import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import LeadsTable from "@/app/dashboard/leads/table";
import { getLeadsQuery } from "@/features/leads/queries";
import { authenticatedQuery } from "@/lib/queries";

export default async function LeadsPage() {
  const leads = await authenticatedQuery(async ({ supabase, userId }) =>
    getLeadsQuery({ supabase, userId }),
  );

  return (
    <DashboardWrapper title="Leads">
      <LeadsTable data={leads} />
    </DashboardWrapper>
  );
}
