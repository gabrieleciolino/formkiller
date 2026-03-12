import AdminFormsTable from "@/app/admin/forms/table";
import { Button } from "@/components/ui/button";
import { getAdminFormsQuery } from "@/features/forms/queries";
import { adminQuery } from "@/lib/queries";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function AdminFormsPage() {
  const [forms, t] = await Promise.all([
    adminQuery(async ({ supabase }) => getAdminFormsQuery({ supabase })),
    getTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-foreground">
          {t("dashboard.forms.title")}
        </h2>
        <Button asChild>
          <Link href={urls.admin.forms.create}>{t("forms.create.trigger")}</Link>
        </Button>
      </div>
      <AdminFormsTable data={forms} />
    </div>
  );
}
