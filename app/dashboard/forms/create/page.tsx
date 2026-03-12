import DashboardWrapper from "@/app/dashboard/__components/wrapper";
import { Button } from "@/components/ui/button";
import CreateFormForm from "@/features/forms/components/create-form-form";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function CreateFormPage() {
  const t = await getTranslations();

  return (
    <DashboardWrapper
      title={t("forms.create.title")}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href={urls.dashboard.forms.index}>
            {t("dashboard.forms.detail.back")}
          </Link>
        </Button>
      }
    >
      <CreateFormForm />
    </DashboardWrapper>
  );
}
