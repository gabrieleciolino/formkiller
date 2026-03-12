import { getTranslations } from "next-intl/server";

export default async function AdminFormDetailPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const [{ formId }, t] = await Promise.all([params, getTranslations()]);

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium text-foreground">
        {t("dashboard.forms.title")}
      </h2>
      <p className="text-sm text-muted-foreground">Placeholder page for form {formId}.</p>
    </div>
  );
}
