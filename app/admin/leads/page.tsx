import AdminLeadsTable from "@/app/admin/leads/table";
import { getAdminLeadsQuery } from "@/features/leads/queries";
import { adminQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";

export default async function AdminLeadsPage() {
  const [leads, t] = await Promise.all([
    adminQuery(async ({ supabase }) => getAdminLeadsQuery({ supabase })),
    getTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">
        {t("dashboard.leads.title")}
      </h2>
      <AdminLeadsTable data={leads} />
    </div>
  );
}
