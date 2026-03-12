import AdminSessionsTable from "@/app/admin/sessions/table";
import { getAdminSessionsQuery } from "@/features/sessions/queries";
import { adminQuery } from "@/lib/queries";
import { getTranslations } from "next-intl/server";

export default async function AdminSessionsPage() {
  const [sessions, t] = await Promise.all([
    adminQuery(async ({ supabase }) => getAdminSessionsQuery({ supabase })),
    getTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">
        {t("dashboard.sessions.title")}
      </h2>
      <AdminSessionsTable data={sessions} />
    </div>
  );
}
