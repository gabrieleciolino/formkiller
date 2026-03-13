import { Button } from "@/components/ui/button";
import CreateTestForm from "@/features/tests/components/create-test-form";
import { urls } from "@/lib/urls";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function AdminTestsCreatePage() {
  const t = await getTranslations();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-foreground">
          {t("tests.create.title")}
        </h2>
        <Button asChild variant="outline" size="sm">
          <Link href={urls.admin.tests.index}>
            {t("dashboard.tests.detail.back")}
          </Link>
        </Button>
      </div>

      <CreateTestForm />
    </div>
  );
}
