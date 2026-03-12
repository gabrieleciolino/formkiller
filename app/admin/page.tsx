import { getTranslations } from "next-intl/server";

export default async function AdminPage() {
  const t = await getTranslations();

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium text-foreground">Admin</h2>
      <p className="text-sm text-muted-foreground">
        {t("dashboard.forms.title")}: placeholder.
      </p>
    </div>
  );
}
