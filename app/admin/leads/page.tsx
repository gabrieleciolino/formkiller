import { getTranslations } from "next-intl/server";

export default async function AdminLeadsPage() {
  const t = await getTranslations();

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium text-foreground">
        {t("dashboard.leads.title")}
      </h2>
      <p className="text-sm text-muted-foreground">Placeholder page.</p>
    </div>
  );
}
