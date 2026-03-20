import { Button } from "@/components/ui/button";
import CreateFormForm from "@/features/forms/components/create-form-form";
import { canUseProFeatures } from "@/lib/account";
import { authenticatedQuery } from "@/lib/queries";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function CreateFormPage() {
  const [t, isProEnabled] = await Promise.all([
    getTranslations(),
    authenticatedQuery(async ({ userRole, userTier }) =>
      canUseProFeatures({ role: userRole, tier: userTier }),
    ),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-foreground">
          {t("forms.create.title")}
        </h2>
        <Button asChild variant="outline" size="sm">
          <Link href={urls.dashboard.forms.index}>
            {t("dashboard.forms.detail.back")}
          </Link>
        </Button>
      </div>
      <CreateFormForm
        detailPathPrefix={urls.dashboard.forms.index}
        allowProFeatures={isProEnabled}
      />
    </div>
  );
}
