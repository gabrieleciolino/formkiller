import AdminTestsTable from "@/app/admin/tests/table";
import { Button } from "@/components/ui/button";
import { getAdminTestsQuery } from "@/features/tests/queries";
import { adminQuery } from "@/lib/queries";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function AdminTestsPage() {
  const [tests, t] = await Promise.all([
    adminQuery(async ({ supabase }) => getAdminTestsQuery({ supabase })),
    getTranslations(),
  ]);

  const labels = {
    columns: {
      name: t("dashboard.tests.columns.name"),
      slug: t("dashboard.tests.columns.slug"),
      language: t("dashboard.tests.columns.language"),
      status: t("dashboard.tests.columns.status"),
      createdAt: t("dashboard.tests.columns.createdAt"),
      actions: t("dashboard.tests.columns.actions"),
      view: t("dashboard.tests.columns.view"),
      open: t("dashboard.tests.columns.open"),
      delete: t("dashboard.tests.columns.delete"),
      confirmDelete: t("dashboard.tests.columns.confirmDelete"),
    },
    languages: {
      en: t("forms.languages.en"),
      it: t("forms.languages.it"),
      es: t("forms.languages.es"),
    },
    statuses: {
      draft: t("tests.status.draft"),
      published: t("tests.status.published"),
    },
  } as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-foreground">
          {t("dashboard.tests.title")}
        </h2>
        <Button asChild>
          <Link href={urls.admin.tests.create}>{t("tests.create.trigger")}</Link>
        </Button>
      </div>
      <AdminTestsTable data={tests} labels={labels} />
    </div>
  );
}
