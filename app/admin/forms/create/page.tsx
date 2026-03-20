import CreateFormForm from "@/features/forms/components/create-form-form";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminFormsCreatePage() {
  const t = await getTranslations();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-foreground">
          {t("forms.create.title")}
        </h2>
        <Button asChild variant="outline" size="sm">
          <Link href={urls.admin.forms.index}>
            {t("dashboard.forms.detail.back")}
          </Link>
        </Button>
      </div>
      <CreateFormForm
        detailPathPrefix={urls.admin.forms.index}
        allowProFeatures
      />
    </div>
  );
}
